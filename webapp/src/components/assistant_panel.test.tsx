// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import {screen} from '@testing-library/react';
import React from 'react';

import * as client from '../client';
import manifest from '../manifest';
import reducer from '../reducer';

import {currentChannelId, makeState, makeStore, renderWithStore} from '../../tests/utils';

import AssistantPanel from './assistant_panel';

jest.mock('../client');

const mockedClient = client as jest.Mocked<typeof client>;

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
});
