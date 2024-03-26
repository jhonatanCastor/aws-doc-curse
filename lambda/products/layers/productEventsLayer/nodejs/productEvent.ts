export enum ProductEventType {
   CREATED = 'PRODUCT_CREATE',
   UPDATED = 'PRODUCT_UPDATED',
   DELETED = 'PRODUCT_DELETED'
}

export interface ProductEvent {
  requestId: string;
  eventType: ProductEventType;
  productId: string;
  productCode: string;
  productPrice: number;
  email: string;
}