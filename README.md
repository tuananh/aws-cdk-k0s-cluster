aws-cdk-k0s-cluster
===================

⚠️ DO NOT USE IN PRODUCTION

This serves purely as an experiment for me to create a test k0s cluster for testing purpose with Graviton spot instances.

This goes against everything practices as I'm provisioning everything in public subnets :D

## Notes

- ETCD_UNSUPPORTED_ARCH=arm64 is needed. See the [issue here](https://github.com/k0sproject/k0s/issues/424).


## Getting started

- install cdk cli with `npm install aws-cdk -g`
- install `projen` with `npm install projen -g`
- build with `npm run build`
- test with `npm run test`
## Test

You can test this lib by going to `example` folder and then `cdk deploy` from there.
## Usage

To be updated

```ts
```
# Contributing

To be updated
## License

[MIT License](./LICENSE)