import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import logger from "../utils/logger";

/**
 * This file demonstrates how to create an MCP client that connects to your MCP server.
 * In a real application, this would typically be in a separate project.
 */

export async function createMCPClient(serverUrl = 'http://localhost:3000/mcp') {
  // Create a new MCP client
  const client = new Client({
    name: 'E-Commerce MCP Client',
    version: '1.0.0'
  });

  // Connect to the MCP server
  const transport = new StreamableHTTPClientTransport(
    new URL(serverUrl)
  );
  
  try {
    await client.connect(transport);
    logger.info(`Connected to MCP server at ${serverUrl}`);
    return client;
  } catch (err) {
    logger.error({ err }, `Failed to connect to MCP server at ${serverUrl}`);
    throw err;
  }
}

// Example usage functions
export async function listAllProducts(client: Client) {
  const resource = await client.readResource({
    uri: "products://all"
  });
  
  if (!resource.contents?.[0]?.text) {
    throw new Error("Invalid resource response: missing text content");
  }
  
  return JSON.parse(resource.contents[0].text as string);
}

export async function searchProducts(client: Client, query: string) {
  const result = await client.callTool({
    name: "searchProducts",
    arguments: {
      query
    }
  });
  
  if (!result.content || !Array.isArray(result.content) || !result.content[0] || typeof result.content[0] !== 'object') {
    throw new Error("Invalid tool response: missing or malformed content");
  }
  
  const content = result.content[0] as { type: string; text: string };
  if (!content.text) {
    throw new Error("Invalid tool response: missing text in content");
  }
  
  return JSON.parse(content.text);
}

export async function createOrder(client: Client, userId: string, items: Array<{productId: string, quantity: number}>) {
  const result = await client.callTool({
    name: "createOrder",
    arguments: {
      userId,
      items
    }
  });
  
  if (!result.content || !Array.isArray(result.content) || !result.content[0] || typeof result.content[0] !== 'object') {
    throw new Error("Invalid tool response: missing or malformed content");
  }
  
  const content = result.content[0] as { type: string; text: string };
  if (!content.text) {
    throw new Error("Invalid tool response: missing text in content");
  }
  
  return JSON.parse(content.text);
}

// This can be used for testing the client directly
if (require.main === module) {
  createMCPClient()
    .then(async (client) => {
      // Example: List all products
      const products = await listAllProducts(client);
      logger.info({products}, 'Products retrieved');
      
      // Example: Search for products
      const searchResults = await searchProducts(client, 'Product 1');
      logger.info({results: searchResults}, 'Search results');
      
      logger.info('MCP Client test completed');
    })
    .catch((err) => logger.error({err}, 'MCP Client error'));
}
