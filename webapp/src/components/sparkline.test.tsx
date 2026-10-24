// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import {render} from '@testing-library/react';
import React from 'react';

import Sparkline from './sparkline';

describe('Sparkline', () => {
    it('draws a polyline with one point per value', () => {
        const {container} = render(<Sparkline points={[12, 23, 61, 30]}/>);

        const polyline = container.querySelector('polyline');
        expect(polyline).not.toBeNull();
        expect(polyline?.getAttribute('points')?.trim().split(' ')).toHaveLength(4);
    });

    it('gives the chart an accessible label summarising the values', () => {
        const {container} = render(<Sparkline points={[12, 23, 61, 30]}/>);

        const svg = container.querySelector('svg');
        expect(svg?.getAttribute('aria-label')).toBe('12 to 30, min 12, max 61');
    });

    it('renders nothing for fewer than two points', () => {
        const {container} = render(<Sparkline points={[12]}/>);
        expect(container.querySelector('svg')).toBeNull();
    });
});
