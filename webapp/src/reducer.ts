// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';

import {
    CARD_ADDED,
    CARD_UPDATED,
    CHANNEL_ON_SET,
    FEED_RECEIVED,
    FOLLOWING_SET,
    MUTED_TOOLS_RECEIVED,
    OFFER_UPDATED,
    PANEL_OPENED,
    TOOL_MUTED_LOCALLY,
} from './action_types';
import type {AssistantCard, AssistantEngine, AssistantFeed, AssistantOfferView} from './types/assistant';

export type ChannelFeedState = {
    enabled: boolean;
    on: boolean;
    engine: AssistantEngine;
    following: boolean;
    loaded: boolean;
    cardsById: Record<string, AssistantCard>;

    // Oldest first, newest last, like a chat. Pinned cards keep their place in that order; they're told apart
    // only by their pin mark (see styles.ts's PinMark), never by moving to the top.
    order: string[];
};

export type AssistantPluginState = {
    channels: Record<string, ChannelFeedState>;
    mutedTools: string[];
    mutedToolsLoaded: boolean;
    unreadCount: number;
    serverOff: boolean;
};

type Action = {type: string; data?: unknown};

const emptyChannel: ChannelFeedState = {
    enabled: true,
    on: true,
    engine: 'rules',
    following: false,
    loaded: false,
    cardsById: {},
    order: [],
};

// sortedOrder orders a channel's cards like a chat: oldest first, newest last. Pinned cards stay exactly where
// their create_at puts them (see ChannelFeedState.order above); nothing here reorders them to the top.
function sortedOrder(cardsById: Record<string, AssistantCard>): string[] {
    return Object.values(cardsById).
        filter((card) => card.status !== 'dismissed').
        sort((a, b) => a.create_at - b.create_at).
        map((card) => card.id);
}

function upsertCard(state: ChannelFeedState, card: AssistantCard): ChannelFeedState {
    const cardsById = {...state.cardsById, [card.id]: card};
    return {...state, cardsById, order: sortedOrder(cardsById)};
}

function channelFromFeed(previous: ChannelFeedState | undefined, feed: AssistantFeed): ChannelFeedState {
    const cardsById = Object.fromEntries(feed.cards.map((card) => [card.id, card]));
    return {
        ...emptyChannel,
        ...previous,
        enabled: feed.enabled,
        on: feed.on,
        engine: feed.engine,
        loaded: true,
        cardsById,
        order: sortedOrder(cardsById),
    };
}

function channels(state: AssistantPluginState['channels'] = {}, action: Action): AssistantPluginState['channels'] {
    switch (action.type) {
    case FEED_RECEIVED: {
        const {channelId, feed} = action.data as {channelId: string; feed: AssistantFeed};
        return {...state, [channelId]: channelFromFeed(state[channelId], feed)};
    }
    case CARD_ADDED:
    case CARD_UPDATED: {
        const {channelId, card} = action.data as {channelId: string; card: AssistantCard};
        const current = state[channelId] || emptyChannel;
        return {...state, [channelId]: upsertCard(current, card)};
    }
    case OFFER_UPDATED: {
        const {channelId, cardId, offer} = action.data as {channelId: string; cardId: string; offer: AssistantOfferView};
        const current = state[channelId];
        const card = current?.cardsById[cardId];
        if (!current || !card) {
            return state;
        }
        return {...state, [channelId]: upsertCard(current, {...card, offer, offer_id: offer.id})};
    }
    case CHANNEL_ON_SET: {
        const {channelId, on} = action.data as {channelId: string; on: boolean};
        const current = state[channelId] || emptyChannel;
        return {...state, [channelId]: {...current, on}};
    }
    case FOLLOWING_SET: {
        const {channelId, following} = action.data as {channelId: string; following: boolean};
        const current = state[channelId] || emptyChannel;
        return {...state, [channelId]: {...current, following}};
    }
    default:
        return state;
    }
}

function mutedTools(state: string[] = [], action: Action): string[] {
    switch (action.type) {
    case MUTED_TOOLS_RECEIVED:
        return (action.data as {tools: string[]}).tools;
    case TOOL_MUTED_LOCALLY: {
        const tool = action.data as string;
        return state.includes(tool) ? state : [...state, tool];
    }
    default:
        return state;
    }
}

function mutedToolsLoaded(state = false, action: Action): boolean {
    return action.type === MUTED_TOOLS_RECEIVED ? true : state;
}

function unreadCount(state = 0, action: Action): number {
    switch (action.type) {
    case CARD_ADDED:
        return state + 1;
    case PANEL_OPENED:
        return 0;
    default:
        return state;
    }
}

function serverOff(state = false, action: Action): boolean {
    if (action.type === FEED_RECEIVED) {
        const {feed} = action.data as {channelId: string; feed: AssistantFeed};
        return !feed.enabled;
    }
    return state;
}

export default combineReducers({
    channels,
    mutedTools,
    mutedToolsLoaded,
    unreadCount,
    serverOff,
});
