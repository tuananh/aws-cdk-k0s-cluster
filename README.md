aws-cdk-k0s-cluster
===================

⚠️ DO NOT USE IN PRODUCTION ⚠️

This serves purely as an experiment for me to create a test k0s cluster for testing purpose with Graviton spot instances.

This goes against every best practices as I'm provisioning everything in public subnets :D

## Learning notes

- ETCD_UNSUPPORTED_ARCH=arm64 is needed. See the [issue here](https://github.com/k0sproject/k0s/issues/424). This is why we need to set environment variable in `k0scontroller.service`.


## Getting started

- Install cdk cli with `npm install aws-cdk -g`
- Install `projen` with `npm install projen -g`
- Build with `npm run build`
- Test with `npm run test`
## How to use


```ts
import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as k0s from '../../src';

const app = new cdk.App();

const env = {
  region: app.node.tryGetContext('region') || process.env.CDK_INTEG_REGION || process.env.CDK_DEFAULT_REGION,
  account: app.node.tryGetContext('account') || process.env.CDK_INTEG_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT
};

const stack = new cdk.Stack(app, 'k0sCluster', { env })

new k0s.Cluster(stack, 'Cluster', {
  vpc: k0s.VpcProvider.getOrCreate(stack),
  spotWorkerNodes: true,
  workerMinCapacity: 3,
  workerInstanceType: new ec2.InstanceType('m6g.medium'),
  controlPlaneInstanceType: new ec2.InstanceType('m6g.medium'),
  bucketRemovalPolicy: cdk.RemovalPolicy.DESTROY
})
```

For complete example, you can go to `example` folder, do a `cdk bootstrap` and then `cdk deploy` from there.

```sh
cd example
cdk bootstrap
cdk deploy
```

## License

[MIT License](./LICENSE)