/**
 * index_pages tool – scans and indexes all Node.js pages in a target directory
 */
import path from 'node:path';
import { scanDirectory } from '../indexer/scanner.js';
import { parseFile } from '../indexer/parser.js';
import { writeContext } from '../context/contextDir.js';
import type { IndexResult, IndexStats, PageInfo } from '../indexer/types.js';

/**
 * Execute a full index of the given directory.
 * Returns a summary of what was found.
 */
export async function indexPages(directory: string): Promise<{
    summary: string;
    result: IndexResult;
}> {
    const absDir = path.resolve(directory);

    // 1. Scan for files
    const filePaths = await scanDirectory(absDir);

    // 2. Parse each file
    const pages: PageInfo[] = [];
    const errors: string[] = [];

    for (const fp of filePaths) {
        try {
            const info = parseFile(fp, absDir);
            pages.push(info);
        } catch (err) {
            errors.push(`Failed to parse ${fp}: ${(err as Error).message}`);
        }
    }

    // 3. Compute statistics
    const stats = computeStats(pages);

    // 4. Build result
    const result: IndexResult = {
        timestamp: new Date().toISOString(),
        rootDirectory: absDir,
        pages,
        stats,
    };

    // 5. Write context directory
    writeContext(absDir, result);

    // 6. Format summary
    const lines = [
        `✅ Indexed ${stats.totalFiles} files in ${absDir}`,
        `   📄 Routes: ${stats.totalRoutes}`,
        `   📝 Total LOC: ${stats.totalLOC}`,
        `   🏗️  Frameworks: ${Object.entries(stats.frameworks).map(([k, v]) => `${k}(${v})`).join(', ') || 'none detected'}`,
        `   📂 Types: ${Object.entries(stats.pageTypes).map(([k, v]) => `${k}(${v})`).join(', ')}`,
        `   📁 Context written to: ${path.join(absDir, '.mcp/')}`,
    ];

    if (errors.length > 0) {
        lines.push(`   ⚠️  ${errors.length} parse error(s)`);
        lines.push(...errors.slice(0, 5).map(e => `      - ${e}`));
    }

    return {
        summary: lines.join('\n'),
        result,
    };
}

function computeStats(pages: PageInfo[]): IndexStats {
    const stats: IndexStats = {
        totalFiles: pages.length,
        totalRoutes: 0,
        totalLOC: 0,
        frameworks: {},
        pageTypes: {},
        extensions: {},
    };

    for (const page of pages) {
        stats.totalRoutes += page.routes.length;
        stats.totalLOC += page.loc;

        stats.frameworks[page.framework] = (stats.frameworks[page.framework] || 0) + 1;
        stats.pageTypes[page.type] = (stats.pageTypes[page.type] || 0) + 1;
        stats.extensions[page.extension] = (stats.extensions[page.extension] || 0) + 1;
    }

    return stats;
}
