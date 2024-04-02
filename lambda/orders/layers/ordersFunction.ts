import { DynamoDB } from 'aws-sdk';
import { Orders, OrdersRepository } from './ordersLayer/nodejs/orderRepository';
import { Product, ProductsRepository } from '/opt/nodejs/productsLayer';
import * as AWSXRay from 'aws-xray-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { OrderRequest, OrderResponse } from './ordersApiLayer/nodejs/orderApi';

AWSXRay.captureAWS(require("aws-sdk"));

const orderDdb = process.env.ORDERS_DDB!;
const productsDdb = process.env.PRODUCTS_DDB!;

const ddbClient = new DynamoDB.DocumentClient();

const orderRepository = new OrdersRepository(ddbClient, orderDdb);
const productRepository = new ProductsRepository(ddbClient, productsDdb);

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {

  const method = event.httpMethod;
  const apiRequestId = event.requestContext.requestId;
  const lambdaRequest = context.awsRequestId;

  if (method === 'GET') {
    console.log('GET / orders');
    if (event.queryStringParameters) {
      const email = event.queryStringParameters!.email;
      const orderId = event.queryStringParameters!.orderId;

      if(email) {
        if(orderId){
          // GET one order from an user 
 
        } else {
          //GET all orders from an user

        }
      }

    } else {
      // GET all orders
    }

  } else if (method === 'POST') {
    console.log('POST / orders');


  } else if (method === 'DELETE') {
    console.log('DELETE / orders');
    const email = event.queryStringParameters!.email;
    const orderId = event.queryStringParameters!.orderId;

  }

  return {
    statusCode: 400,
    body: "Bad request",
  }
}

function buildOrder(orderRequest: OrderRequest, products: Product[]): Orders {
  const orderProducts: OrderResponse[] = [];
  let totalPrice = 0;

  products.forEach((product) => {
    totalPrice += product.price
    // orderProducts.push({
    //   code: product.code,
    //   price: product.price
    // })
  })

  const order: Orders = {
    pk: orderRequest.email,
    billing: {
      payment: orderRequest.payment,
      totalPrice: totalPrice
    },
    shipping: {
      type: orderRequest.shipping.type,
      carrier: orderRequest.shipping.carrier
    },
    products: orderProducts as any

  }
  return order

}