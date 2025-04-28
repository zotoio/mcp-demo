import logger from '../utils/logger';
import { MCPClient } from '@modelcontextprotocol/sdk/client';

/**
 * This file demonstrates how to create an MCP client that connects to your MCP server.
 * In a real application, this would typically be in a separate project.
 */

export async function createMCPClient() {
  // Create a new MCP client
  const client = new MCPClient();

  // Connect to the MCP server
  await client.connect('http://localhost:8080');
  logger.info(`Connected to MCP server at http://localhost:8080`);

  // Example: Fetch all products
  const productsResource = await client.fetchResource('products');
  logger.info({products: JSON.parse(productsResource.content)}, 'Products retrieved');

  // Example: Search for products
  const searchResults = await client.executeTool('searchProducts', {
    query: 'Product 1',
  });
  logger.info({results: JSON.parse(searchResults.result)}, 'Search results');

  return client;
}

// This can be used for testing the client directly
if (require.main === module) {
  createMCPClient()
    .then(() => logger.info('MCP Client test completed'))
    .catch((err) => logger.error({err}, 'MCP Client error'));
}
