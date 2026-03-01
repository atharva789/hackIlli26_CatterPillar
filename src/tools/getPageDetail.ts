/**
 * get_page_detail tool – returns full metadata + content preview for a page
 */
import fs from 'node:fs';
import path from 'node:path';
import { readContext } from '../context/contextDir.js';
import type { PageInfo } from '../indexer/types.js';

const MAX_PREVIEW_LINES = 100;

export interface PageDetailResult {
    summary: string;
    page: PageInfo | null;
    preview: string | null;
}

/**
 * Get full detail for a specific page by its relative file path.
 */
export function getPageDetail(rootDir: string, filePath: string): PageDetailResult {
    const index = readContext(rootDir);

    if (!index) {
        return {
            summary: '⚠️  No index found. Run the "index_pages" tool first.',
            page: null,
            preview: null,
        };
    }

    // Find the page by relative path (or partial match)
    const normalized = filePath.replace(/\\/g, '/');
    const page = index.pages.find(p =>
        p.relativePath.replace(/\\/g, '/') === normalized ||
        p.relativePath.replace(/\\/g, '/').endsWith(normalized)
    );

    if (!page) {
        return {
            summary: `⚠️  Page "${filePath}" not found in the index. Available pages:\n${index.pages.slice(0, 10).map(p => `  • ${p.relativePath}`).join('\n')}`,
            page: null,
            preview: null,
        };
    }

    // Read content preview
    let preview: string | null = null;
    const absPath = path.isAbsolute(page.filePath) ? page.filePath : path.join(rootDir, page.filePath);
    try {
        const content = fs.readFileSync(absPath, 'utf-8');
        const lines = content.split('\n');
        preview = lines.slice(0, MAX_PREVIEW_LINES).join('\n');
        if (lines.length > MAX_PREVIEW_LINES) {
            preview += `\n... (${lines.length - MAX_PREVIEW_LINES} more lines)`;
        }
    } catch {
        preview = '(unable to read file content)';
    }

    // Build summary
    const lines = [
        `📄 **${page.relativePath}**`,
        `   Type: ${page.type} | Framework: ${page.framework}`,
        `   LOC: ${page.loc} | Size: ${(page.size / 1024).toFixed(1)}KB`,
        `   Last Modified: ${page.lastModified}`,
    ];

    if (page.routes.length > 0) {
        lines.push(`   Routes:`);
        page.routes.forEach(r => lines.push(`     ${r.method} ${r.path} (line ${r.line})`));
    }

    if (page.exports.length > 0) {
        lines.push(`   Exports: ${page.exports.map(e => e.name).join(', ')}`);
    }

    if (page.dependencies.length > 0) {
        lines.push(`   Dependencies: ${page.dependencies.map(d => d.source).join(', ')}`);
    }

    return {
        summary: lines.join('\n'),
        page,
        preview,
    };
}
