/**
 * Custom implementation of MCP types based on the Model Context Protocol specification
 * from https://modelcontextprotocol.io/introduction
 */

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
