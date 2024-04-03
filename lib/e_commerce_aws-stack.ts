import * as cdk from 'aws-cdk-lib';
import * as lambdaNodeJs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as cwlogs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface ECommerceAPIStackProps extends cdk.StackProps {
  productsFetchHandler: lambdaNodeJs.NodejsFunction;
  productsAdminHandler: lambdaNodeJs.NodejsFunction;
  ordersHandler: lambdaNodeJs.NodejsFunction;
}

export class ECommerceAPIStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props: ECommerceAPIStackProps) {
    super(scope, id, props);

    const logGroup = new cwlogs.LogGroup(this, "ECommerceApiLogs");
    const api = new apigateway.RestApi(this, "ECommerceApi", {
      restApiName: "ECommerceApi",
      cloudWatchRole: true,
      deployOptions: {
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          caller: true,
          user: true
        })
      }
    });

    this.createProductsService(props, api);
    this.createOrdersService(props, api);
  }

  private createOrdersService(props: ECommerceAPIStackProps, api: apigateway.RestApi) {
    const ordersIntegration = new apigateway.LambdaIntegration(props.ordersHandler);

    // resource - /orders
    const  ordersResource = api.root.addResource("orders");

    // GET Method
    ordersResource.addMethod("GET", ordersIntegration);

    // DELETE Validation
    const ordersDeletionValidator = new apigateway.RequestValidator(this, "OrderDeletionValidator", {
       restApi: api,
       requestValidatorName: "OrderDeletionValidator",
       validateRequestParameters: true,
    });

    ordersResource.addMethod("DELETE", ordersIntegration, {
      requestParameters: {
        'method.request.querystring.email': true,
        'method.request.querystring.orderId': true
      },
      requestValidator: ordersDeletionValidator
    });

    // POST Method
    ordersResource.addMethod("POST", ordersIntegration);
  }

  private createProductsService(props: ECommerceAPIStackProps, api: apigateway.RestApi) {
    const productsFetchIntegration = new apigateway.LambdaIntegration(props.productsFetchHandler);

    const productsResource = api.root.addResource("products");
    productsResource.addMethod("GET", productsFetchIntegration);

    const productIdResource = productsResource.addResource("{id}");
    productIdResource.addMethod("GET", productsFetchIntegration);

    const productsAdminIntegration = new apigateway.LambdaIntegration(props.productsAdminHandler);
    productIdResource.addMethod("POST", productsAdminIntegration);
    productIdResource.addMethod("PUT", productsAdminIntegration);
    productIdResource.addMethod("DELETE", productsAdminIntegration);
  }
}