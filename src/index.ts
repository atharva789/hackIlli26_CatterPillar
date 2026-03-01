#!/usr/bin/env node
/**
 * ANS MCP Server – Entry Point
 *
 * Starts the MCP server with StdioServerTransport.
 *
 * Usage:
 *   node build/index.js [--directory <path>]
 *
 * The --directory flag specifies the root directory to index.
 * Defaults to the current working directory.
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

function parseArgs(): { directory: string } {
    const args = process.argv.slice(2);
    let directory = process.cwd();

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--directory' || args[i] === '-d') {
            if (args[i + 1]) {
                directory = args[i + 1];
                i++;
            }
        }
    }

    return { directory };
}

async function main(): Promise<void> {
    const { directory } = parseArgs();

    // Log to stderr (MCP convention – stdout is reserved for JSON-RPC)
    console.error(`🚀 ANS MCP Server starting...`);
    console.error(`📂 Target directory: ${directory}`);

    const server = createServer(directory);
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error(`✅ ANS MCP Server running on stdio`);
    console.error(`   Tools: index_pages, search_pages, get_page_detail, list_available_tools`);
    console.error(`   Resources: pages://index, pages://detail/{filePath}`);
    console.error(`   Prompts: summarize_project, analyze_routes`);
}

main().catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
