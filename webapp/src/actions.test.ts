// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import type {AnyAction} from 'redux';

import * as client from './client';
import {
    claimCard,
    dismissCard,
    handleCardAdded,
    handleCardUpdated,
    handleOfferUpdated,
    loadFeed,
    loadMutedTools,
    muteCard,
    pinCard,
    postCard,
    runCard,
    setChannelOn,
    type Store,
    unmuteTool,
} from './actions';
import manifest from './manifest';
import reducer, {type AssistantPluginState} from './reducer';
import {getCards, getChannelFeed, getMutedTools, getUnreadCount, isAssistantKnownOff} from './selectors';
import type {AssistantCard, AssistantFeed} from './types/assistant';
import type {WebSocketMessage} from './types/host';

jest.mock('./client');

const mockedClient = client as jest.Mocked<typeof client>;
const channelId = 'channel1';

function makeTestStore(): Store {
    let state: AssistantPluginState = reducer(undefined, {type: '@@INIT'});
    return {
        dispatch: (action: AnyAction) => {
            state = reducer(state, action);
            return action;
        },
        getState: () => ({[`plugins-${manifest.id}`]: state}) as never,
    };
}

function makeCard(overrides: Partial<AssistantCard> = {}): AssistantCard {
    return {
        id: 'card1',
        user_id: 'alice',
        channel_id: channelId,
        kind: 'insight',
        tool: 'mcp.grafana.query_prometheus',
        tool_title: 'Query Prometheus',
        arguments: {},
        why: {engine: 'rules', words: ['cpu on www-1']},
        post_ids: ['post1'],
        dedupe_key: 'd1',
        result: 'www-1 CPU, last hour: 23% average',
        status: 'new',
        pinned: false,
        create_at: 1000,
        update_at: 1000,
        ...overrides,
    };
}

function makeFeed(overrides: Partial<AssistantFeed> = {}): AssistantFeed {
    return {
        channel_id: channelId,
        enabled: true,
        on: true,
        engine: 'rules',
        cards: [],
        ...overrides,
    };
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('loadFeed', () => {
    it('loads a channel\'s feed and stores enabled/on/engine and its cards', async () => {
        const card = makeCard();
        mockedClient.getAssistantFeed.mockResolvedValue(makeFeed({cards: [card]}));
        const store = makeTestStore();

        await loadFeed(store, channelId);

        expect(mockedClient.getAssistantFeed).toHaveBeenCalledWith(channelId);
        const feed = getChannelFeed(store.getState(), channelId);
        expect(feed.loaded).toBe(true);
        expect(feed.enabled).toBe(true);
        expect(feed.on).toBe(true);
        expect(isAssistantKnownOff(store.getState())).toBe(false);
        expect(getCards(store.getState(), channelId)).toEqual([card]);
    });

    it('marks the assistant as off when the feed says it is', async () => {
        mockedClient.getAssistantFeed.mockResolvedValue(makeFeed({enabled: false}));
        const store = makeTestStore();

        await loadFeed(store, channelId);

        expect(isAssistantKnownOff(store.getState())).toBe(true);
        expect(getChannelFeed(store.getState(), channelId).enabled).toBe(false);
    });
});

describe('websocket events', () => {
    function msg<T>(data: T): WebSocketMessage<T> {
        return {event: 'x', data, broadcast: {channel_id: channelId, team_id: 't', user_id: 'alice'}};
    }

    it('adds a card from assistant_card_added and counts it unread', () => {
        const store = makeTestStore();
        const card = makeCard();

        handleCardAdded(store, msg({channel_id: channelId, card}));

        expect(getCards(store.getState(), channelId)).toEqual([card]);
        expect(getUnreadCount(store.getState())).toBe(1);

        handleCardAdded(store, msg({channel_id: channelId, card: makeCard({id: 'card2'})}));
        expect(getUnreadCount(store.getState())).toBe(2);
    });

    it('applies assistant_card_updated (e.g. pinned or dismissed from another client)', () => {
        const store = makeTestStore();
        const card = makeCard();
        handleCardAdded(store, msg({channel_id: channelId, card}));

        handleCardUpdated(store, msg({channel_id: channelId, card: {...card, pinned: true}}));
        expect(getCards(store.getState(), channelId)[0].pinned).toBe(true);

        handleCardUpdated(store, msg({channel_id: channelId, card: {...card, pinned: true, status: 'dismissed'}}));
        expect(getCards(store.getState(), channelId)).toEqual([]);
    });

    it('applies assistant_offer_updated to the matching card\'s offer', () => {
        const store = makeTestStore();
        const card = makeCard({
            kind: 'action',
            offer_id: 'offer1',
            offer: {id: 'offer1', status: 'open', holder_id: '', offered_to_me: false, can_run: false, moves_at: 0},
        });
        handleCardAdded(store, msg({channel_id: channelId, card}));

        handleOfferUpdated(store, msg({
            channel_id: channelId,
            card_id: card.id,
            offer: {id: 'offer1', status: 'open', holder_id: 'alice', offered_to_me: true, can_run: true, moves_at: 123},
        }));

        const updated = getCards(store.getState(), channelId)[0];
        expect(updated.offer?.holder_id).toBe('alice');
        expect(updated.offer?.can_run).toBe(true);
    });
});

describe('panelOpened resets the unread count', () => {
    it('resets to 0 once the panel is shown again', () => {
        const store = makeTestStore();
        handleCardAdded(store, {event: 'x', data: {channel_id: channelId, card: makeCard()}, broadcast: {channel_id: channelId, team_id: 't', user_id: 'alice'}});
        expect(getUnreadCount(store.getState())).toBe(1);

        store.dispatch({type: 'assistant_panel_opened'});
        expect(getUnreadCount(store.getState())).toBe(0);
    });
});

describe('the per-channel switch', () => {
    it('setChannelOn calls PUT /enabled and stores the server\'s answer', async () => {
        mockedClient.setAssistantChannelOn.mockResolvedValue({on: false});
        const store = makeTestStore();

        await setChannelOn(store, channelId, false);

        expect(mockedClient.setAssistantChannelOn).toHaveBeenCalledWith(channelId, false);
        expect(getChannelFeed(store.getState(), channelId).on).toBe(false);
    });
});

describe('card buttons send the right payloads', () => {
    it('dismiss', async () => {
        mockedClient.dismissAssistantCard.mockResolvedValue(makeCard({status: 'dismissed'}));
        await dismissCard(makeTestStore(), channelId, 'card1');
        expect(mockedClient.dismissAssistantCard).toHaveBeenCalledWith(channelId, 'card1');
    });

    it('pin and unpin', async () => {
        mockedClient.pinAssistantCard.mockResolvedValue(makeCard({pinned: true}));
        await pinCard(makeTestStore(), channelId, 'card1', true);
        expect(mockedClient.pinAssistantCard).toHaveBeenCalledWith(channelId, 'card1', true);

        mockedClient.pinAssistantCard.mockResolvedValue(makeCard({pinned: false}));
        await pinCard(makeTestStore(), channelId, 'card1', false);
        expect(mockedClient.pinAssistantCard).toHaveBeenCalledWith(channelId, 'card1', false);
    });

    it('mute also adds the tool to the local muted-tools list', async () => {
        mockedClient.muteAssistantCard.mockResolvedValue(makeCard({status: 'dismissed'}));
        const store = makeTestStore();

        await muteCard(store, channelId, 'card1', 'mcp.grafana.query_prometheus');

        expect(mockedClient.muteAssistantCard).toHaveBeenCalledWith(channelId, 'card1');
        expect(getMutedTools(store.getState())).toEqual(['mcp.grafana.query_prometheus']);
    });

    it('claim', async () => {
        mockedClient.claimAssistantCard.mockResolvedValue(makeCard({kind: 'action'}));
        await claimCard(makeTestStore(), channelId, 'card1');
        expect(mockedClient.claimAssistantCard).toHaveBeenCalledWith(channelId, 'card1');
    });

    it('run', async () => {
        mockedClient.runAssistantCard.mockResolvedValue({card: makeCard({kind: 'action'}), executed: false});
        await runCard(makeTestStore(), channelId, 'card1');
        expect(mockedClient.runAssistantCard).toHaveBeenCalledWith(channelId, 'card1');
    });

    it('post applies the posted status locally once the server accepts it', async () => {
        mockedClient.postAssistantCard.mockResolvedValue({id: 'post1'});
        const store = makeTestStore();
        handleCardAdded(store, {event: 'x', data: {channel_id: channelId, card: makeCard()}, broadcast: {channel_id: channelId, team_id: 't', user_id: 'alice'}});

        await postCard(store, channelId, 'card1');

        expect(mockedClient.postAssistantCard).toHaveBeenCalledWith(channelId, 'card1');
        expect(getCards(store.getState(), channelId)[0].status).toBe('posted');
    });
});

describe('muted tools', () => {
    it('loads the muted tools list', async () => {
        mockedClient.getAssistantMutedTools.mockResolvedValue({tools: ['a.b']});
        const store = makeTestStore();

        await loadMutedTools(store);

        expect(getMutedTools(store.getState())).toEqual(['a.b']);
    });

    it('unmuteTool removes just that tool and sends the rest', async () => {
        mockedClient.setAssistantMutedTools.mockResolvedValue({tools: ['a.b']});
        const store = makeTestStore();

        await unmuteTool(store, ['a.b', 'c.d'], 'c.d');

        expect(mockedClient.setAssistantMutedTools).toHaveBeenCalledWith(['a.b']);
        expect(getMutedTools(store.getState())).toEqual(['a.b']);
    });
});
