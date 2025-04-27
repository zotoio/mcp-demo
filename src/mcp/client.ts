import { MCPClient } from '@modelcontextprotocol/typescript-sdk';

/**
 * This file demonstrates how to create an MCP client that connects to your MCP server.
 * In a real application, this would typically be in a separate project.
 */

export async function createMCPClient() {
  // Create a new MCP client
  const client = new MCPClient();
  
  // Connect to the MCP server
  await client.connect('http://localhost:8080');
  console.log(`Connected to MCP server at http://localhost:8080`);
  
  // Example: Fetch all products
  const productsResource = await client.fetchResource('products');
  console.log('Products:', JSON.parse(productsResource.content));
  
  // Example: Search for products
  const searchResults = await client.executeTool('searchProducts', {
    query: 'Product 1'
  });
  console.log('Search results:', JSON.parse(searchResults.result));
  
  return client;
}

// This can be used for testing the client directly
if (require.main === module) {
  createMCPClient()
    .then(() => console.log('MCP Client test completed'))
    .catch(err => console.error('MCP Client error:', err));
}
