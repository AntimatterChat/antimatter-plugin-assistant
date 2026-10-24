// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import {render, screen} from '@testing-library/react';
import React from 'react';
import {IntlProvider} from 'react-intl';
import {Provider} from 'react-redux';

import manifest from '../manifest';
import reducer from '../reducer';

import {makeState, makeStore} from '../../tests/utils';

import AssistantRailIcon, {badgeText} from './rail_icon';

function renderIcon(unreadCount: number) {
    const state = makeState({plugin: {...reducer(undefined, {type: '@@INIT'}), unreadCount}});
    const store = makeStore(state);
    return render(
        <Provider store={store}>
            <IntlProvider
                locale='en'
                onError={() => null}
            >
                <AssistantRailIcon/>
            </IntlProvider>
        </Provider>,
    );
}

describe('badgeText', () => {
    it('shows nothing for zero or negative counts', () => {
        expect(badgeText(0)).toBe('');
        expect(badgeText(-1)).toBe('');
    });

    it('shows the exact count up to 9', () => {
        expect(badgeText(1)).toBe('1');
        expect(badgeText(9)).toBe('9');
    });

    it('clamps past 9', () => {
        expect(badgeText(10)).toBe('9+');
        expect(badgeText(42)).toBe('9+');
    });
});

describe('AssistantRailIcon', () => {
    it('has no visible badge and a plain label when there is nothing new', () => {
        renderIcon(0);
        expect(screen.getByRole('img', {name: manifest.name})).toBeInTheDocument();
    });

    it('shows a badge and names the count in its accessible label when there is something new', () => {
        renderIcon(3);
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByRole('img', {name: 'Assistant, 3 new'})).toBeInTheDocument();
    });
});
