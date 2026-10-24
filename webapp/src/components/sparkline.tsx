// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import React from 'react';

import {t} from './styles';

const WIDTH = 160;
const HEIGHT = 32;
const PAD = 2;

// pathFor turns a series of values into an SVG polyline's points, scaled to fill the sparkline's box.
function pathFor(points: number[]): string {
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const step = points.length > 1 ? (WIDTH - (PAD * 2)) / (points.length - 1) : 0;

    return points.
        map((value, i) => {
            const x = PAD + (step * i);
            const y = HEIGHT - PAD - (((value - min) / range) * (HEIGHT - (PAD * 2)));
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).
        join(' ');
}

// Sparkline draws a card's data points as a small inline SVG line chart: no chart library, just a polyline and a
// dot on the last value.
export default function Sparkline({points}: {points: number[]}) {
    if (points.length < 2) {
        return null;
    }
    const line = pathFor(points);
    const last = line.split(' ').pop();
    const [lastX, lastY] = (last || '0,0').split(',');

    return (
        <svg
            width={WIDTH}
            height={HEIGHT}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role='img'
            aria-label={sparklineLabel(points)}
        >
            <polyline
                points={line}
                fill='none'
                stroke={t.accent}
                strokeWidth={1.5}
                strokeLinecap='round'
                strokeLinejoin='round'
            />
            <circle
                cx={lastX}
                cy={lastY}
                r={2}
                fill={t.accent}
            />
        </svg>
    );
}

function sparklineLabel(points: number[]): string {
    const first = points[0];
    const last = points[points.length - 1];
    const min = Math.min(...points);
    const max = Math.max(...points);
    return `${first} to ${last}, min ${min}, max ${max}`;
}
