// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import {extractDataPoints} from './sparkline';

describe('extractDataPoints', () => {
    it('reads the Grafana app\'s "points: t:v, t:v, ..." line', () => {
        const result = 'www-1 (panel cpu): 1 series\n- {}: last=23 min=12 max=61 avg=30\n  points: 1700000000:12, 1700000060:23, 1700000120:61, 1700000180:30';
        expect(extractDataPoints(result)).toEqual([12, 23, 61, 30]);
    });

    it('returns null when there is no points line', () => {
        expect(extractDataPoints('www-1 CPU, last hour: 23% average, 61% peak at 14:05')).toBeNull();
    });

    it('returns null for a single point (nothing to draw a line with)', () => {
        expect(extractDataPoints('points: 1700000000:12')).toBeNull();
    });

    it('returns null for undefined or empty results', () => {
        expect(extractDataPoints(undefined)).toBeNull();
        expect(extractDataPoints('')).toBeNull();
    });

    it('skips values that fail to parse rather than throwing', () => {
        expect(extractDataPoints('points: 1700000000:12, 1700000060:oops, 1700000120:61')).toEqual([12, 61]);
    });
});
