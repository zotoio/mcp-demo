# Model Context Protocol (MCP) TypeScript Example

This repository demonstrates a TypeScript implementation of the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction), an open protocol that standardizes how applications provide context to Large Language Models (LLMs).

## What is MCP?

The Model Context Protocol (MCP) is an open protocol that standardizes how applications provide context to LLMs. Think of MCP like a USB-C port for AI applications. Just as USB-C provides a standardized way to connect your devices to various peripherals and accessories, MCP provides a standardized way to connect AI models to different data sources and tools.

MCP helps you build agents and complex workflows on top of LLMs. LLMs frequently need to integrate with data and tools, and MCP provides:

- A growing list of pre-built integrations that your LLM can directly plug into
- The flexibility to switch between LLM providers and vendors
- Best practices for securing your data within your infrastructure

### MCP Architecture

At its core, MCP follows a client-server architecture where a host application can connect to multiple servers:

- **MCP Hosts**: Programs like Claude Desktop, IDEs, or AI tools that want to access data through MCP
- **MCP Clients**: Protocol clients that maintain 1:1 connections with servers
- **MCP Servers**: Lightweight programs that each expose specific capabilities through the standardized Model Context Protocol
- **Local Data Sources**: Your computer's files, databases, and services that MCP servers can securely access
- **Remote Services**: External systems available over the internet (e.g., through APIs) that MCP servers can connect to

## About This Example

This repository contains a TypeScript implementation of an e-commerce system that uses the Model Context Protocol to expose product and order data to LLMs. The implementation follows the Model-Context-Protocol pattern:

- **Models**: Strongly typed data structures using Zod for validation
- **Contexts**: State containers for different parts of the application
- **Protocols**: Service interfaces that define how to interact with the application

### Key Components

- **MCP Server**: A custom implementation of an MCP server that exposes resources and tools
- **MCP Client**: A client that can connect to the MCP server and access its resources and tools
- **E-commerce Domain**: A simple e-commerce system with products, orders, and users

## Project Structure

```
src/
├── adapters/         # External service adapters (DB and API)
├── contexts/         # State containers for auth, products, orders
├── mcp/              # MCP implementation
│   ├── client.ts     # MCP client implementation
│   ├── server.ts     # MCP server implementation
│   └── types.ts      # MCP type definitions
├── models/           # Data models with Zod validation
├── protocols/        # Service interfaces
├── services/         # Business logic implementations
├── utils/            # Utility functions (logger)
└── index.ts          # Application entry point
```

## Getting Started

### Prerequisites

- Node.js (v20 or later)
- Yarn or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/mcp-demo.git
cd mcp-demo

# Install dependencies
yarn install
```

### Running the Example

```bash
# Build the TypeScript code
yarn build

# Start the application
yarn start
```

This will:
1. Start the MCP server on port 3000
2. Seed the database with sample data
3. Run through some example operations
4. Start an Express server on port 3001

### Testing the MCP Client

```bash
# Build the TypeScript code first
yarn build

# Run the client directly
node dist/mcp/client.js
```

## Features

### Resources

The MCP server exposes the following resources:

- `products://all` - List all products
- `products://{id}` - Get a specific product by ID

### Tools

The MCP server provides the following tools:

- `searchProducts` - Search for products by name or description
- `createOrder` - Create a new order with specified items

## Integrating with LLMs

### Claude Integration

[Claude](https://www.anthropic.com/claude) from Anthropic supports MCP natively through Claude Desktop. To integrate this example with Claude:

1. Run the MCP server:
   ```bash
   yarn start
   ```

2. In Claude Desktop, connect to the MCP server at `http://localhost:3000/mcp`

3. Claude can now access product information and create orders through the MCP server

### OpenAI Integration

For OpenAI models, you can use the MCP client to fetch data and then include it in your prompts:

```typescript
import { createMCPClient } from './mcp/client';
import OpenAI from 'openai';

async function queryProductsWithGPT() {
  // Connect to MCP server
  const client = await createMCPClient();
  
  // Fetch products
  const productsResource = await client.readResource({ uri: 'products://all' });
  const productsText = productsResource.contents[0]?.text as string;
  const products = JSON.parse(productsText);
  
  // Create OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  // Query GPT with product data
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are a helpful e-commerce assistant." },
      { role: "user", content: `Here are our products: ${JSON.stringify(products)}. Can you recommend a product for a new customer?` }
    ],
  });
  
  console.log(completion.choices[0].message.content);
}
```

## Resources

- [Model Context Protocol Official Website](https://modelcontextprotocol.io/introduction)
- [Anthropic Claude](https://www.anthropic.com/claude)
- [MCP GitHub Organization](https://github.com/modelcontextprotocol)
- [MCP Specification](https://modelcontextprotocol.io/specification/2025-03-26)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
