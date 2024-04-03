import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { v4 as uuid } from "uuid";

export interface Product {
  id: string;
  productName: string;
  code: string;
  price: number;
  model: string;
}

export class ProductsRepository {
  private ddClient: DocumentClient;
  private productsDdb: string;

  constructor(ddbClient: DocumentClient, productsDdb: string) {
    this.ddClient = ddbClient;
    this.productsDdb = productsDdb;
  }

  async getAllProducts(): Promise<Product[]> {
    try {
      const data = await this.ddClient.scan({
        TableName: this.productsDdb
      }).promise();
      return data.Items as Product[];
    } catch (error) {
      console.error("Error:", error);
      throw new Error("Failed to fetch products");
    }
  }

  async getProductById(productId: string): Promise<Product> {
    try {
      const data = await this.ddClient.get({
        TableName: this.productsDdb,
        Key: {
          id: productId
        }
      }).promise();
      if (data.Item) {
        return data.Item as Product;
      } else {
        throw new Error("Product not found");
      }
    } catch (error) {
      console.error("Error:", error);
      throw new Error("Failed to fetch product by id");
    }
  }

  async getProductsByIds(productsIds: string[]): Promise<Product[]> {
    const keys: {id: string;} [] = [];

    productsIds.forEach((productsIds) => {
      keys.push({id: productsIds})
    })

     const data = await this.ddClient.batchGet({
      RequestItems: {
        [this.productsDdb]: {
          Keys: keys
        }
      }
     }).promise()
     return data.Responses![this.productsDdb] as Product[]
  }

  async create(product: Product): Promise<Product> {
    try {
      product.id = uuid();
      await this.ddClient.put({
        TableName: this.productsDdb,
        Item: product
      }).promise();
      return product;
    } catch (error) {
      console.error("Error:", error);
      throw new Error("Failed to create product");
    }
  }

  async deleteProduct(productId: string): Promise<Product> {
    try {
      const data = await this.ddClient.delete({
        TableName: this.productsDdb,
        Key: {
          id: productId
        },
        ReturnValues: "ALL_OLD"
      }).promise();
      if (data.Attributes) {
        return data.Attributes as Product;
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      console.error("Error:", error);
      throw new Error("Failed to delete product");
    }
  }

  async updateProduct(productId: string, product: Product): Promise<Product> {
    try {
      const data = await this.ddClient.update({
        TableName: this.productsDdb,
        Key: {
          id: productId
        },
        ConditionExpression: 'attribute_exists(id)',
        ReturnValues: 'ALL_NEW',
        UpdateExpression: 'set productName = :n, code = :c, price = :p, model = :m',
        ExpressionAttributeValues: {
          ":n": product.productName,
          ":c": product.code,
          ":p": product.price,
          ":m": product.model
        }
      }).promise();
      data.Attributes!.id = productId;
      return data.Attributes as Product;
    } catch (error) {
      console.error("Error:", error);
      throw new Error("Failed to update product");
    }
  }
}
