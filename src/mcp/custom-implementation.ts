/**
 * Custom implementation of MCP server and client
 * This is used as a fallback when the official SDK is not available
 */

import * as http from 'http';
import * as https from 'https';
import * as url from 'url';

export interface ResourceParameter {
  name: string;
  description: string;
  required: boolean;
}

export interface ResourceResponse {
  content: string;
  mediaType: string;
}

export interface Resource {
  name: string;
  description: string;
  parameters?: ResourceParameter[];
  fetch: (params?: Record<string, any>) => Promise<ResourceResponse>;
}

export interface ToolParameter {
  name: string;
  description: string;
  required: boolean;
}

export interface ToolResponse {
  result: string;
  mediaType: string;
}

export interface Tool {
  name: string;
  description: string;
  parameters?: ToolParameter[];
  execute: (params?: Record<string, any>) => Promise<ToolResponse>;
}

export interface MCPServerConfig {
  name: string;
  description: string;
  version: string;
}

export interface MCPClientConfig {
  timeout?: number;
}

export class MCPServer {
  private resources: Map<string, Resource> = new Map();
  private tools: Map<string, Tool> = new Map();
  private config: MCPServerConfig;
  private httpServer: http.Server | null = null;
  private middlewares: Array<(req: any, res: any, next: () => Promise<void>) => Promise<void>> = [];

  constructor(config: MCPServerConfig) {
    this.config = config;
  }

  use(middleware: (req: any, res: any, next: () => Promise<void>) => Promise<void>): void {
    this.middlewares.push(middleware);
  }

  addResource(resource: Resource): void {
    this.resources.set(resource.name, resource);
  }

  addTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  async listen(port: number): Promise<void> {
    return new Promise((resolve) => {
      this.httpServer = http.createServer(async (req, res) => {
        const parsedUrl = url.parse(req.url || '', true);
        const path = parsedUrl.pathname || '';
        
        // Create request and response objects for middleware
        const request = {
          method: req.method,
          path: path,
          query: parsedUrl.query,
          headers: req.headers,
          body: null as any
        };
        
        const response = {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          send: function(body: any) {
            res.statusCode = this.statusCode;
            Object.entries(this.headers).forEach(([key, value]) => {
              res.setHeader(key, value as string);
            });
            res.end(typeof body === 'string' ? body : JSON.stringify(body));
            return this;
          }
        };
        
        // Run middleware
        let middlewareIndex = 0;
        const runMiddleware = async () => {
          if (middlewareIndex < this.middlewares.length) {
            const middleware = this.middlewares[middlewareIndex];
            middlewareIndex++;
            await middleware(request, response, runMiddleware);
          } else {
            // Process the request after middleware
            await this.handleRequest(request, response, req, res);
          }
        };
        
        await runMiddleware();
      });
      
      this.httpServer.listen(port, () => {
        resolve();
      });
    });
  }
  
  private async handleRequest(request: any, response: any, req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const parsedUrl = url.parse(req.url || '', true);
    const path = parsedUrl.pathname || '';
    
    try {
      if (path === '/resources' && req.method === 'GET') {
        const resourceList = Array.from(this.resources.keys());
        response.send({ resources: resourceList });
        return;
      }
      
      if (path.startsWith('/resources/') && req.method === 'GET') {
        const resourceName = path.split('/')[2];
        const resource = this.resources.get(resourceName);
        
        if (!resource) {
          response.statusCode = 404;
          response.send({ error: `Resource ${resourceName} not found` });
          return;
        }
        
        const result = await resource.fetch(parsedUrl.query);
        response.send(result);
        return;
      }
      
      if (path === '/tools' && req.method === 'GET') {
        const toolList = Array.from(this.tools.keys());
        response.send({ tools: toolList });
        return;
      }
      
      if (path.startsWith('/tools/') && req.method === 'POST') {
        const toolName = path.split('/')[2];
        const tool = this.tools.get(toolName);
        
        if (!tool) {
          response.statusCode = 404;
          response.send({ error: `Tool ${toolName} not found` });
          return;
        }
        
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        
        req.on('end', async () => {
          try {
            const params = JSON.parse(body);
            const result = await tool.execute(params);
            response.send(result);
          } catch (error) {
            response.statusCode = 400;
            response.send({ error: `Error executing tool: ${error}` });
          }
        });
        return;
      }
      
      response.statusCode = 404;
      response.send({ error: 'Not found' });
    } catch (error) {
      response.statusCode = 500;
      response.send({ error: `Server error: ${error}` });
    }
  }
  
  close(): void {
    if (this.httpServer) {
      this.httpServer.close();
    }
  }
}

export class MCPClient {
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
