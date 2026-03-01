/**
 * Context directory manager – creates and reads the .mcp/ directory
 */
import fs from 'node:fs';
import path from 'node:path';
import type { IndexResult, PageInfo, ToolManifest } from '../indexer/types.js';

const MCP_DIR = '.mcp';
const PAGES_DIR = 'pages';

/**
 * Write a full index result to the .mcp/ context directory.
 */
export function writeContext(rootDir: string, result: IndexResult): void {
    const mcpRoot = path.join(rootDir, MCP_DIR);
    const pagesDir = path.join(mcpRoot, PAGES_DIR);

    // Ensure directories exist
    fs.mkdirSync(pagesDir, { recursive: true });

    // Write master index
    fs.writeFileSync(
        path.join(mcpRoot, 'index.json'),
        JSON.stringify(result, null, 2),
        'utf-8'
    );

    // Write individual page files
    for (const page of result.pages) {
        fs.writeFileSync(
            path.join(pagesDir, `${page.hash}.json`),
            JSON.stringify(page, null, 2),
            'utf-8'
        );
    }

    // Write tools manifest
    const toolsManifest = getToolsManifest();
    fs.writeFileSync(
        path.join(mcpRoot, 'tools.json'),
        JSON.stringify(toolsManifest, null, 2),
        'utf-8'
    );
}

/**
 * Read the cached index from .mcp/index.json.
 * Returns null if no index exists yet.
 */
export function readContext(rootDir: string): IndexResult | null {
    const indexPath = path.join(rootDir, MCP_DIR, 'index.json');

    if (!fs.existsSync(indexPath)) {
        return null;
    }

    const raw = fs.readFileSync(indexPath, 'utf-8');
    return JSON.parse(raw) as IndexResult;
}

/**
 * Read a single page's detail from the context directory.
 */
export function readPageDetail(rootDir: string, hash: string): PageInfo | null {
    const pagePath = path.join(rootDir, MCP_DIR, PAGES_DIR, `${hash}.json`);

    if (!fs.existsSync(pagePath)) {
        return null;
    }

    const raw = fs.readFileSync(pagePath, 'utf-8');
    return JSON.parse(raw) as PageInfo;
}

/**
 * Get the tools manifest describing all available MCP tools.
 */
export function getToolsManifest(): ToolManifest[] {
    return [
        {
            name: 'index_pages',
            description: 'Scan and index all Node.js pages in a target directory. Creates a .mcp/ context directory with structured metadata.',
            inputSchema: {
                type: 'object',
                properties: {
                    directory: { type: 'string', description: 'Absolute or relative path to the directory to index' },
                },
                required: ['directory'],
            },
        },
        {
            name: 'search_pages',
            description: 'Search indexed pages by query string, framework, or page type.',
            inputSchema: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Search term to match against file names, paths, or route paths' },
                    framework: { type: 'string', description: 'Filter by framework (express, nextjs, koa, hapi, fastify, vanilla)', enum: ['express', 'nextjs', 'koa', 'hapi', 'fastify', 'vanilla', 'unknown'] },
                    type: { type: 'string', description: 'Filter by page type (route, page, component, middleware, static, config)', enum: ['route', 'page', 'component', 'middleware', 'static', 'config', 'unknown'] },
                },
            },
        },
        {
            name: 'get_page_detail',
            description: 'Get full metadata and a content preview for a specific indexed page.',
            inputSchema: {
                type: 'object',
                properties: {
                    filePath: { type: 'string', description: 'Relative file path of the page to inspect' },
                },
                required: ['filePath'],
            },
        },
        {
            name: 'list_available_tools',
            description: 'List all tools this MCP server provides, with their descriptions and input schemas.',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
    ];
}
