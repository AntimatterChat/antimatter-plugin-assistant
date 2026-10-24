// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import {act, fireEvent, screen, waitFor} from '@testing-library/react';
import React from 'react';

import {CARD_ADDED} from '../action_types';
import * as client from '../client';
import manifest from '../manifest';
import reducer from '../reducer';
import type {AssistantCard} from '../types/assistant';

import {currentChannelId, makeState, makeStore, renderWithStore} from '../../tests/utils';

import AssistantPanel from './assistant_panel';

jest.mock('../client');

const mockedClient = client as jest.Mocked<typeof client>;

function makeFeedCard(overrides: Partial<AssistantCard> = {}): AssistantCard {
    return {
        id: 'card1',
        user_id: 'alice',
        channel_id: currentChannelId,
        kind: 'insight',
        tool: 'mcp.grafana.query_metrics',
        tool_title: 'Metrics',
        arguments: {},
        why: {engine: 'rules', words: ['cpu']},
        post_ids: ['post1'],
        dedupe_key: 'd1',
        result: 'all fine',
        status: 'new',
        pinned: false,
        create_at: 1000,
        update_at: 1000,
        ...overrides,
    };
}

// mockScrollMetrics stands in for the layout jsdom never performs, so the panel's stick-to-bottom logic (see
// assistant_panel.tsx) has something real to read and write.
function mockScrollMetrics(el: Element, metrics: {scrollTop: number; scrollHeight: number; clientHeight: number}) {
    Object.defineProperty(el, 'scrollHeight', {configurable: true, value: metrics.scrollHeight});
    Object.defineProperty(el, 'clientHeight', {configurable: true, value: metrics.clientHeight});
    (el as HTMLElement).scrollTop = metrics.scrollTop;
}

beforeEach(() => jest.clearAllMocks());

describe('AssistantPanel', () => {
    it('shows one quiet line while the feed hasn\'t loaded yet', () => {
        mockedClient.getAssistantFeed.mockReturnValue(new Promise(() => { /* never resolves in this test */ }));
        mockedClient.setAssistantPresence.mockReturnValue(new Promise(() => { /* idem */ }));
        const store = makeStore(makeState());

        renderWithStore(<AssistantPanel/>, store);

        expect(screen.getByText('Loading…')).toBeInTheDocument();
    });

    it('shows one quiet line when the assistant is off here, and not the feed', async () => {
        mockedClient.getAssistantFeed.mockResolvedValue({channel_id: currentChannelId, enabled: false, on: true, engine: 'rules', cards: []});
        mockedClient.setAssistantPresence.mockResolvedValue({following: false, ttl_seconds: 90, heartbeat_seconds: 30});
        const store = makeStore(makeState());

        renderWithStore(<AssistantPanel/>, store);

        expect(await screen.findByText('The assistant is off here.')).toBeInTheDocument();
    });

    it('shows one quiet empty-state line when there are no cards', async () => {
        mockedClient.getAssistantFeed.mockResolvedValue({channel_id: currentChannelId, enabled: true, on: true, engine: 'rules', cards: []});
        mockedClient.setAssistantPresence.mockResolvedValue({following: true, ttl_seconds: 90, heartbeat_seconds: 30});
        mockedClient.getAssistantMutedTools.mockResolvedValue({tools: []});
        const store = makeStore(makeState());

        renderWithStore(<AssistantPanel/>, store);

        expect(await screen.findByText(/Nothing yet\./)).toBeInTheDocument();
    });

    it('shows the per-channel switch and the feed\'s cards once loaded', async () => {
        const card = {
            id: 'card1',
            user_id: 'alice',
            channel_id: currentChannelId,
            kind: 'insight' as const,
            tool: 'mcp.grafana.query_metrics',
            tool_title: 'Metrics',
            arguments: {},
            why: {engine: 'rules' as const, words: ['cpu']},
            post_ids: ['post1'],
            dedupe_key: 'd1',
            result: 'all fine',
            status: 'new' as const,
            pinned: false,
            create_at: 1000,
            update_at: 1000,
        };
        mockedClient.getAssistantFeed.mockResolvedValue({channel_id: currentChannelId, enabled: true, on: true, engine: 'rules', cards: [card]});
        mockedClient.setAssistantPresence.mockResolvedValue({following: true, ttl_seconds: 90, heartbeat_seconds: 30});
        mockedClient.getAssistantMutedTools.mockResolvedValue({tools: []});
        const store = makeStore(makeState());

        renderWithStore(<AssistantPanel/>, store);

        expect(await screen.findByText('Metrics')).toBeInTheDocument();
        expect(screen.getByRole('checkbox', {name: 'Assistant in this channel'})).toBeChecked();
    });

    it('resets the unread count when it opens', () => {
        mockedClient.getAssistantFeed.mockReturnValue(new Promise(() => { /* never resolves */ }));
        mockedClient.setAssistantPresence.mockReturnValue(new Promise(() => { /* idem */ }));
        const state = makeState({plugin: {...reducer(undefined, {type: '@@INIT'}), unreadCount: 5}});
        const store = makeStore(state);

        renderWithStore(<AssistantPanel/>, store);

        expect((store.getState() as unknown as Record<string, {unreadCount: number}>)[`plugins-${manifest.id}`].unreadCount).toBe(0);
    });

    it('lists cards oldest first, newest last, like a chat', async () => {
        const cards = [
            makeFeedCard({id: 'older', tool_title: 'Older card', create_at: 1000}),
            makeFeedCard({id: 'newer', tool_title: 'Newer card', create_at: 2000}),
        ];
        mockedClient.getAssistantFeed.mockResolvedValue({channel_id: currentChannelId, enabled: true, on: true, engine: 'rules', cards});
        mockedClient.setAssistantPresence.mockResolvedValue({following: true, ttl_seconds: 90, heartbeat_seconds: 30});
        mockedClient.getAssistantMutedTools.mockResolvedValue({tools: []});
        const store = makeStore(makeState());

        renderWithStore(<AssistantPanel/>, store);
        await screen.findByText('Older card');

        const titles = screen.getAllByText(/card$/i).map((el) => el.textContent);
        expect(titles).toEqual(['Older card', 'Newer card']);
    });

    it('scrolls to the bottom once the feed has loaded', async () => {
        Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {configurable: true, value: 150});
        try {
            mockedClient.getAssistantFeed.mockResolvedValue({channel_id: currentChannelId, enabled: true, on: true, engine: 'rules', cards: [makeFeedCard()]});
            mockedClient.setAssistantPresence.mockResolvedValue({following: true, ttl_seconds: 90, heartbeat_seconds: 30});
            mockedClient.getAssistantMutedTools.mockResolvedValue({tools: []});
            const store = makeStore(makeState());

            renderWithStore(<AssistantPanel/>, store);
            const log = await screen.findByRole('log');

            await waitFor(() => expect(log.scrollTop).toBe(150));
        } finally {
            delete (HTMLElement.prototype as {scrollHeight?: number}).scrollHeight;
        }
    });

    it('stays at the bottom when a new card arrives and the reader is already there', async () => {
        mockedClient.getAssistantFeed.mockResolvedValue({channel_id: currentChannelId, enabled: true, on: true, engine: 'rules', cards: [makeFeedCard()]});
        mockedClient.setAssistantPresence.mockResolvedValue({following: true, ttl_seconds: 90, heartbeat_seconds: 30});
        mockedClient.getAssistantMutedTools.mockResolvedValue({tools: []});
        const store = makeStore(makeState());

        renderWithStore(<AssistantPanel/>, store);
        const log = await screen.findByRole('log');
        mockScrollMetrics(log, {scrollTop: 100, scrollHeight: 200, clientHeight: 100});

        act(() => {
            store.dispatch({
                type: CARD_ADDED,
                data: {channelId: currentChannelId, card: makeFeedCard({id: 'card2', create_at: 2000})},
            });
        });
        await waitFor(() => expect(screen.getAllByText('Metrics')).toHaveLength(2));

        expect(log.scrollTop).toBe(200);
        expect(screen.queryByText('New card ↓')).toBeNull();
    });

    it('shows the "New card ↓" chip when a new card arrives while scrolled up, and jumps down on click', async () => {
        mockedClient.getAssistantFeed.mockResolvedValue({channel_id: currentChannelId, enabled: true, on: true, engine: 'rules', cards: [makeFeedCard()]});
        mockedClient.setAssistantPresence.mockResolvedValue({following: true, ttl_seconds: 90, heartbeat_seconds: 30});
        mockedClient.getAssistantMutedTools.mockResolvedValue({tools: []});
        const store = makeStore(makeState());

        renderWithStore(<AssistantPanel/>, store);
        const log = await screen.findByRole('log');
        mockScrollMetrics(log, {scrollTop: 0, scrollHeight: 200, clientHeight: 100});
        fireEvent.scroll(log);

        act(() => {
            store.dispatch({
                type: CARD_ADDED,
                data: {channelId: currentChannelId, card: makeFeedCard({id: 'card2', create_at: 2000, tool_title: 'Second metrics'})},
            });
        });
        const chip = await screen.findByText('New card ↓');
        expect(log.scrollTop).toBe(0);

        fireEvent.click(chip);

        expect(log.scrollTop).toBe(200);
        expect(screen.queryByText('New card ↓')).toBeNull();
    });
});
