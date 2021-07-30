import * as autoscaling from '@aws-cdk/aws-autoscaling';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';

const DEFAULT_INSTANCE_TYPE = ec2.InstanceType.of(ec2.InstanceClass.M6G, ec2.InstanceSize.MEDIUM);

export interface ClusterProps {
  /**
   * VPC
   *
   * @default - create new VPC
   */
  readonly vpc?: ec2.IVpc;

  /**
   * Run worker nodes as EC2 Spot
   *
   * @default true
   */
  readonly spotWorkerNodes?: boolean;

  /**
   * control plane node ec2 instance type
   *
   * @default mg6.medium
   */
  readonly controlPlaneInstanceType?: ec2.InstanceType;

  /**
   * worker node instance type
   *
   * @default mg6.medium
   */
  readonly workerInstanceType?: ec2.InstanceType;

  /**
   * minimal number of worker nodes
   *
   * @default 3
   */
  readonly workerMinCapacity?: number;

  /**
   * The bucket removal policy. When specicified as `DESTROY`, the S3 bucket for the cluster state
   * will be completely removed on stack destroy.
   *
   * @default - cdk.RemovalPolicy.RETAIN
   */
  readonly bucketRemovalPolicy?: cdk.RemovalPolicy;

}

/**
 * Represents the k0sCluster construct
 */
export class Cluster extends cdk.Construct {
  /**
   * The instance type of the control plane
   */
  readonly controlPlaneInstanceType: ec2.InstanceType;

  /**
   * The instance type of the worker node
   */
  readonly workerInstanceType: ec2.InstanceType;

  /**
   * The endpoint URL of the control plan
   */
  readonly endpointUri: string;

  constructor(scope: cdk.Construct, id: string, props: ClusterProps = {}) {
    super(scope, id);

    // VPC configuration
    const vpc = props.vpc ?? new ec2.Vpc(this, 'Vpc', { maxAzs: 3, natGateways: 1 });

    // S3 bucket to host K0s token + kubeconfig file
    // support s3 bucket autoDeleteObjects native.
    // see - https://docs.aws.amazon.com/cdk/api/latest/docs/aws-s3-readme.html#bucket-deletion
    // PR - https://github.com/aws/aws-cdk/commit/32e9c23be2852cfca79a57c90e52b9301b1c7081
    let k0sBucket: s3.Bucket;
    if (props.bucketRemovalPolicy === cdk.RemovalPolicy.DESTROY) {
      k0sBucket = new s3.Bucket(this, 'k0sBucket', {
        removalPolicy: props.bucketRemovalPolicy,
        autoDeleteObjects: true,
      });
    } else {
      k0sBucket = new s3.Bucket(this, 'k0sBucket', {
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      });
    }

    // control plane node Security Group
    const k0sControlPlaneSG = new ec2.SecurityGroup(this, 'k0s-controlplane-sg', { vpc });
    k0sControlPlaneSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'SSH');
    k0sControlPlaneSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(6443), 'k0s port');

    // worker nodes Security Group
    const k0sWorkerSG = new ec2.SecurityGroup(this, 'k0s-worker-SG', { vpc });
    // for this prototype the workers are being placed in a public subnet
    // ideally they should land on a private subnet
    /// also ingress traffic - ssh (bastion style) or 6443 - should come from the control plane node only
    k0sWorkerSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'SSH');
    k0sWorkerSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(6443), 'k0s port');

    // check if the user requires a particular instance type for workers and control plane
    // if not, the default instance type is used
    this.controlPlaneInstanceType = props.controlPlaneInstanceType ?? DEFAULT_INSTANCE_TYPE;
    this.workerInstanceType = props.workerInstanceType ?? DEFAULT_INSTANCE_TYPE;

    // create control plane node
    const k0sControlPlane = new ec2.Instance(this, 'k0s-controlplane', {
      instanceType: this.controlPlaneInstanceType,
      machineImage: new AmiProvider().amiId,
      vpc,
      vpcSubnets: {
        subnets: vpc.publicSubnets,
      },
      instanceName: 'k0s-controlplane',
      securityGroup: k0sControlPlaneSG,
    });

    k0sControlPlane.addUserData(`
       #!/bin/bash
       curl -sSLf https://get.k0s.sh | sudo sh
       k0s default-config > k0s.yaml
       sudo k0s install controller -c k0s.yaml
       sudo k0s start

       k0s token create --role=worker --expiry=100h > worker-token
       aws s3 cp worker-token s3://${k0sBucket.bucketName}/worker-token
       aws s3 cp /var/lib/k0s/pki/admin.conf s3://${k0sBucket.bucketName}/kubeconfig.yaml
     `);


    this.endpointUri = k0sControlPlane.instancePublicIp;

    // create launch template for worker ASG
    // prepare the userData
    const userData = ec2.UserData.forLinux();
    userData.addCommands(`
          #!/bin/bash
          curl -sSLf https://get.k0s.sh | sudo sh
          echo the bucket name is ${k0sBucket.bucketName} 
          aws s3 cp s3://${k0sBucket.bucketName}/worker-token /worker-token 
          sudo k0s install worker --token-file /worker-token
          sudo k0s start
    `);

    // create worker ASG
    const workerAsg = new autoscaling.AutoScalingGroup(this, 'WorkerAsg', {
      instanceType: this.workerInstanceType,
      machineImage: new AmiProvider().amiId,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      minCapacity: props.workerMinCapacity ?? 3,
    });

    const cfnInstanceProfile = workerAsg.node.tryFindChild('InstanceProfile') as iam.CfnInstanceProfile;
    const lt = new ec2.CfnLaunchTemplate(this, 'WorkerLaunchTemplate', {
      launchTemplateData: {
        imageId: new AmiProvider().amiId.getImage(this).imageId,
        instanceType: this.workerInstanceType.toString(),
        instanceMarketOptions: {
          marketType: props.spotWorkerNodes ? 'spot' : undefined,
          spotOptions: props.spotWorkerNodes ? {
            spotInstanceType: 'one-time',
          } : undefined,
        },
        userData: cdk.Fn.base64(userData.render()),
        iamInstanceProfile: {
          arn: cfnInstanceProfile.attrArn,
        },
      },
    });
    const cfnAsg = workerAsg.node.tryFindChild('ASG') as autoscaling.CfnAutoScalingGroup;
    cfnAsg.addPropertyDeletionOverride('LaunchConfigurationName');
    cfnAsg.addPropertyOverride('LaunchTemplate', {
      LaunchTemplateId: lt.ref,
      Version: lt.attrLatestVersionNumber,
    });

    workerAsg.addSecurityGroup(k0sWorkerSG);

    // enable the SSM session manager
    workerAsg.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));

    // grant the S3 write permission to the control plane node and read permissions to the worker nodes
    k0sBucket.grantWrite(k0sControlPlane.role);
    k0sBucket.grantRead(workerAsg.role);

    // endpoint info
    new cdk.CfnOutput(this, 'Endpoint', { value: `https://${k0sControlPlane.instancePublicIp}:6443` });

    // kubeconfig.yaml path
    new cdk.CfnOutput(this, 'Kubernetes configuration file', { value: `s3://${k0sBucket.bucketName}/kubeconfig.yaml` });

    workerAsg.node.addDependency(k0sControlPlane);
  }
}

/**
 * The AMI provider to get the latest Amazon Linux 2 AMI for ARM64
 */
export class AmiProvider {
  public get amiId() {
    return ec2.MachineImage.latestAmazonLinux({
      cpuType: ec2.AmazonLinuxCpuType.ARM_64,
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
    });
  }
}

/**
 * The VPC provider to create or import the VPC
 */
export class VpcProvider {
  public static getOrCreate(scope: cdk.Construct) {
    const vpc = scope.node.tryGetContext('use_default_vpc') === '1' ?
      ec2.Vpc.fromLookup(scope, 'Vpc', { isDefault: true }) :
      scope.node.tryGetContext('use_vpc_id') ?
        ec2.Vpc.fromLookup(scope, 'Vpc', { vpcId: scope.node.tryGetContext('use_vpc_id') }) :
        new ec2.Vpc(scope, 'Vpc', { maxAzs: 3, natGateways: 1 });
    return vpc;
  }
}
