import express from 'express';
import logger from './utils/logger';
import { db } from './adapters/db.adapter';
import { startServer } from './mcp/server';
import { createMCPClient } from './mcp/client';

async function initializeApp() {
  try {
    // Seed the database
    await db.seed();
    logger.info('Database seeded successfully');
    
    // Start the MCP server
    await startServer();
    logger.info('MCP Server initialized');

    // Start the main API server
    const app = express();
    app.get('/', (_req: any, res: any) => res.send('MCP Example running'));
    app.listen(3001, () => logger.info('Main API server running on http://localhost:3001'));
    
    // Wait for the server to fully initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test the MCP client
    const client = await createMCPClient();
    const mcpProducts = await client.readResource({ uri: "products://all" });
    logger.info('MCP client connected successfully');
    logger.info({ productCount: JSON.parse(mcpProducts.contents[0].text as string).length }, 
      'Products retrieved via MCP');
  } catch (err) {
    logger.error({ err }, 'Error in initialization');
  }
  
}

initializeApp().catch(err => logger.error({ err }, 'Application initialization failed'));
