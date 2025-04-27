import express from 'express';
import { AuthService } from './services/auth.service';
import { ProductService } from './services/product.service';
import { OrderService } from './services/order.service';
import { db } from './adapters/db.adapter';
import { startMCPServer } from './mcp/server';

const authService=new AuthService();
const productService=new ProductService();
const orderService=new OrderService();

async function initializeApp(){
  // Start the MCP server
  const mcpServer = await startMCPServer(8080);
  console.log('MCP Server initialized');
  
  await db.seed();
  try{
    const products=await productService.listProducts();
    console.log('Products:',products);
    await authService.register('new.user@example.com','New User','password123');
    console.log('Auth:',authService.getContext());
    await authService.logout();
    console.log('Auth after logout:',authService.getContext());
    await authService.login('customer@example.com','password123');
    console.log('Auth after login:',authService.getContext());
    const cu=authService.getCurrentUser();
    if(authService.isAuthenticated()&&cu){
      const items=products.slice(0,2).map(p=>({productId:p.id,quantity:1,price:p.price}));
      const order=await orderService.createOrder(cu.id,items);
      console.log('Order:',order);
      const hist=await orderService.getUserOrders(cu.id);
      console.log('History:',hist);
      const updated=await orderService.updateOrderStatus(order.id,'shipped');
      console.log('Updated:',updated);
    }
  }catch(e){ console.error('Error',e);}
  const app=express();
  app.get('/',(_,res)=>res.send('MCP Example running'));
  app.listen(3000,()=>console.log('Server on http://localhost:3000'));
}
initializeApp().catch(console.error);
