/**
 * search_pages tool – queries the indexed pages
 */
import { readContext } from '../context/contextDir.js';
import type { PageInfo, Framework, PageType } from '../indexer/types.js';

export interface SearchOptions {
    query?: string;
    framework?: string;
    type?: string;
}

/**
 * Search the index for pages matching the given criteria.
 */
export function searchPages(rootDir: string, options: SearchOptions): {
    summary: string;
    matches: PageInfo[];
} {
    const index = readContext(rootDir);

    if (!index) {
        return {
            summary: '⚠️  No index found. Run the "index_pages" tool first.',
            matches: [],
        };
    }

    let matches = index.pages;

    // Filter by framework
    if (options.framework) {
        const fw = options.framework.toLowerCase() as Framework;
        matches = matches.filter(p => p.framework === fw);
    }

    // Filter by type
    if (options.type) {
        const pt = options.type.toLowerCase() as PageType;
        matches = matches.filter(p => p.type === pt);
    }

    // Filter by text query (fuzzy match on path, name, routes)
    if (options.query) {
        const q = options.query.toLowerCase();
        matches = matches.filter(p => {
            const searchable = [
                p.relativePath,
                p.name,
                ...p.routes.map(r => r.path),
                ...p.exports.map(e => e.name),
            ].join(' ').toLowerCase();
            return searchable.includes(q);
        });
    }

    const summary = matches.length === 0
        ? '🔍 No pages matched your query.'
        : [
            `🔍 Found ${matches.length} matching page(s):`,
            ...matches.map(p =>
                `  • ${p.relativePath} [${p.type}/${p.framework}] ${p.routes.length > 0 ? `(${p.routes.length} routes)` : ''}`
            ),
        ].join('\n');

    return { summary, matches };
}
