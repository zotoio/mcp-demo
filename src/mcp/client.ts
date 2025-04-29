import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import logger from '../utils/logger';

/**
 * This file demonstrates how to create an MCP client that connects to your MCP server.
 * In a real application, this would typically be in a separate project.
 */

export async function createMCPClient(serverUrl = 'http://localhost:3000/mcp') {
  // Create a new MCP client
  const client = new Client({
    name: 'E-Commerce MCP Client',
    version: '1.0.0',
  });

  logger.info({ serverUrl }, 'Attempting to connect to MCP server');

  try {
    // Try connecting with the modern Streamable HTTP transport first
    logger.debug('Creating StreamableHTTPClientTransport');
    const transport = new StreamableHTTPClientTransport(
      new URL(serverUrl)
      // Debug option removed as it's not supported in the type
    );

    logger.debug('Connecting client to transport');
    await client.connect(transport);
    logger.info(
      {
        serverUrl,
        transportType: 'StreamableHTTP',
        clientName: 'E-Commerce MCP Client', // Use hardcoded values
        clientVersion: '1.0.0',
      },
      `Connected to MCP server at ${serverUrl} using Streamable HTTP transport`
    );

    return client;
  } catch (err) {
    // If that fails, try the older SSE transport as fallback
    logger.warn(
      {
        err,
        errorMessage: err instanceof Error ? err.message : String(err),
        errorStack: err instanceof Error ? err.stack : undefined,
        serverUrl,
      },
      `Streamable HTTP connection failed, falling back to SSE transport`
    );

    try {
      logger.debug('Creating SSEClientTransport as fallback');
      const baseUrl = new URL(serverUrl);
      const sseTransport = new SSEClientTransport(baseUrl);

      logger.debug('Connecting client to SSE transport');
      await client.connect(sseTransport);
      logger.info(
        {
          serverUrl,
          transportType: 'SSE',
          clientName: 'E-Commerce MCP Client', // Use hardcoded values
          clientVersion: '1.0.0',
        },
        `Connected to MCP server using SSE transport`
      );

      return client;
    } catch (fallbackErr) {
      logger.error(
        {
          err: fallbackErr,
          errorMessage: fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr),
          errorStack: fallbackErr instanceof Error ? fallbackErr.stack : undefined,
          serverUrl,
          attemptedTransports: ['StreamableHTTP', 'SSE'],
        },
        `All connection attempts to MCP server failed`
      );

      throw fallbackErr;
    }
  }
}

// Example usage functions
export async function listAllProducts(client: Client) {
  const resource = await client.readResource({
    uri: 'products://all',
  });

  if (!resource.contents?.[0]?.text) {
    throw new Error('Invalid resource response: missing text content');
  }

  const text = resource.contents[0]?.text as string;
  return JSON.parse(text) as unknown;
}

export async function searchProducts(client: Client, query: string) {
  const result = await client.callTool({
    name: 'searchProducts',
    arguments: {
      query,
    },
  });

  if (
    !result.content ||
    !Array.isArray(result.content) ||
    !result.content[0] ||
    typeof result.content[0] !== 'object'
  ) {
    throw new Error('Invalid tool response: missing or malformed content');
  }

  const content = result.content[0] as { type: string; text: string };
  if (!content.text) {
    throw new Error('Invalid tool response: missing text in content');
  }

  const text = content.text;
  return JSON.parse(text) as unknown;
}

export async function createOrder(
  client: Client,
  userId: string,
  items: Array<{ productId: string; quantity: number }>
) {
  const result = await client.callTool({
    name: 'createOrder',
    arguments: {
      userId,
      items,
    },
  });

  if (
    !result.content ||
    !Array.isArray(result.content) ||
    !result.content[0] ||
    typeof result.content[0] !== 'object'
  ) {
    throw new Error('Invalid tool response: missing or malformed content');
  }

  const content = result.content[0] as { type: string; text: string };
  if (!content.text) {
    throw new Error('Invalid tool response: missing text in content');
  }

  const text = content.text;
  return JSON.parse(text) as unknown;
}

// This can be used for testing the client directly
if (require.main === module) {
  createMCPClient()
    .then(async (client) => {
      // Example: List all products
      const products = await listAllProducts(client) as Array<{ name: string }>;
      logger.info({ productCount: products.length }, 'Products retrieved');

      // Example: Search for products
      const searchResults = await searchProducts(client, 'Product 1') as Array<{ name: string }>;
      logger.info({ resultCount: searchResults.length }, 'Search results');

      logger.info('MCP Client test completed');
    })
    .catch((err) => logger.error({ err }, 'MCP Client error'));
}
