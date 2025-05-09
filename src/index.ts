import express from 'express';
import logger from './utils/logger';
import { db } from './adapters/db.adapter';
import { startServer } from './mcp/server';
import { createMCPClient } from './mcp/client';

async function initializeApp() {
  logger.startup('MCP Example Application', '1.0.0');

  try {
    // Seed the database
    logger.info('Seeding database with initial data');
    const startTime = Date.now();
    db.seed();
    logger.performance('Database seeding', Date.now() - startTime);
    logger.info('Database seeded successfully');

    // Start the MCP server
    logger.info('Starting MCP server');
    const serverStartTime = Date.now();
    await startServer();
    logger.performance('MCP Server startup', Date.now() - serverStartTime, {
      serverName: 'E-Commerce MCP Server', // Use hardcoded values from server.ts
      serverVersion: '1.0.0',
    });
    logger.info(
      {
        name: 'E-Commerce MCP Server',
        version: '1.0.0',
      },
      'MCP Server initialized'
    );

    // Start the main API server
    logger.info('Starting main API server');
    const app = express();
    //app.get('/', (_req: express.Request, res: express.Response) => res.send('MCP Example running'));
    app.listen(3001, () => {
      logger.info(
        {
          port: 3001,
          url: 'http://localhost:3001',
        },
        'Main API server running on http://localhost:3001'
      );
    });

    // Wait for the server to fully initialize
    logger.info('Waiting for server initialization');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test the MCP client
    logger.info('Testing MCP client connection');
    const clientStartTime = Date.now();
    const client = await createMCPClient();
    logger.performance('MCP Client connection', Date.now() - clientStartTime);

    logger.info('Retrieving products via MCP');
    const productsStartTime = Date.now();
    const mcpProducts = await client.readResource({ uri: 'products://all' });
    const productsText = mcpProducts.contents[0]?.text as string;
    // Explicitly type the parsed JSON to avoid unsafe assignment
    interface Product {
      name: string;
      description: string;
      price: number;
      stock: number;
      id: string;
    }
    const products = JSON.parse(productsText) as Product[];
    logger.performance('Products retrieval', Date.now() - productsStartTime, {
      productCount: products.length,
    });

    logger.info(
      {
        productCount: products.length,
        firstProduct: products[0]?.name || 'unknown',
        clientName: 'E-Commerce MCP Client',
        clientVersion: '1.0.0',
      },
      'Products retrieved via MCP'
    );

    logger.info('Application initialization completed successfully');
  } catch (err) {
    const typedError = err as Error;
    logger.error(
      {
        err: typedError,
        errorMessage: typedError.message,
        errorStack: typedError.stack,
        phase: 'initialization',
      },
      'Error in application initialization'
    );

    logger.shutdown('MCP Example Application', 'Initialization failed');
    process.exit(1);
  }
}

initializeApp().catch((err) => logger.error({ err: err as Error }, 'Application initialization failed'));
