// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import {CARD_ADDED, FEED_RECEIVED} from './action_types';
import reducer from './reducer';
import type {AssistantCard, AssistantFeed} from './types/assistant';

function makeCard(overrides: Partial<AssistantCard> = {}): AssistantCard {
    return {
        id: 'card1',
        user_id: 'alice',
        channel_id: 'channel1',
        kind: 'insight',
        tool: 'mcp.grafana.query_prometheus',
        tool_title: 'Query Prometheus',
        arguments: {},
        why: {engine: 'rules'},
        post_ids: [],
        dedupe_key: 'd1',
        status: 'new',
        pinned: false,
        create_at: 1000,
        update_at: 1000,
        ...overrides,
    };
}

function feedReceived(cards: AssistantCard[]) {
    const feed: AssistantFeed = {channel_id: 'channel1', enabled: true, on: true, engine: 'rules', cards};
    return reducer(undefined, {type: FEED_RECEIVED, data: {channelId: 'channel1', feed}});
}

describe('reducer: feed order', () => {
    it('orders cards oldest first, newest last, like a chat', () => {
        const state = feedReceived([
            makeCard({id: 'c2', create_at: 2000}),
            makeCard({id: 'c1', create_at: 1000}),
            makeCard({id: 'c3', create_at: 3000}),
        ]);

        expect(state.channels.channel1.order).toEqual(['c1', 'c2', 'c3']);
    });

    it('keeps a pinned card in its chronological place rather than moving it to the top', () => {
        const state = feedReceived([
            makeCard({id: 'c1', create_at: 1000}),
            makeCard({id: 'c2', create_at: 2000, pinned: true}),
            makeCard({id: 'c3', create_at: 3000}),
        ]);

        expect(state.channels.channel1.order).toEqual(['c1', 'c2', 'c3']);
    });

    it('appends a freshly added card at the end', () => {
        let state = feedReceived([makeCard({id: 'c1', create_at: 1000})]);
        state = reducer(state, {
            type: CARD_ADDED,
            data: {channelId: 'channel1', card: makeCard({id: 'c2', create_at: 2000})},
        });

        expect(state.channels.channel1.order).toEqual(['c1', 'c2']);
    });

    it('drops dismissed cards from the order', () => {
        const state = feedReceived([
            makeCard({id: 'c1', create_at: 1000, status: 'dismissed'}),
            makeCard({id: 'c2', create_at: 2000}),
        ]);

        expect(state.channels.channel1.order).toEqual(['c2']);
    });
});
