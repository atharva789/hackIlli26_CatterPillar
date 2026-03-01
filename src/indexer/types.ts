/**
 * Shared types for the Node.js page indexer
 */

/** The type of page detected */
export type PageType = 'route' | 'page' | 'component' | 'middleware' | 'static' | 'config' | 'unknown';

/** The framework detected in the file */
export type Framework = 'express' | 'nextjs' | 'koa' | 'hapi' | 'fastify' | 'vanilla' | 'unknown';

/** Route information extracted from a file */
export interface RouteInfo {
    method: string;   // GET, POST, PUT, DELETE, ALL, USE
    path: string;     // /api/users, /dashboard, etc.
    line: number;     // Line number where the route is defined
}

/** Export information */
export interface ExportInfo {
    name: string;     // "default", "handler", "getServerSideProps", etc.
    type: 'default' | 'named' | 'cjs';
    line: number;
}

/** Dependency/import information */
export interface DependencyInfo {
    source: string;   // "express", "./utils", "@/lib/db"
    imports: string[]; // ["Router", "Request"]
    line: number;
}

/** Full metadata for an indexed page */
export interface PageInfo {
    /** Absolute file path */
    filePath: string;
    /** Relative path from index root */
    relativePath: string;
    /** File name without extension */
    name: string;
    /** File extension */
    extension: string;
    /** Detected page type */
    type: PageType;
    /** Detected framework */
    framework: Framework;
    /** Routes defined in this file */
    routes: RouteInfo[];
    /** Exports from this file */
    exports: ExportInfo[];
    /** Dependencies/imports */
    dependencies: DependencyInfo[];
    /** Lines of code */
    loc: number;
    /** File size in bytes */
    size: number;
    /** Last modified timestamp */
    lastModified: string;
    /** Content hash for deduplication */
    hash: string;
}

/** Result of a full index operation */
export interface IndexResult {
    /** When the index was created */
    timestamp: string;
    /** Root directory that was indexed */
    rootDirectory: string;
    /** All indexed pages */
    pages: PageInfo[];
    /** Summary statistics */
    stats: IndexStats;
}

/** Summary statistics for an index */
export interface IndexStats {
    totalFiles: number;
    totalRoutes: number;
    totalLOC: number;
    frameworks: Record<string, number>;
    pageTypes: Record<string, number>;
    extensions: Record<string, number>;
}

/** Tools manifest entry */
export interface ToolManifest {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
}
