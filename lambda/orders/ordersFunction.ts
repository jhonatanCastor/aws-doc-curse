import { DynamoDB } from 'aws-sdk';
import { Product, ProductsRepository } from '/opt/nodejs/productsLayer';
import * as AWSXRay from 'aws-xray-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Orders, OrdersRepository } from '/opt/nodejs/ordersLayer';
import { CarrierType, OrderRequest, OrderResponse, PaymentType, ShippingType } from '/opt/nodejs/ordersApiLayer';

interface OrderProductResponse {
  code: string,
  price: number,
}

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

      if (email) {
        if (orderId) {
          // GET one order from an user 
          try {
            const order = await orderRepository.getOrder(email, orderId);
            return {
              statusCode: 200,
              body: JSON.stringify(convertToOrdersResponse(order))
            }
          } catch (error) {
            console.log((<Error>error).message);
            return {
              statusCode: 404,
              body: (<Error>error).message
            }
          }
        } else {
          //GET all orders from an user
          const orders = await orderRepository.getOrdersByEmail(email);
          return {
            statusCode: 200,
            body: JSON.stringify(orders.map(convertToOrdersResponse))
          }
        }
      }
    } else {
      // GET all orders
      const orders = await orderRepository.getAllOrders();
      return {
        statusCode: 200,
        body: JSON.stringify(orders.map(convertToOrdersResponse))
      }
    }
  } else if (method === 'POST') {
    console.log('POST / orders');
    const orderRequest = JSON.parse(event.body!) as OrderRequest;
    const products = await productRepository.getProductsByIds(orderRequest.productIds);

    if (products.length === orderRequest.productIds.length) {
      const order = buildOrder(orderRequest, products);
      const orderCreated = await orderRepository.createOrder(order);
      return {
        statusCode: 201,
        body: JSON.stringify(convertToOrdersResponse(orderCreated))
      }
    } else {
      return {
        statusCode: 404,
        body: "Some products was not found"
      }
    }
  } else if (method === 'DELETE') {
    console.log('DELETE / orders');
    const email = event.queryStringParameters!.email!;
    const orderId = event.queryStringParameters!.orderId!;

    try {
      const orderDelete = await orderRepository.deleteOrder(email, orderId);
      return {
        statusCode: 200,
        body: JSON.stringify(convertToOrdersResponse(orderDelete))
      }
    } catch (error) {
      console.log((<Error>error).message);
      return {
        statusCode: 404,
        body: (<Error>error).message
      }
      
    }
  }
  return {
    statusCode: 400,
    body: "Bad request",
  }
}

function convertToOrdersResponse(order: Orders): OrderResponse {
  const orderProducts: OrderProductResponse[] = [];
  order.products.forEach((product) => {
    orderProducts.push({
      code: product.code,
      price: product.price
    })
  })
  const orderResponse: OrderResponse = {
    email: order.pk,
    id: order.sk!,
    createdAt: order.createdAt!,
    products: orderProducts,
    billing: {
      payment: order.billing.payment as PaymentType,
      totalPrice: order.billing.totalPrice
    },
    shipping: {
      type: order.shipping.type as ShippingType,
      carrier: order.shipping.carrier as CarrierType,
    }
  }
  return orderResponse
}

function buildOrder(orderRequest: OrderRequest, products: Product[]): Orders {
  const orderProducts: OrderProductResponse[] = [];
  let totalPrice = 0;

  products.forEach((product) => {
    totalPrice += product.price
    orderProducts.push({
      code: product.code,
      price: product.price
    })
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
    products: orderProducts

  }
  return order
}