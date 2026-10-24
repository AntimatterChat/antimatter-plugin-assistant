// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

// extractDataPoints looks for a metrics tool's data points in an insight's result text, so a card can draw a
// sparkline next to its summary. AIToolResult (server/public/model/ai_tool.go) is free text, not a structured
// series: the convention this reads is the one the Grafana app's query_metrics and panel_data tools already write
// (formatSeries in antimatter-plugin-grafana/server/ai_tools.go), a line reading
// "  points: <unix time>:<value>, <unix time>:<value>, ...". Any future metrics tool that wants a sparkline should
// write its result the same way; this is the one place that convention is documented for the webapp side.
const pointsLine = /points:\s*([^\n]+)/i;

export function extractDataPoints(result: string | undefined): number[] | null {
    if (!result) {
        return null;
    }
    const match = pointsLine.exec(result);
    if (!match) {
        return null;
    }
    const values = match[1].
        split(',').
        map((pair) => {
            const value = pair.trim().split(':').pop();
            return typeof value === 'string' ? parseFloat(value) : NaN;
        }).
        filter((value) => Number.isFinite(value));
    return values.length >= 2 ? values : null;
}
