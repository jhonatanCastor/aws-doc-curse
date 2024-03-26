import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { Context } from "aws-lambda";
import { ProductsRepository } from "/opt/nodejs/productsLayer";
import { DynamoDB } from "aws-sdk";

const productsDdb = process.env.PRODUCT_DDB!;
const ddbClient = new DynamoDB.DocumentClient();
const productsRepository = new ProductsRepository(ddbClient, productsDdb);

export async function handler(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
    if (event.httpMethod === 'GET' && event.resource === "/products") {
      const products = await productsRepository.getAllProducts();

      return {
        statusCode: 200,
        body: JSON.stringify(products)
      };
    } else if (event.resource === "/products/{id}") {
      const productId = event.pathParameters!.id as string;

      try {
        const product = await productsRepository.getProductById(productId);

        return {
          statusCode: 200,
          body: JSON.stringify(product)
        };
      } catch (error) {
        console.error((<Error>error).message);
        return {
          statusCode: 404,
          body: JSON.stringify({ message: "Product not found" })
        };
      }
    }

    return {
      statusCode: 404,
      body: JSON.stringify({
        message: "Not Found"
      })
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" })
    };
  }
}
