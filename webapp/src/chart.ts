// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

// The maths behind an attachment's chart (see attachment_card.tsx): a sparkline with a dashed threshold line, the
// same shape Fusion's own post attachments draw (webapp/fusion/src/fusion/messages/content/cards.tsx's
// `sparkline`), so a card looks the same whether Fusion's renderer draws it or this app's own fallback does.
const VALUES_MAX = 60;

export type ChartLine = {
    points: string;
    area: string;
    last: {x: number; y: number};
    thresholdY: number | null;
};

// cleanValues keeps the finite numbers, oldest first, capped to the most recent VALUES_MAX: ASSISTANT_DISPLAY.md
// asks tools to send at most 60, but this is defensive against a tool that sends more or something unparseable.
export function cleanValues(values: unknown): number[] {
    if (!Array.isArray(values)) {
        return [];
    }
    const finite = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    return finite.slice(-VALUES_MAX);
}

export function chartLine(values: number[], threshold: number | null, width: number, height: number): ChartLine {
    const all = threshold === null ? values : [...values, threshold];
    const hi = Math.max(...all);
    const lo = Math.min(...all);
    const pad = ((hi - lo) * 0.15) || 1;
    const max = hi + pad;
    const min = lo >= 0 ? Math.max(0, lo - pad) : lo - pad;
    const range = max - min || 1;
    const x = (i: number) => ((i / (values.length - 1)) * (width - 16)) + 8;
    const y = (v: number) => height - 8 - (((v - min) / range) * (height - 16));

    const points = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    return {
        points,
        area: `8,${height - 8} ${points} ${x(values.length - 1).toFixed(1)},${height - 8}`,
        last: {x: x(values.length - 1), y: y(values[values.length - 1])},
        thresholdY: threshold === null ? null : y(threshold),
    };
}
