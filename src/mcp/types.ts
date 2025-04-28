// This file is no longer needed as we're using the types from @modelcontextprotocol/typescript-sdk
// Re-export types from the SDK if needed
export * from '@modelcontextprotocol/typescript-sdk';

// Define our own types if the SDK doesn't exist
// These will be used as fallbacks if the SDK import fails
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
