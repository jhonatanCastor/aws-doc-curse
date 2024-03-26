import * as cdk from 'aws-cdk-lib';
import { ProductsAppStack } from '../lib/productsApp-stack';
import { ECommerceAPIStack } from '../lib/e_commerce_aws-stack';
import { ProductsAppLayersStack } from '../lib/productsAppLayers-stack';
import { EventsDdbStack } from 'lib/eventsDdb-stack';

const app = new cdk.App();

const env: cdk.Environment = {
  account: "975050107385",
  region: "us-east-1"
};

const tags = {
  cost: "ECommerce",
  team: "SiecolaCode"
};


const productsAppLayersStack = new ProductsAppLayersStack(app, "ProductsAppLayers", {
  tags: tags,
  env: env
});


const eventDdBStack = new EventsDdbStack(app, "EventsDdb", {
  tags: tags,
  env: env,
});


const productsAppStack = new ProductsAppStack(app, "ProductsApp", {
  eventsDdb:  eventDdBStack.table,
  tags: tags,
  env: env
});
productsAppStack.addDependency(productsAppLayersStack);
productsAppStack.addDependency(eventDdBStack);


const eCommerceApiStack = new ECommerceAPIStack(app, "ECommerceApi", {
  productsFetchHandler: productsAppStack.productsFetchHandler,
  productsAdminHandler: productsAppStack.productAdminHandler,
  tags: tags,
  env: env
});
eCommerceApiStack.addDependency(productsAppStack);

