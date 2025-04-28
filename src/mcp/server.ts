import { MCPServer, MCPRequest, MCPResponse, MCPNextFunction } from '@modelcontextprotocol/typescript-sdk';

import { db } from '../adapters/db.adapter';

/**
 * This file demonstrates how to create an MCP server that exposes your
 * product and order data through the Model Context Protocol.
 */

// Create a new MCP server
const server = new MCPServer({
  name: 'E-Commerce MCP Server',
  description: 'Provides access to product catalog and order information',
  version: '1.0.0',
});

import logger from '../utils/logger';

// Add request logging middleware
server.use(async (req: MCPRequest, res: MCPResponse, next: MCPNextFunction) => {
  logger.info({ method: req.method, path: req.path }, 'MCP Server request');

  // Capture the original send method to log responses
  const originalSend = res.send;
  res.send = function (body: string) {
    const preview = typeof body === 'string' ? body.substring(0, 100) : JSON.stringify(body).substring(0, 100);
    logger.info({ preview: `${preview}...` }, 'MCP Server response');
    return originalSend.call(this, body);
  };

  await next();
});

// Define resources for products
server.addResource({
  name: 'products',
  description: 'Product catalog information',
  async fetch() {
    const products = await db.listProducts();
    return {
      content: JSON.stringify(products),
      mediaType: 'application/json',
    };
  },
});

// Define a resource for a specific product
server.addResource({
  name: 'product',
  description: 'Information about a specific product',
  parameters: [
    {
      name: 'id',
      description: 'Product ID',
      required: true,
    },
  ],
  async fetch(params: { id: string; }) {
    const productId = params?.id as string;
    if (!productId) {
      throw new Error('Product ID is required');
    }

    const product = await db.getProduct(productId);
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    return {
      content: JSON.stringify(product),
      mediaType: 'application/json',
    };
  },
});

// Define interfaces for tool parameters
interface SearchProductsParams {
  query: string;
}

interface CreateOrderParams {
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

// Define a tool for searching products
server.addTool({
  name: 'searchProducts',
  description: 'Search for products by name or description',
  parameters: [
    {
      name: 'query',
      description: 'Search query',
      required: true,
    },
  ],
  async execute(params: SearchProductsParams) {
    logger.info({ params }, 'MCP Server tool params');

    const query = params?.query as string;
    if (!query) {
      throw new Error('Search query is required');
    }

    const allProducts = await db.listProducts();
    const results = allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase())
    );

    const response = {
      result: JSON.stringify(results),
      mediaType: 'application/json',
    };

    logger.info({ responsePreview: JSON.stringify(response).substring(0, 100) + '...' }, 'MCP Server tool response');
    return response;
  },
});

// Define a tool for creating orders
server.addTool({
  name: 'createOrder',
  description: 'Create a new order',
  parameters: [
    {
      name: 'userId',
      description: 'User ID',
      required: true,
    },
    {
      name: 'items',
      description: 'Order items (array of {productId, quantity})',
      required: true,
    },
  ],
  async execute(params: CreateOrderParams) {
    logger.info({ params }, 'MCP Server tool params');

    const userId = params?.userId as string;
    const items = params?.items as Array<{ productId: string; quantity: number }>;

    if (!userId || !items) {
      throw new Error('User ID and items are required');
    }

    // Calculate prices and create order items
    const orderItems = [];
    for (const item of items) {
      const product = await db.getProduct(item.productId);
      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      });
    }

    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = await db.createOrder({
      userId,
      items: orderItems,
      total,
      status: 'pending',
    });

    const response = {
      result: JSON.stringify(order),
      mediaType: 'application/json',
    };

    logger.info({ responsePreview: JSON.stringify(response).substring(0, 100) + '...' }, 'MCP Server tool response');
    return response;
  },
});

// Start the server
export async function startMCPServer(port = 8080) {
  await server.listen(port);
  logger.info({ port }, 'MCP Server running');
  return server;
}

export { server };
