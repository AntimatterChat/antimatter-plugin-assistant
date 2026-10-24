// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import {render, screen} from '@testing-library/react';
import React from 'react';
import {IntlProvider} from 'react-intl';
import {Provider} from 'react-redux';
import {createStore} from 'redux';

import type {Store} from '../actions';
import type {AssistantCard as AssistantCardType} from '../types/assistant';

import Card from './card';

jest.mock('../client');

// useDisplayName (used by action cards, even those without an offer) falls back to a real fetch for a profile it
// doesn't have: stubbed so it never reaches the network in this test.
jest.mock('mattermost-redux/client', () => ({
    Client4: {getProfilesByIds: jest.fn().mockResolvedValue([])},
}));

function makeStore(): Store {
    return {dispatch: jest.fn(), getState: jest.fn(() => ({})) as never};
}

// The minimum host state useDisplayName needs even when there's no offer to resolve a name for: see
// getTeammateNameDisplaySetting (general.config, preferences, general.license).
function renderCard(card: AssistantCardType) {
    const reduxStore = createStore(() => ({
        entities: {
            general: {config: {}, license: {}},
            preferences: {myPreferences: {}},
            users: {profiles: {}},
        },
    }));
    return render(
        <Provider store={reduxStore}>
            <IntlProvider
                locale='en'
                onError={() => null}
            >
                <Card
                    card={card}
                    store={makeStore()}
                />
            </IntlProvider>
        </Provider>,
    );
}

const base = {
    id: 'card1',
    user_id: 'alice',
    channel_id: 'channel1',
    arguments: {},
    why: {engine: 'rules' as const},
    post_ids: ['post1'],
    dedupe_key: 'd1',
    status: 'new' as const,
    pinned: false,
    create_at: 1000,
    update_at: 1000,
};

describe('Card', () => {
    it('renders an insight card with its result and Post to channel', () => {
        renderCard({...base, kind: 'insight', tool: 'mcp.grafana.query_metrics', tool_title: 'Metrics', result: 'all fine'});

        expect(screen.getByText('Metrics')).toBeInTheDocument();
        expect(screen.getByText('all fine')).toBeInTheDocument();
        expect(screen.getByText('Post to channel')).toBeInTheDocument();
    });

    it('renders an action card with its parameters and no Post to channel', () => {
        renderCard({...base, kind: 'action', tool: 'mcp.ci.deploy', tool_title: 'Deploy', arguments: {service: 'web'}});

        expect(screen.getByText('Deploy')).toBeInTheDocument();
        expect(screen.getByText('service')).toBeInTheDocument();
        expect(screen.queryByText('Post to channel')).toBeNull();
    });
});
