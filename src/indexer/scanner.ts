/**
 * Directory scanner – walks a target directory tree and finds indexable files
 */
import { glob } from 'glob';
import path from 'node:path';

/** Default file patterns to scan */
const DEFAULT_PATTERNS = [
    '**/*.js',
    '**/*.ts',
    '**/*.jsx',
    '**/*.tsx',
    '**/*.mjs',
    '**/*.cjs',
    '**/*.html',
];

/** Directories to always skip */
const DEFAULT_IGNORE = [
    '**/node_modules/**',
    '**/.git/**',
    '**/build/**',
    '**/dist/**',
    '**/.mcp/**',
    '**/.next/**',
    '**/coverage/**',
    '**/*.d.ts',
    '**/*.map',
];

export interface ScanOptions {
    patterns?: string[];
    ignore?: string[];
}

/**
 * Scan a directory for indexable files.
 * Returns an array of absolute file paths.
 */
export async function scanDirectory(
    rootDir: string,
    options: ScanOptions = {}
): Promise<string[]> {
    const patterns = options.patterns ?? DEFAULT_PATTERNS;
    const ignore = options.ignore ?? DEFAULT_IGNORE;

    const absRoot = path.resolve(rootDir);

    const files = await glob(patterns, {
        cwd: absRoot,
        absolute: true,
        nodir: true,
        ignore,
    });

    // Sort for deterministic output
    return files.sort();
}
