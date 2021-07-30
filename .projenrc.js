const {
  AwsCdkConstructLibrary,
  DependenciesUpgradeMechanism,
} = require('projen');

const AWS_CDK_LATEST_RELEASE = '1.62.0';
const PROJECT_NAME = 'cdk-k0s-cluster';
const PROJECT_DESCRIPTION = 'Bootstrap a test k0s cluster with Graviton spot instances';
const AUTOMATION_TOKEN = 'PROJEN_GITHUB_TOKEN';

const project = new AwsCdkConstructLibrary({
  authorName: 'Tuan Anh Tran',
  authorEmail: 'me@tuananh.org',
  name: PROJECT_NAME,
  repository: 'https://github.com/tuananh/aws-cdk-k0s-cluster',
  description: PROJECT_DESCRIPTION,
  license: 'MIT',
  copyrightPeriod: '2021',
  keywords: [
    'aws',
    'kubernetes',
    'k0s',
    'graviton',
    'spot',
  ],
  autoApproveOptions: {
    secret: 'PROJEN_GITHUB_TOKEN',
  },
  depsUpgrade: DependenciesUpgradeMechanism.githubWorkflow({
    workflowOptions: {
      labels: ['auto-approve', 'auto-merge'],
      secret: AUTOMATION_TOKEN,
    },
  }),
  autoApproveOptions: {
    secret: 'GITHUB_TOKEN',
    allowedUsernames: ['tuananh'],
  },
  defaultReleaseBranch: 'master',
  catalog: {
    twitter: 'tuananh',
    announce: false,
  },
  cdkVersion: AWS_CDK_LATEST_RELEASE,
  cdkDependencies: [
    '@aws-cdk/core',
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-s3',
    '@aws-cdk/aws-iam',
    '@aws-cdk/aws-autoscaling',
    '@aws-cdk/custom-resources',
    '@aws-cdk/aws-logs',
    '@aws-cdk/aws-lambda',
  ],
  python: {
    distName: 'cdk-k0s-cluster',
    module: 'cdk_k0s_cluster',
  },
});

project.package.addField('resolutions', {
  'trim-newlines': '3.0.1',
});


const common_exclude = ['cdk.out', 'cdk.context.json', 'images', 'yarn-error.log'];
project.npmignore.exclude(...common_exclude);
project.gitignore.exclude(...common_exclude);

project.synth();
