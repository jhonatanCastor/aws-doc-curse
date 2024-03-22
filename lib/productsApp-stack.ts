import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodeJs from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export class ProductsAppStack extends cdk.Stack {
  readonly productsFetchHandler: lambdaNodeJs.NodejsFunction;
  readonly productAdminHandler: lambdaNodeJs.NodejsFunction;
  readonly productsDbd: cdk.aws_dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.productsDbd = new cdk.aws_dynamodb.Table(this, 'ProductsDB', {
      tableName: 'Products',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: {
        name: "id",
        type: cdk.aws_dynamodb.AttributeType.STRING
      },
      billingMode: cdk.aws_dynamodb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1
    });

    const productsLayerArn = ssm.StringParameter.valueForStringParameter(this, "ProductsLayerVersionArn");
    const productsLayer = lambda.LayerVersion.fromLayerVersionArn(this, "ProductsLayer", productsLayerArn);

    this.productsFetchHandler = new lambdaNodeJs.NodejsFunction(this, 'productsFetchHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      functionName: 'productsFetchFunction',
      entry: 'lambda/products/productsFetchFunction.ts',
      handler: 'handler',
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
      bundling: {
        minify: true,
        sourceMap: false
      },
      environment: {
        PRODUCT_DDB: this.productsDbd.tableName
      },
      layers: [productsLayer]
    })
    this.productsDbd.grantReadData(this.productsFetchHandler);

    //test
    this.productAdminHandler = new lambdaNodeJs.NodejsFunction(this, 'productAdminFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      functionName: 'productAdminFunction',
      entry: 'lambda/products/productAdminFunction.ts',
      handler: 'handler',
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
      bundling: {
        minify: true,
        sourceMap: false
      },
      environment: {
        PRODUCT_DDB: this.productsDbd.tableName
      },
      layers: [productsLayer]
    })

    this.productsDbd.grantReadWriteData(this.productAdminHandler);
  }
}