/**
 * MCP Server – registers all tools, resources, and prompts
 */
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { indexPages } from './tools/indexPages.js';
import { searchPages } from './tools/searchPages.js';
import { getPageDetail } from './tools/getPageDetail.js';
import { listAvailableTools } from './tools/listTools.js';
import { readContext } from './context/contextDir.js';

/**
 * Create and configure the MCP server with all tools, resources, and prompts.
 */
export function createServer(defaultDirectory: string): McpServer {
    const server = new McpServer({
        name: 'ans-node-indexer',
        version: '1.0.0',
    });

    // ─────────────────────────────────────────────────────────────────
    // TOOLS
    // ─────────────────────────────────────────────────────────────────

    // 1. index_pages – full scan & index
    server.registerTool(
        'index_pages',
        {
            description: 'Scan and index all Node.js pages in a target directory. Creates a .mcp/ context directory with structured metadata for routes, exports, dependencies, and framework detection.',
            inputSchema: {
                directory: z.string().describe('Path to the directory to index (absolute or relative)').default(defaultDirectory),
            },
        },
        async ({ directory }) => {
            try {
                const { summary } = await indexPages(directory);
                return { content: [{ type: 'text' as const, text: summary }] };
            } catch (err) {
                return {
                    content: [{ type: 'text' as const, text: `❌ Index failed: ${(err as Error).message}` }],
                    isError: true,
                };
            }
        }
    );

    // 2. search_pages – query the index
    server.registerTool(
        'search_pages',
        {
            description: 'Search indexed pages by query string, framework, or page type.',
            inputSchema: {
                query: z.string().optional().describe('Text to match against file names, paths, or route paths'),
                framework: z.enum(['express', 'nextjs', 'koa', 'hapi', 'fastify', 'vanilla', 'unknown']).optional().describe('Filter by detected framework'),
                type: z.enum(['route', 'page', 'component', 'middleware', 'static', 'config', 'unknown']).optional().describe('Filter by page type'),
            },
        },
        async ({ query, framework, type }) => {
            const { summary } = searchPages(defaultDirectory, { query, framework, type });
            return { content: [{ type: 'text' as const, text: summary }] };
        }
    );

    // 3. get_page_detail – individual page metadata + preview
    server.registerTool(
        'get_page_detail',
        {
            description: 'Get full metadata and a source code preview for a specific indexed page.',
            inputSchema: {
                filePath: z.string().describe('Relative file path of the page to inspect'),
            },
        },
        async ({ filePath }) => {
            const result = getPageDetail(defaultDirectory, filePath);
            const parts: Array<{ type: 'text'; text: string }> = [
                { type: 'text' as const, text: result.summary },
            ];
            if (result.preview) {
                parts.push({
                    type: 'text' as const,
                    text: `\n--- Source Preview ---\n${result.preview}`,
                });
            }
            return { content: parts };
        }
    );

    // 4. list_available_tools – self-documenting
    server.registerTool(
        'list_available_tools',
        {
            description: 'List all tools this MCP server provides, with descriptions and input schemas.',
            inputSchema: {},
        },
        async () => {
            const text = listAvailableTools();
            return { content: [{ type: 'text' as const, text }] };
        }
    );

    // ─────────────────────────────────────────────────────────────────
    // RESOURCES
    // ─────────────────────────────────────────────────────────────────

    // Static resource: full page index
    server.registerResource(
        'page_index',
        'pages://index',
        {
            description: 'The full page index JSON for the indexed directory',
            mimeType: 'application/json',
        },
        async () => {
            const index = readContext(defaultDirectory);
            if (!index) {
                return {
                    contents: [{
                        uri: 'pages://index',
                        text: JSON.stringify({ error: 'No index found. Run index_pages first.' }),
                        mimeType: 'application/json',
                    }],
                };
            }
            return {
                contents: [{
                    uri: 'pages://index',
                    text: JSON.stringify(index, null, 2),
                    mimeType: 'application/json',
                }],
            };
        }
    );

    // Template resource: individual page detail
    server.registerResource(
        'page_detail',
        new ResourceTemplate('pages://detail/{filePath}', { list: undefined }),
        {
            description: 'Individual page metadata and source preview',
            mimeType: 'application/json',
        },
        async (uri: URL, variables: Record<string, string | string[]>) => {
            const fp = variables.filePath;
            const filePath = Array.isArray(fp) ? fp[0] : (fp ?? '');
            const detail = getPageDetail(defaultDirectory, decodeURIComponent(filePath));
            return {
                contents: [{
                    uri: uri.href,
                    text: JSON.stringify({
                        page: detail.page,
                        preview: detail.preview,
                    }, null, 2),
                    mimeType: 'application/json',
                }],
            };
        }
    );

    // ─────────────────────────────────────────────────────────────────
    // PROMPTS
    // ─────────────────────────────────────────────────────────────────

    // Prompt: summarize project
    server.registerPrompt(
        'summarize_project',
        {
            description: 'Generate a structured summary of the indexed Node.js project',
        },
        async () => {
            const index = readContext(defaultDirectory);
            if (!index) {
                return {
                    messages: [{
                        role: 'user' as const,
                        content: { type: 'text' as const, text: 'No index data available. Please run the index_pages tool first.' },
                    }],
                };
            }

            const prompt = [
                'Analyze the following Node.js project index and provide a structured summary:',
                '',
                `Root: ${index.rootDirectory}`,
                `Files: ${index.stats.totalFiles}`,
                `Routes: ${index.stats.totalRoutes}`,
                `Frameworks: ${JSON.stringify(index.stats.frameworks)}`,
                `Page Types: ${JSON.stringify(index.stats.pageTypes)}`,
                '',
                'Files:',
                ...index.pages.map(p =>
                    `- ${p.relativePath} [${p.type}/${p.framework}] (${p.loc} LOC, ${p.routes.length} routes, exports: ${p.exports.map(e => e.name).join(', ') || 'none'})`
                ),
                '',
                'Please provide:',
                '1. A high-level project overview',
                '2. Architecture description',
                '3. Key routes/endpoints',
                '4. Dependencies summary',
                '5. Suggestions for improvement',
            ].join('\n');

            return {
                messages: [{
                    role: 'user' as const,
                    content: { type: 'text' as const, text: prompt },
                }],
            };
        }
    );

    // Prompt: analyze routes
    server.registerPrompt(
        'analyze_routes',
        {
            description: 'Generate a prompt to analyze all API routes and endpoints in the project',
        },
        async () => {
            const index = readContext(defaultDirectory);
            if (!index) {
                return {
                    messages: [{
                        role: 'user' as const,
                        content: { type: 'text' as const, text: 'No index data available. Please run the index_pages tool first.' },
                    }],
                };
            }

            const routePages = index.pages.filter(p => p.routes.length > 0);
            const prompt = [
                'Analyze the following API routes from a Node.js project:',
                '',
                ...routePages.map(p => [
                    `File: ${p.relativePath} (${p.framework})`,
                    ...p.routes.map(r => `  ${r.method} ${r.path} (line ${r.line})`),
                ].join('\n')),
                '',
                'Please analyze:',
                '1. REST convention compliance (naming, HTTP verbs)',
                '2. Missing CRUD operations',
                '3. Potential security concerns (auth, validation)',
                '4. Route organization suggestions',
                '5. API versioning recommendations',
            ].join('\n');

            return {
                messages: [{
                    role: 'user' as const,
                    content: { type: 'text' as const, text: prompt },
                }],
            };
        }
    );

    return server;
}
