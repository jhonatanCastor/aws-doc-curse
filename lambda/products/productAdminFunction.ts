import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { Context } from "aws-lambda";
import { Product, ProductsRepository } from "/opt/nodejs/productsLayer";
import { DynamoDB, Lambda } from "aws-sdk";
import { ProductEvent, ProductEventType } from "/opt/nodejs/productEventsLayer";

const productsDdb = process.env.PRODUCT_DDB!;
const productEventFunctionName = process.env.PRODUCT_EVENTS_FUNCTION_NAME!;
const ddbClient = new DynamoDB.DocumentClient();
const lambdaClient = new Lambda();
const productsRepository = new ProductsRepository(ddbClient, productsDdb);

export async function handler(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {

  const lambdaRequestId = context.awsRequestId;
  const apiRequestId = event.requestContext.requestId;

  try {
    if (event.resource === "/products") {
      const product = JSON.parse(event.body!) as Product;
      const productCreate = await productsRepository.create(product);

      const response = await sendProductEvent(productCreate, ProductEventType.CREATED, "matilde@siecola.com.br", lambdaRequestId);

      console.log(response);

      return {
        statusCode: 201,
        body: JSON.stringify(productCreate)
      };

    } else if (event.resource === "/products/{id}") {
      const productId = event.pathParameters!.id as string;

      if (event.httpMethod === 'PUT') {
        const product = JSON.parse(event.body!) as Product;
        const productUpdated = await productsRepository.updateProduct(productId, product);

        const response = await sendProductEvent(productUpdated, ProductEventType.UPDATED, "doralice@siecola.com.br", lambdaRequestId);

        console.log(response);

        return {
          statusCode: 200,
          body: JSON.stringify(productUpdated)
        };

      } else if (event.httpMethod === 'DELETE') {
        const product = await productsRepository.deleteProduct(productId);

        const response = await sendProductEvent(product, ProductEventType.DELETED, "aluizo@siecola.com.br", lambdaRequestId);

        console.log(response);

        return {
          statusCode: 200,
          body: JSON.stringify(product)
        };
      }
    }

    return {
      statusCode: 400,
      body: "Bad request"
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" })
    };
  }
}


function sendProductEvent(product: Product, eventType: ProductEventType, email: string, lambdaRequestId: string) {

  const event: ProductEvent = {
    email: email,
    eventType: eventType,
    productCode: product.code,
    productId: product.id,
    productPrice: product.price,
    requestId: lambdaRequestId
  }

  return lambdaClient.invoke({
    FunctionName: productEventFunctionName,
    Payload: JSON.stringify(event),
    InvocationType: "RequestResponse"
  }).promise()
}