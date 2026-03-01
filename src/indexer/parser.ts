/**
 * File parser – extracts metadata from individual files
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type {
    PageInfo,
    PageType,
    Framework,
    RouteInfo,
    ExportInfo,
    DependencyInfo,
} from './types.js';

/**
 * Parse a single file and extract structured metadata.
 */
export function parseFile(filePath: string, rootDir: string): PageInfo {
    const content = fs.readFileSync(filePath, 'utf-8');
    const stat = fs.statSync(filePath);
    const relativePath = path.relative(rootDir, filePath);
    const ext = path.extname(filePath);
    const name = path.basename(filePath, ext);

    const lines = content.split('\n');
    const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);

    const dependencies = extractDependencies(lines);
    const framework = detectFramework(dependencies, relativePath);
    const routes = extractRoutes(lines, framework);
    const exports = extractExports(lines);
    const type = detectPageType(relativePath, framework, routes, exports);

    return {
        filePath,
        relativePath,
        name,
        extension: ext,
        type,
        framework,
        routes,
        exports,
        dependencies,
        loc: lines.length,
        size: stat.size,
        lastModified: stat.mtime.toISOString(),
        hash,
    };
}

// ─── Framework Detection ─────────────────────────────────────────────

function detectFramework(deps: DependencyInfo[], relativePath: string): Framework {
    const sources = deps.map(d => d.source);

    if (sources.some(s => s === 'express' || s.startsWith('express/'))) return 'express';
    if (sources.some(s => s === 'next' || s.startsWith('next/'))) return 'nextjs';
    if (sources.some(s => s === 'koa' || s.startsWith('koa/'))) return 'koa';
    if (sources.some(s => s === '@hapi/hapi' || s === 'hapi')) return 'hapi';
    if (sources.some(s => s === 'fastify' || s.startsWith('fastify/'))) return 'fastify';

    // Detect Next.js by file path conventions
    const normalizedPath = relativePath.replace(/\\/g, '/');
    if (
        normalizedPath.includes('pages/') ||
        normalizedPath.includes('app/') &&
        (normalizedPath.endsWith('page.tsx') || normalizedPath.endsWith('page.jsx') ||
            normalizedPath.endsWith('page.ts') || normalizedPath.endsWith('page.js') ||
            normalizedPath.endsWith('layout.tsx') || normalizedPath.endsWith('layout.jsx') ||
            normalizedPath.endsWith('route.ts') || normalizedPath.endsWith('route.js'))
    ) {
        return 'nextjs';
    }

    if (deps.length === 0 && relativePath.endsWith('.html')) return 'vanilla';

    return 'unknown';
}

// ─── Page Type Detection ─────────────────────────────────────────────

function detectPageType(
    relativePath: string,
    framework: Framework,
    routes: RouteInfo[],
    exports: ExportInfo[]
): PageType {
    const normalized = relativePath.replace(/\\/g, '/');

    // Config files
    if (/\.(config|rc)\.(js|ts|mjs|cjs)$/.test(normalized)) return 'config';
    if (normalized.includes('config/') || normalized.includes('.config')) return 'config';

    // Middleware
    if (
        normalized.includes('middleware') ||
        exports.some(e => e.name === 'middleware')
    ) return 'middleware';

    // Route files (Express/Koa/Fastify)
    if (routes.length > 0) return 'route';

    // Next.js pages
    if (framework === 'nextjs') return 'page';

    // Static HTML
    if (normalized.endsWith('.html')) return 'static';

    // Components (React/Vue naming conventions)
    if (/\/components?\//.test(normalized)) return 'component';

    // If it has a default export, it's likely a page or component
    if (exports.some(e => e.name === 'default')) return 'page';

    return 'unknown';
}

// ─── Dependency Extraction ───────────────────────────────────────────

function extractDependencies(lines: string[]): DependencyInfo[] {
    const deps: DependencyInfo[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // ES import: import X from 'Y'  /  import { A, B } from 'Y'
        const esMatch = line.match(
            /import\s+(?:(?:(\w+)(?:\s*,\s*)?)?(?:\{([^}]*)\})?\s+from\s+)?['"]([^'"]+)['"]/
        );
        if (esMatch) {
            const defaultImport = esMatch[1];
            const namedImports = esMatch[2];
            const source = esMatch[3];
            const imports: string[] = [];
            if (defaultImport) imports.push(defaultImport);
            if (namedImports) {
                imports.push(
                    ...namedImports.split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean)
                );
            }
            deps.push({ source, imports, line: i + 1 });
            continue;
        }

        // CJS require: const X = require('Y')
        const cjsMatch = line.match(
            /(?:const|let|var)\s+(?:(\w+)|\{([^}]*)\})\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/
        );
        if (cjsMatch) {
            const defaultImport = cjsMatch[1];
            const namedImports = cjsMatch[2];
            const source = cjsMatch[3];
            const imports: string[] = [];
            if (defaultImport) imports.push(defaultImport);
            if (namedImports) {
                imports.push(
                    ...namedImports.split(',').map(s => s.trim().split(/\s*:\s*/)[0].trim()).filter(Boolean)
                );
            }
            deps.push({ source, imports, line: i + 1 });
        }
    }

    return deps;
}

// ─── Route Extraction ────────────────────────────────────────────────

function extractRoutes(lines: string[], framework: Framework): RouteInfo[] {
    const routes: RouteInfo[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Express/Koa/Fastify: app.get('/path', ...) or router.post('/path', ...)
        const routeMatch = line.match(
            /(?:app|router|server|fastify)\s*\.\s*(get|post|put|patch|delete|all|use|head|options)\s*\(\s*['"`]([^'"`]+)['"`]/i
        );
        if (routeMatch) {
            routes.push({
                method: routeMatch[1].toUpperCase(),
                path: routeMatch[2],
                line: i + 1,
            });
        }

        // Hapi: server.route({ method: 'GET', path: '/api' })
        const hapiMatch = line.match(
            /server\s*\.\s*route\s*\(\s*\{\s*method:\s*['"`](\w+)['"`]\s*,\s*path:\s*['"`]([^'"`]+)['"`]/
        );
        if (hapiMatch) {
            routes.push({
                method: hapiMatch[1].toUpperCase(),
                path: hapiMatch[2],
                line: i + 1,
            });
        }
    }

    return routes;
}

// ─── Export Extraction ───────────────────────────────────────────────

function extractExports(lines: string[]): ExportInfo[] {
    const exports: ExportInfo[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // export default
        if (/export\s+default\b/.test(line)) {
            exports.push({ name: 'default', type: 'default', line: i + 1 });
            continue;
        }

        // export const/function/class
        const namedExport = line.match(
            /export\s+(?:const|let|var|function|class|async\s+function)\s+(\w+)/
        );
        if (namedExport) {
            exports.push({ name: namedExport[1], type: 'named', line: i + 1 });
            continue;
        }

        // module.exports
        if (/module\s*\.\s*exports\s*=/.test(line)) {
            exports.push({ name: 'default', type: 'cjs', line: i + 1 });
            continue;
        }

        // exports.X
        const cjsNamed = line.match(/exports\s*\.\s*(\w+)\s*=/);
        if (cjsNamed) {
            exports.push({ name: cjsNamed[1], type: 'cjs', line: i + 1 });
        }
    }

    return exports;
}
