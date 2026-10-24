// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

// sourceNameFromTool guesses a tool's service name from its full name ("<namespace>.<local name>", e.g.
// "mcp.grafana.query_prometheus" or "com.antimatterchat.grafana.query_metrics"), for the "Post to channel" warning
// ("Some people in this channel may not have access to <source>."). A card doesn't carry a separate, human source
// name (AssistantCard only has the tool's full name and title), so this is a heuristic: the MCP server's slug, or
// an app's own last namespace segment, title-cased. It's a reasonable guess, not a guarantee; a server-supplied
// source name on the card would be better and is worth asking for if this reads oddly in practice.
export function sourceNameFromTool(tool: string): string {
    const segments = tool.split('.');

    // Drop the tool's own local name, keeping the namespace.
    segments.pop();
    if (segments.length === 0) {
        return titleCase(tool);
    }
    if (segments[0] === 'mcp' && segments.length > 1) {
        return titleCase(segments[1]);
    }
    return titleCase(segments[segments.length - 1]);
}

function titleCase(word: string): string {
    const spaced = word.replace(/[_-]+/g, ' ').trim();
    if (!spaced) {
        return word;
    }
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
