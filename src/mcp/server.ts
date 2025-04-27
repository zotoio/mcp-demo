import { Resource, Tool, MCPServerConfig } from './types';
import { db } from '../adapters/db.adapter';
import { Product } from '../models/product.model';
import { Order } from '../models/order.model';
import * as http from 'http';
import * as url from 'url';

/**
 * This file demonstrates how to create an MCP server that exposes your
 * product and order data through the Model Context Protocol.
 */

// Custom MCP Server implementation
class MCPServer {
  private resources: Map<string, Resource> = new Map();
  private tools: Map<string, Tool> = new Map();
  private config: MCPServerConfig;
  private httpServer: http.Server | null = null;

  constructor(config: MCPServerConfig) {
    this.config = config;
  }

  addResource(resource: Resource): void {
    this.resources.set(resource.name, resource);
  }

  addTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  async listen(port: number): Promise<void> {
    return new Promise((resolve) => {
      this.httpServer = http.createServer(async (req, res) => {
        const parsedUrl = url.parse(req.url || '', true);
        const path = parsedUrl.pathname || '';
        
        // Log the incoming request
        console.log(`[MCP Server] ${req.method} ${path}`);
        
        res.setHeader('Content-Type', 'application/json');
        
        try {
          if (path === '/resources' && req.method === 'GET') {
            const resourceList = Array.from(this.resources.keys());
            res.statusCode = 200;
            res.end(JSON.stringify({ resources: resourceList }));
            return;
          }
          
          if (path.startsWith('/resources/') && req.method === 'GET') {
            const resourceName = path.split('/')[2];
            const resource = this.resources.get(resourceName);
            
            if (!resource) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: `Resource ${resourceName} not found` }));
              return;
            }
            
            const result = await resource.fetch(parsedUrl.query);
            res.statusCode = 200;
            const responseBody = JSON.stringify(result);
            console.log(`[MCP Server] Response: ${responseBody.substring(0, 100)}${responseBody.length > 100 ? '...' : ''}`);
            res.end(responseBody);
            return;
          }
          
          if (path === '/tools' && req.method === 'GET') {
            const toolList = Array.from(this.tools.keys());
            res.statusCode = 200;
            res.end(JSON.stringify({ tools: toolList }));
            return;
          }
          
          if (path.startsWith('/tools/') && req.method === 'POST') {
            const toolName = path.split('/')[2];
            const tool = this.tools.get(toolName);
            
            if (!tool) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: `Tool ${toolName} not found` }));
              return;
            }
            
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            
            req.on('end', async () => {
              try {
                const params = JSON.parse(body);
                console.log(`[MCP Server] Tool params: ${JSON.stringify(params)}`);
                const result = await tool.execute(params);
                res.statusCode = 200;
                const responseBody = JSON.stringify(result);
                console.log(`[MCP Server] Tool response: ${responseBody.substring(0, 100)}${responseBody.length > 100 ? '...' : ''}`);
                res.end(responseBody);
              } catch (error) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: `Error executing tool: ${error}` }));
              }
            });
            return;
          }
          
          console.log(`[MCP Server] 404 Not Found: ${path}`);
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Not found' }));
        } catch (error) {
          console.error(`[MCP Server] Error: ${error}`);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: `Server error: ${error}` }));
        }
      });
      
      this.httpServer.listen(port, () => {
        resolve();
      });
    });
  }
  
  close(): void {
    if (this.httpServer) {
      this.httpServer.close();
    }
  }
}

// Create a new MCP server
const server = new MCPServer({
  name: 'E-Commerce MCP Server',
  description: 'Provides access to product catalog and order information',
  version: '1.0.0'
});

// Define resources for products
server.addResource({
  name: 'products',
  description: 'Product catalog information',
  async fetch() {
    const products = await db.listProducts();
    return {
      content: JSON.stringify(products),
      mediaType: 'application/json'
    };
  }
});

// Define a resource for a specific product
server.addResource({
  name: 'product',
  description: 'Information about a specific product',
  parameters: [
    {
      name: 'id',
      description: 'Product ID',
      required: true
    }
  ],
  async fetch(params?: Record<string, any>) {
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
      mediaType: 'application/json'
    };
  }
});

// Define a tool for searching products
server.addTool({
  name: 'searchProducts',
  description: 'Search for products by name or description',
  parameters: [
    {
      name: 'query',
      description: 'Search query',
      required: true
    }
  ],
  async execute(params?: Record<string, any>) {
    const query = params?.query as string;
    if (!query) {
      throw new Error('Search query is required');
    }
    
    const allProducts = await db.listProducts();
    const results = allProducts.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) || 
      p.description.toLowerCase().includes(query.toLowerCase())
    );
    
    return {
      result: JSON.stringify(results),
      mediaType: 'application/json'
    };
  }
});

// Define a tool for creating orders
server.addTool({
  name: 'createOrder',
  description: 'Create a new order',
  parameters: [
    {
      name: 'userId',
      description: 'User ID',
      required: true
    },
    {
      name: 'items',
      description: 'Order items (array of {productId, quantity})',
      required: true
    }
  ],
  async execute(params?: Record<string, any>) {
    const userId = params?.userId as string;
    const items = params?.items as Array<{productId: string, quantity: number}>;
    
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
        price: product.price
      });
    }
    
    const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const order = await db.createOrder({
      userId,
      items: orderItems,
      total,
      status: 'pending'
    });
    
    return {
      result: JSON.stringify(order),
      mediaType: 'application/json'
    };
  }
});

// Start the server
export async function startMCPServer(port = 8080) {
  await server.listen(port);
  console.log(`MCP Server running on port ${port}`);
  return server;
}

export { server };
