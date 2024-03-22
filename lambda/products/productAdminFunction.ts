import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { Context } from "vm";
import { Product, ProductsRepository } from "/opt/nodejs/productsLayer";
import { DynamoDB } from "aws-sdk"

const productsDdb = process.env.PRODUCT_DDB!
const ddbClient = new DynamoDB.DocumentClient();
const productsRepository = new ProductsRepository(ddbClient, productsDdb);

export async function handler(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {

  if (event.resource === "/products") {
    const product = JSON.parse(event.body!) as Product;
    const productCreate = await productsRepository.create(product);

    return {
      statusCode: 201,
      body: JSON.stringify(productCreate)
    }

  } else if (event.resource === "/products/{id}") {
    const productId = event.pathParameters!.id as string;

    if (event.httpMethod === 'PUT') {
      const product = JSON.parse(event.body!) as Product;

      try {
        const productUpdated = await productsRepository.updateProduct(productId, product);

        return {
          statusCode: 200,
          body: JSON.stringify(productUpdated)
        }
      } catch (ConditionalCheckFailedException) {
        return {
          statusCode: 404,
          body: `The specified resource does not exist`
        }
      }

    } else if (event.httpMethod === 'DELETE') {

      try {
        const product = await productsRepository.deleteProduct(productId);

        return {
          statusCode: 200,
          body: JSON.stringify(product)
        }

      } catch (error) {
        console.error((<Error>error).message);
        return {
          statusCode: 404,
          body: (<Error>error).message
        }
      }
    }
  }

  return {
    statusCode: 400,
    body: "Bad request"
  }
}