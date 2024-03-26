import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';
export class ProductsAppLayersStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsLayers = new lambda.LayerVersion(this, "ProductsLayer", {
      code: lambda.Code.fromAsset('lambda/products/layers/productsLayer'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      layerVersionName: "ProductsLayer",
      removalPolicy: cdk.RemovalPolicy.RETAIN
    })
    new ssm.StringParameter(this, "ProductsLayersVersionArn", {
      parameterName: "ProductsLayerVersionArn",
      stringValue: productsLayers.layerVersionArn
    })


    const productEventsLayers = new lambda.LayerVersion(this, "ProductEventsLayer", {
      code: lambda.Code.fromAsset('lambda/products/layers/productEventsLayer'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      layerVersionName: "ProductEventsLayer",
      removalPolicy: cdk.RemovalPolicy.RETAIN
    })
    new ssm.StringParameter(this, "ProductEventsLayersVersionArn", {
      parameterName: "ProductEventsLayerVersionArn",
      stringValue: productEventsLayers.layerVersionArn
    })
  }
}