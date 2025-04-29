import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { db } from "../adapters/db.adapter";
import logger from "../utils/logger";

// Create an MCP server
export async function startServer(port = 3000) {
  const server = new McpServer({
    name: "E-Commerce MCP Server",
    description: "Provides access to product catalog and order information",
    version: "1.0.0",
  });

  // Add a resource for all products
  server.resource(
    "products",
    "products://all",
    async (uri) => {
      const products = await db.listProducts();
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(products)
        }]
      };
    }
  );

  // Add a resource for a specific product
  server.resource(
    "product",
    new ResourceTemplate("products://{id}", { list: undefined }),
    async (uri, params) => {
      const id = params.id as string;
      const product = await db.getProduct(id);
      if (!product) {
        throw new Error(`Product with ID ${id} not found`);
      }
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(product)
        }]
      };
    }
  );

  // Add a tool for searching products
  server.tool(
    "searchProducts",
    { query: z.string() },
    async ({ query }) => {
      const allProducts = await db.listProducts();
      const results = allProducts.filter(
        (p) => p.name.toLowerCase().includes(query.toLowerCase()) || 
              p.description.toLowerCase().includes(query.toLowerCase())
      );
      
      return {
        content: [{ 
          type: "text", 
          text: JSON.stringify(results) 
        }]
      };
    }
  );

  // Add a tool for creating orders
  server.tool(
    "createOrder",
    { 
      userId: z.string().uuid(), 
      items: z.array(z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive()
      }))
    },
    async ({ userId, items }) => {
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

      return {
        content: [{ 
          type: "text", 
          text: JSON.stringify(order) 
        }]
      };
    }
  );
  
  // Start the HTTP server with the MCP endpoint
  const { StreamableHTTPServerTransport } = await import("@modelcontextprotocol/sdk/server/streamableHttp.js");
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Use stateless mode for simplicity
  });
  
  // Create an Express app to handle the HTTP requests
  const express = await import("express");
  const app = express.default();
  app.use(express.default.json());
  
  // Handle POST requests for client-to-server communication
  app.post('/mcp', async (req, res) => {
    await transport.handleRequest(req, res, req.body);
  });
  
  // Start the HTTP server
  const httpServer = app.listen(port, "0.0.0.0", () => {
    logger.info(`MCP Server listening on port ${port} with endpoint /mcp`);
  });
  
  // Connect the MCP server to the transport
  await server.connect(transport);
  
  // Clean up when the server is closed
  httpServer.on('close', () => {
    transport.close();
    server.close();
  });
  
  return server;
}

