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

import InsightCard from './insight_card';

jest.mock('../client');

const mockedClient = client as jest.Mocked<typeof client>;

function makeCard(overrides: Partial<AssistantCard> = {}): AssistantCard {
    return {
        id: 'card1',
        user_id: 'alice',
        channel_id: 'channel1',
        kind: 'insight',
        tool: 'mcp.grafana.query_prometheus',
        tool_title: 'Query Prometheus',
        arguments: {host: 'www-1'},
        why: {engine: 'rules', words: ['cpu on www-1']},
        post_ids: ['post1'],
        dedupe_key: 'd1',
        result: 'www-1 CPU, last hour: 23% average, 61% peak',
        status: 'new',
        pinned: false,
        create_at: 1000,
        update_at: 1000,
        ...overrides,
    };
}

function makeStore(): Store {
    return {dispatch: jest.fn(), getState: jest.fn(() => ({})) as never};
}

// A plain redux store for the "why" row's HIGHLIGHT_REPLY/SELECT_POST dispatches (see why_row.tsx), which read no
// state of their own.
function renderCard(card: AssistantCard, store: Store) {
    const reduxStore = createStore(() => ({}));
    return render(
        <Provider store={reduxStore}>
            <IntlProvider
                locale='en'
                onError={() => null}
            >
                <InsightCard
                    card={card}
                    store={store}
                />
            </IntlProvider>
        </Provider>,
    );
}

beforeEach(() => jest.clearAllMocks());

describe('InsightCard', () => {
    it('shows the title, summary and why', () => {
        renderCard(makeCard(), makeStore());

        expect(screen.getByText('Query Prometheus')).toBeInTheDocument();
        expect(screen.getByText(/www-1 CPU, last hour/)).toBeInTheDocument();
        expect(screen.getByText('Matched "cpu on www-1"')).toBeInTheDocument();
    });

    it('shows a sparkline when the result has data points', () => {
        const {container} = renderCard(makeCard({result: 'host: last=61\n  points: 1:10, 2:20, 3:30'}), makeStore());
        expect(container.querySelector('svg polyline')).not.toBeNull();
    });

    it('shows no sparkline when the result has none', () => {
        const {container} = renderCard(makeCard(), makeStore());
        expect(container.querySelector('svg polyline')).toBeNull();
    });

    it('shows a warning before posting, naming the tool\'s source, and only posts once confirmed', async () => {
        mockedClient.postAssistantCard.mockResolvedValue({id: 'post1'});
        renderCard(makeCard(), makeStore());

        fireEvent.click(screen.getByText('Post to channel'));

        expect(screen.getByText('Some people in this channel may not have access to Grafana.')).toBeInTheDocument();
        expect(mockedClient.postAssistantCard).not.toHaveBeenCalled();

        fireEvent.click(screen.getByText('Post anyway'));

        await waitFor(() => expect(mockedClient.postAssistantCard).toHaveBeenCalledWith('channel1', 'card1'));
    });

    it('cancelling the warning posts nothing', () => {
        renderCard(makeCard(), makeStore());

        fireEvent.click(screen.getByText('Post to channel'));
        fireEvent.click(screen.getByText('Cancel'));

        expect(screen.getByText('Post to channel')).toBeInTheDocument();
        expect(mockedClient.postAssistantCard).not.toHaveBeenCalled();
    });

    it('shows a posted note instead of the buttons once posted', () => {
        renderCard(makeCard({status: 'posted'}), makeStore());

        expect(screen.getByText('Posted to the channel.')).toBeInTheDocument();
        expect(screen.queryByText('Post to channel')).toBeNull();
    });

    it('pin, dismiss and mute send the card\'s own id and channel', () => {
        mockedClient.pinAssistantCard.mockResolvedValue(makeCard({pinned: true}));
        mockedClient.dismissAssistantCard.mockResolvedValue(makeCard({status: 'dismissed'}));
        mockedClient.muteAssistantCard.mockResolvedValue(makeCard({status: 'dismissed'}));
        renderCard(makeCard(), makeStore());

        fireEvent.click(screen.getByText('Pin'));
        expect(mockedClient.pinAssistantCard).toHaveBeenCalledWith('channel1', 'card1', true);

        fireEvent.click(screen.getByText('Dismiss'));
        expect(mockedClient.dismissAssistantCard).toHaveBeenCalledWith('channel1', 'card1');

        fireEvent.click(screen.getByText("Don't suggest this kind again"));
        expect(mockedClient.muteAssistantCard).toHaveBeenCalledWith('channel1', 'card1');
    });
});
