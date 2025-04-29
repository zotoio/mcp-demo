import express, { Request, Response } from 'express';
import logger from './utils/logger';
import { AuthService } from './services/auth.service';
import { ProductService } from './services/product.service';
import { OrderService } from './services/order.service';
import { db } from './adapters/db.adapter';
import { startServer } from './mcp/server';
import { createMCPClient } from './mcp/client';

const authService = new AuthService();
const productService = new ProductService();
const orderService = new OrderService();

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
    app.get('/', (_req: Request, res: Response) => res.send('MCP Example running'));
    app.listen(3001, () => logger.info('Main API server running on http://localhost:3001'));
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
