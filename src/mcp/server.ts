import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import express from "express";
import logger from "../utils/logger";
import { db } from "../adapters/db.adapter";
import { randomUUID } from "crypto";

// Create an MCP server
const server = new McpServer({
  name: "E-Commerce MCP Server",
  description: "Provides access to product catalog and order information",
  version: "1.0.0"
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
  async (uri, { id }) => {
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

// Export the server for use in the HTTP setup
export { server };

// Function to start the MCP server with HTTP transport
export async function startMCPServer(port = 8080) {
  const app = express();
  app.use(express.json());

  // Map to store transports by session ID
  const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

  // Handle POST requests for client-to-server communication
  app.post('/mcp', async (req, res) => {
    // Check for existing session ID
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      // Reuse existing transport
      transport = transports[sessionId];
    } else if (!sessionId && req.body?.method === 'initialize') {
      // New initialization request
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId) => {
          // Store the transport by session ID
          transports[sessionId] = transport;
        }
      });

      // Clean up transport when closed
      transport.onclose = () => {
        if (transport.sessionId) {
          delete transports[transport.sessionId];
        }
      };

      // Connect to the MCP server
      await server.connect(transport);
    } else {
      // Invalid request
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      });
      return;
    }

    // Handle the request
    await transport.handleRequest(req, res, req.body);
  });

  // Reusable handler for GET and DELETE requests
  const handleSessionRequest = async (req: express.Request, res: express.Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }

    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
  };

  // Handle GET requests for server-to-client notifications via SSE
  app.get('/mcp', handleSessionRequest);

  // Handle DELETE requests for session termination
  app.delete('/mcp', handleSessionRequest);

  // Start the server
  app.listen(port, () => {
    logger.info({ port }, 'MCP Server running');
  });

  return server;
}
