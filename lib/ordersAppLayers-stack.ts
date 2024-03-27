import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as smm from 'aws-cdk-lib/aws-ssm';

export class OrdersAppLayersSrack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const ordersLayer = new lambda.LayerVersion(this, 'OrdersLayer', {
      code: lambda.Code.fromAsset('lambda/orders/layers/ordersLayer'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      layerVersionName:  'OrdersLayer',
      removalPolicy: cdk.RemovalPolicy.RETAIN
    })

    // new smm.StringListParameter(this, 'OrdersLayerVersionArn', {
    //   parameterName: 'OrdersLayerVersionArn'
    // })
  }
}
