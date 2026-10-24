// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import React from 'react';
import {IntlProvider} from 'react-intl';
import {Provider} from 'react-redux';
import {createStore} from 'redux';

import * as client from '../client';
import type {Store} from '../actions';
import type {AssistantCard} from '../types/assistant';

import ActionCard from './action_card';

jest.mock('../client');

// useDisplayName falls back to fetching a missing profile (mattermost-redux/client, not this app's own client):
// stubbed so a holder_id outside the fake redux store below doesn't reach a real, unmocked fetch.
jest.mock('mattermost-redux/client', () => ({
    Client4: {getProfilesByIds: jest.fn().mockResolvedValue([])},
}));

const mockedClient = client as jest.Mocked<typeof client>;

function makeCard(overrides: Partial<AssistantCard> = {}): AssistantCard {
    return {
        id: 'card1',
        user_id: 'alice',
        channel_id: 'channel1',
        kind: 'action',
        tool: 'mcp.ci.deploy',
        tool_title: 'Deploy',
        arguments: {service: 'web-app'},
        why: {engine: 'model', probabilities: {card: 0.91, tool: 0.88}},
        post_ids: ['post1', 'post2'],
        dedupe_key: 'd1',
        status: 'new',
        pinned: false,
        offer_id: 'offer1',
        create_at: 1000,
        update_at: 1000,
        ...overrides,
    };
}

// The minimum host state useDisplayName needs: a profile to resolve, and the teammate name display setting's own
// inputs (getTeammateNameDisplaySetting reads general.config, preferences and general.license).
function renderCard(card: AssistantCard, store: Store) {
    const reduxStore = createStore(() => ({
        entities: {
            general: {config: {}, license: {}},
            preferences: {myPreferences: {}},
            users: {profiles: {bob: {id: 'bob', username: 'bob'}}},
        },
    }));
    return render(
        <Provider store={reduxStore}>
            <IntlProvider
                locale='en'
                onError={() => null}
            >
                <ActionCard
                    card={card}
                    store={store}
                />
            </IntlProvider>
        </Provider>,
    );
}

function makeStore(): Store {
    return {dispatch: jest.fn(), getState: jest.fn(() => ({})) as never};
}

beforeEach(() => jest.clearAllMocks());

describe('ActionCard', () => {
    it('shows the exact parameters', () => {
        renderCard(makeCard(), makeStore());
        expect(screen.getByText('service')).toBeInTheDocument();
        expect(screen.getByText('web-app')).toBeInTheDocument();
    });

    it('shows Run when the offer can be run, and runs it', async () => {
        mockedClient.runAssistantCard.mockResolvedValue({
            card: makeCard(),
            executed: false,
        });
        const offer = {id: 'offer1', status: 'open' as const, holder_id: 'alice', offered_to_me: true, can_run: true, moves_at: 0};
        renderCard(makeCard({offer}), makeStore());

        const run = screen.getByText('Run');
        expect(run).toBeInTheDocument();
        fireEvent.click(run);

        await waitFor(() => expect(mockedClient.runAssistantCard).toHaveBeenCalledWith('channel1', 'card1'));
    });

    it('shows "Offered to <name>" when it\'s someone else\'s, without a Run button', () => {
        const offer = {id: 'offer1', status: 'open' as const, holder_id: 'bob', offered_to_me: false, can_run: false, moves_at: 0};
        renderCard(makeCard({offer}), makeStore());

        expect(screen.getByText('Offered to bob')).toBeInTheDocument();
        expect(screen.queryByText('Run')).toBeNull();
    });

    it('shows Claim when the offer is nobody\'s, and claims it', () => {
        const offer = {id: 'offer1', status: 'open' as const, holder_id: '', offered_to_me: false, can_run: false, moves_at: 0};
        renderCard(makeCard({offer}), makeStore());

        fireEvent.click(screen.getByText('Claim'));

        expect(mockedClient.claimAssistantCard).toHaveBeenCalledWith('channel1', 'card1');
    });

    it('shows the recorded note once the offer is done, matching the executed: false stub', () => {
        const offer = {id: 'offer1', status: 'done' as const, holder_id: 'alice', offered_to_me: false, can_run: false, moves_at: 0, done_by: 'alice', done_at: 2000};
        renderCard(makeCard({offer}), makeStore());

        expect(screen.getByText('Recorded. Running actions comes in a later version.')).toBeInTheDocument();
        expect(screen.queryByText('Run')).toBeNull();
        expect(screen.queryByText('Claim')).toBeNull();
    });
});
