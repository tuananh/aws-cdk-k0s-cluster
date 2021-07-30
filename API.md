# API Reference <a name="API Reference"></a>

## Constructs <a name="Constructs"></a>

### Cluster <a name="cdk-k0s-cluster.Cluster"></a>

Represents the k0sCluster construct.

#### Initializer <a name="cdk-k0s-cluster.Cluster.Initializer"></a>

```typescript
import { Cluster } from 'cdk-k0s-cluster'

new Cluster(scope: Construct, id: string, props?: ClusterProps)
```

##### `scope`<sup>Required</sup> <a name="cdk-k0s-cluster.Cluster.parameter.scope"></a>

- *Type:* [`@aws-cdk/core.Construct`](#@aws-cdk/core.Construct)

---

##### `id`<sup>Required</sup> <a name="cdk-k0s-cluster.Cluster.parameter.id"></a>

- *Type:* `string`

---

##### `props`<sup>Optional</sup> <a name="cdk-k0s-cluster.Cluster.parameter.props"></a>

- *Type:* [`cdk-k0s-cluster.ClusterProps`](#cdk-k0s-cluster.ClusterProps)

---



#### Properties <a name="Properties"></a>

##### `controlPlaneInstanceType`<sup>Required</sup> <a name="cdk-k0s-cluster.Cluster.property.controlPlaneInstanceType"></a>

- *Type:* [`@aws-cdk/aws-ec2.InstanceType`](#@aws-cdk/aws-ec2.InstanceType)

The instance type of the control plane.

---

##### `endpointUri`<sup>Required</sup> <a name="cdk-k0s-cluster.Cluster.property.endpointUri"></a>

- *Type:* `string`

The endpoint URL of the control plan.

---

##### `workerInstanceType`<sup>Required</sup> <a name="cdk-k0s-cluster.Cluster.property.workerInstanceType"></a>

- *Type:* [`@aws-cdk/aws-ec2.InstanceType`](#@aws-cdk/aws-ec2.InstanceType)

The instance type of the worker node.

---


## Structs <a name="Structs"></a>

### ClusterProps <a name="cdk-k0s-cluster.ClusterProps"></a>

#### Initializer <a name="[object Object].Initializer"></a>

```typescript
import { ClusterProps } from 'cdk-k0s-cluster'

const clusterProps: ClusterProps = { ... }
```

##### `bucketRemovalPolicy`<sup>Optional</sup> <a name="cdk-k0s-cluster.ClusterProps.property.bucketRemovalPolicy"></a>

- *Type:* [`@aws-cdk/core.RemovalPolicy`](#@aws-cdk/core.RemovalPolicy)
- *Default:* cdk.RemovalPolicy.RETAIN

The bucket removal policy.

When specicified as `DESTROY`, the S3 bucket for the cluster state
will be completely removed on stack destroy.

---

##### `controlPlaneInstanceType`<sup>Optional</sup> <a name="cdk-k0s-cluster.ClusterProps.property.controlPlaneInstanceType"></a>

- *Type:* [`@aws-cdk/aws-ec2.InstanceType`](#@aws-cdk/aws-ec2.InstanceType)
- *Default:* mg6.medium

control plane node ec2 instance type.

---

##### `spotWorkerNodes`<sup>Optional</sup> <a name="cdk-k0s-cluster.ClusterProps.property.spotWorkerNodes"></a>

- *Type:* `boolean`
- *Default:* true

Run worker nodes as EC2 Spot.

---

##### `vpc`<sup>Optional</sup> <a name="cdk-k0s-cluster.ClusterProps.property.vpc"></a>

- *Type:* [`@aws-cdk/aws-ec2.IVpc`](#@aws-cdk/aws-ec2.IVpc)
- *Default:* create new VPC

VPC.

---

##### `workerInstanceType`<sup>Optional</sup> <a name="cdk-k0s-cluster.ClusterProps.property.workerInstanceType"></a>

- *Type:* [`@aws-cdk/aws-ec2.InstanceType`](#@aws-cdk/aws-ec2.InstanceType)
- *Default:* mg6.medium

worker node instance type.

---

##### `workerMinCapacity`<sup>Optional</sup> <a name="cdk-k0s-cluster.ClusterProps.property.workerMinCapacity"></a>

- *Type:* `number`
- *Default:* 3

minimal number of worker nodes.

---

## Classes <a name="Classes"></a>

### AmiProvider <a name="cdk-k0s-cluster.AmiProvider"></a>

The AMI provider to get the latest Amazon Linux 2 AMI for ARM64.

#### Initializer <a name="cdk-k0s-cluster.AmiProvider.Initializer"></a>

```typescript
import { AmiProvider } from 'cdk-k0s-cluster'

new AmiProvider()
```



#### Properties <a name="Properties"></a>

##### `amiId`<sup>Required</sup> <a name="cdk-k0s-cluster.AmiProvider.property.amiId"></a>

- *Type:* [`@aws-cdk/aws-ec2.IMachineImage`](#@aws-cdk/aws-ec2.IMachineImage)

---


### VpcProvider <a name="cdk-k0s-cluster.VpcProvider"></a>

The VPC provider to create or import the VPC.

#### Initializer <a name="cdk-k0s-cluster.VpcProvider.Initializer"></a>

```typescript
import { VpcProvider } from 'cdk-k0s-cluster'

new VpcProvider()
```


#### Static Functions <a name="Static Functions"></a>

##### `getOrCreate` <a name="cdk-k0s-cluster.VpcProvider.getOrCreate"></a>

```typescript
import { VpcProvider } from 'cdk-k0s-cluster'

VpcProvider.getOrCreate(scope: Construct)
```

###### `scope`<sup>Required</sup> <a name="cdk-k0s-cluster.VpcProvider.parameter.scope"></a>

- *Type:* [`@aws-cdk/core.Construct`](#@aws-cdk/core.Construct)

---




