import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { db } from '../adapters/db.adapter';
import logger from '../utils/logger';

// Create an MCP server
export async function startServer(port = 3000) {
  const server = new McpServer({
    name: 'E-Commerce MCP Server',
    description: 'Provides access to product catalog and order information',
    version: '1.0.0',
  });

  // Add a resource for all products
  server.resource('products', 'products://all', (uri) => {
    const products = db.listProducts();
    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(products),
        },
      ],
    };
  });

  // Add a resource for a specific product
  server.resource(
    'product',
    new ResourceTemplate('products://{id}', { list: undefined }),
    (uri, params) => {
      const id = params.id as string;
      const product = db.getProduct(id);
      if (!product) {
        throw new Error(`Product with ID ${id} not found`);
      }
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(product),
          },
        ],
      };
    }
  );

  // Add a tool for searching products
  server.tool('searchProducts', { query: z.string() }, ({ query }) => {
    const allProducts = db.listProducts();
    const results = allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase())
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results),
        },
      ],
    };
  });

  // Add a tool for creating orders
  server.tool(
    'createOrder',
    {
      userId: z.string(),
      items: z.array(
        z.object({
          productId: z.string(),
          quantity: z.number().int().positive(),
        })
      ),
    },
    ({ userId, items }) => {
      // Calculate prices and create order items
      const orderItems = [];
      for (const item of items) {
        const product = db.getProduct(item.productId);
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

      const order = db.createOrder({
        userId,
        items: orderItems,
        total,
        status: 'pending',
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(order),
          },
        ],
      };
    }
  );

  // Start the HTTP server with the MCP endpoint
  logger.info('Initializing StreamableHTTPServerTransport in stateless mode');
  const { StreamableHTTPServerTransport } = await import(
    '@modelcontextprotocol/sdk/server/streamableHttp.js'
  );
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Use stateless mode for simplicity
    // Debug option removed as it's not supported in the type
  });

  // Create an Express app to handle the HTTP requests
  logger.info('Setting up Express server for MCP');
  const expressModule = await import('express');
  const app = expressModule.default();
  const jsonMiddleware = expressModule.default.json();
  app.use(jsonMiddleware);

  // Handle POST requests for client-to-server communication
  app.post('/mcp', async (req, res) => {
    logger.debug(
      {
        method: 'POST',
        path: '/mcp',
        headers: req.headers,
        body: req.body as Record<string, unknown>,
      },
      'Received MCP request'
    );

    try {
      await transport.handleRequest(req, res, req.body);
      logger.debug('MCP request handled successfully');
    } catch (error) {
      logger.error({ error }, 'Error handling MCP request');
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        });
      }
    }
  });

  // Start the HTTP server
  const httpServer = app.listen(port, '0.0.0.0', () => {
    logger.info(
      {
        port,
        endpoint: '/mcp',
        serverName: 'E-Commerce MCP Server', // Use hardcoded values
        serverVersion: '1.0.0',
      },
      `MCP Server listening on port ${port} with endpoint /mcp`
    );
  });

  // Connect the MCP server to the transport
  logger.info('Connecting MCP server to transport');
  await server.connect(transport);
  logger.info('MCP server connected successfully');

  // Clean up when the server is closed
  httpServer.on('close', () => {
    logger.info('HTTP server closing, cleaning up resources');
    void transport.close();
    void server.close();
    logger.info('MCP server and transport closed');
  });

  return server;
}
