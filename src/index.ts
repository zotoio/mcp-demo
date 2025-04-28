import express, { Request, Response } from 'express';
import logger from './utils/logger';
import { AuthService } from './services/auth.service';
import { ProductService } from './services/product.service';
import { OrderService } from './services/order.service';
import { db } from './adapters/db.adapter';
import { startMCPServer } from './mcp/server';
import { createMCPClient } from './mcp/client';

const authService = new AuthService();
const productService = new ProductService();
const orderService = new OrderService();

async function initializeApp() {
  // Seed the database
  await db.seed();
  
  // Start the MCP server
  await startMCPServer();
  logger.info('MCP Server initialized');

  // Start the main API server
  const app = express();
  app.get('/', (_req: Request, res: Response) => res.send('MCP Example running'));
  app.listen(3001, () => logger.info('Main API server running on http://localhost:3001'));

  // Test the application logic
  try {
    const products = await productService.listProducts();
    logger.info({ products }, 'Products retrieved');
    
    await authService.register('new.user@example.com', 'New User', 'password123');
    logger.info({ auth: authService.getContext() }, 'Auth context');
    
    await authService.logout();
    logger.info({ auth: authService.getContext() }, 'Auth context after logout');
    
    await authService.login('customer@example.com', 'password123');
    logger.info({ auth: authService.getContext() }, 'Auth context after login');
    
    const cu = authService.getCurrentUser();
    if (authService.isAuthenticated() && cu) {
      const items = products
        .slice(0, 2)
        .map((p) => ({ productId: p.id, quantity: 1, price: p.price }));
      const order = await orderService.createOrder(cu.id, items);
      logger.info({ order }, 'Order created');
      
      const hist = await orderService.getUserOrders(cu.id);
      logger.info({ history: hist }, 'Order history');
      
      const updated = await orderService.updateOrderStatus(order.id, 'shipped');
      logger.info({ updated }, 'Order updated');
    }
    
    // Test the MCP client
    const client = await createMCPClient();
    const mcpProducts = await client.readResource({ uri: "products://all" });
    logger.info({ mcpProducts: JSON.parse(mcpProducts.contents[0].text) }, 'Products retrieved via MCP');
    
  } catch (e) {
    logger.error({ err: e }, 'Error in initialization');
  }
  
}

initializeApp().catch(err => logger.error({ err }, 'Application initialization failed'));
