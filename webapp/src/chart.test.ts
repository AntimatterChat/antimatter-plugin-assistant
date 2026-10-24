// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import {chartLine, cleanValues} from './chart';

describe('cleanValues', () => {
    it('keeps only finite numbers', () => {
        expect(cleanValues([1, 'two', null, 3, NaN, Infinity])).toEqual([1, 3]);
    });

    it('returns an empty array for anything that is not an array', () => {
        expect(cleanValues(undefined)).toEqual([]);
        expect(cleanValues('nope')).toEqual([]);
    });

    it('caps to the most recent 60 values', () => {
        const values = Array.from({length: 65}, (_, i) => i);
        const cleaned = cleanValues(values);
        expect(cleaned).toHaveLength(60);
        expect(cleaned[0]).toBe(5);
        expect(cleaned[59]).toBe(64);
    });
});

describe('chartLine', () => {
    it('places the last point at the series\' final x position', () => {
        const line = chartLine([1, 2, 3], null, 100, 50);
        const lastX = Number(line.points.split(' ').pop()?.split(',')[0]);
        expect(line.last.x).toBeCloseTo(lastX);
        expect(line.last.x).toBeCloseTo(92);
    });

    it('gives no threshold line when there is no threshold', () => {
        expect(chartLine([1, 2, 3], null, 100, 50).thresholdY).toBeNull();
    });

    it('places a threshold within the drawing area when one is given', () => {
        const line = chartLine([1, 2, 3], 2, 100, 50);
        expect(line.thresholdY).not.toBeNull();
        expect(line.thresholdY as number).toBeGreaterThanOrEqual(0);
        expect(line.thresholdY as number).toBeLessThanOrEqual(50);
    });

    it('does not divide by zero for a flat series', () => {
        const line = chartLine([5, 5, 5], null, 100, 50);
        expect(Number.isFinite(line.last.y)).toBe(true);
    });
});
