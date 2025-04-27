import { MCPClientConfig, ResourceResponse, ToolResponse } from './types';
import * as http from 'http';
import * as https from 'https';

/**
 * This file demonstrates how to create an MCP client that connects to your MCP server.
 * In a real application, this would typically be in a separate project.
 */

class MCPClient {
  private baseUrl: string = '';
  private config: MCPClientConfig;
  
  constructor(config: MCPClientConfig = {}) {
    this.config = {
      timeout: 30000,
      ...config
    };
  }
  
  async connect(serverUrl: string): Promise<void> {
    this.baseUrl = serverUrl;
    // Test connection
    await this.request('GET', '/resources');
    console.log(`Connected to MCP server at ${serverUrl}`);
  }
  
  async fetchResource(resourceName: string, params: Record<string, any> = {}): Promise<ResourceResponse> {
    const queryParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(params)) {
      queryParams.append(key, String(value));
    }
    
    const queryString = queryParams.toString();
    const path = `/resources/${resourceName}${queryString ? `?${queryString}` : ''}`;
    
    return this.request('GET', path);
  }
  
  async executeTool(toolName: string, params: Record<string, any> = {}): Promise<ToolResponse> {
    const path = `/tools/${toolName}`;
    return this.request('POST', path, params);
  }
  
  private async request(method: string, path: string, body?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const options: http.RequestOptions = {
        method,
        timeout: this.config.timeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      
      const client = url.protocol === 'https:' ? https : http;
      const req = client.request(url, options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (error) {
              reject(new Error(`Failed to parse response: ${error}`));
            }
          } else {
            reject(new Error(`Request failed with status code ${res.statusCode}: ${data}`));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      if (body) {
        req.write(JSON.stringify(body));
      }
      
      req.end();
    });
  }
}

export async function createMCPClient() {
  // Create a new MCP client
  const client = new MCPClient();
  
  // Connect to the MCP server
  await client.connect('http://localhost:8080');
  
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
