/**
 * list_available_tools tool – self-documenting tool manifest
 */
import { getToolsManifest } from '../context/contextDir.js';

/**
 * Returns a formatted list of all tools this server provides.
 */
export function listAvailableTools(): string {
    const tools = getToolsManifest();

    const lines = [
        `🔧 **Available MCP Tools** (${tools.length}):`,
        '',
    ];

    for (const tool of tools) {
        lines.push(`### ${tool.name}`);
        lines.push(`${tool.description}`);

        const schema = tool.inputSchema as Record<string, unknown>;
        const props = schema.properties as Record<string, Record<string, unknown>> | undefined;
        if (props && Object.keys(props).length > 0) {
            lines.push('**Parameters:**');
            for (const [key, value] of Object.entries(props)) {
                const desc = value.description || '';
                const required = (schema.required as string[] || []).includes(key);
                lines.push(`  - \`${key}\` (${value.type})${required ? ' *required*' : ''}: ${desc}`);
            }
        } else {
            lines.push('**Parameters:** none');
        }
        lines.push('');
    }

    return lines.join('\n');
}
