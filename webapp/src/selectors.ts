// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import type {GlobalState} from '@mattermost/types/store';

import manifest from './manifest';
import type {AssistantPluginState, ChannelFeedState} from './reducer';
import type {AssistantCard} from './types/assistant';

const emptyState: AssistantPluginState = {
    channels: {},
    mutedTools: [],
    mutedToolsLoaded: false,
    unreadCount: 0,
    serverOff: false,
};

const emptyChannel: ChannelFeedState = {
    enabled: true,
    on: true,
    engine: 'rules',
    following: false,
    loaded: false,
    cardsById: {},
    order: [],
};

export function getPluginState(state: GlobalState): AssistantPluginState {
    return (state as unknown as Record<string, AssistantPluginState | undefined>)[`plugins-${manifest.id}`] || emptyState;
}

export function getChannelFeed(state: GlobalState, channelId: string): ChannelFeedState {
    return getPluginState(state).channels[channelId] || emptyChannel;
}

export function getCards(state: GlobalState, channelId: string): AssistantCard[] {
    const channel = getChannelFeed(state, channelId);
    return channel.order.map((id) => channel.cardsById[id]).filter(Boolean);
}

export function getCard(state: GlobalState, channelId: string, cardId: string): AssistantCard | undefined {
    return getChannelFeed(state, channelId).cardsById[cardId];
}

export function getMutedTools(state: GlobalState): string[] {
    return getPluginState(state).mutedTools;
}

export function isToolMuted(state: GlobalState, tool: string): boolean {
    return getMutedTools(state).includes(tool);
}

export function getUnreadCount(state: GlobalState): number {
    return getPluginState(state).unreadCount;
}

// isAssistantKnownOff tells whether the last feed loaded (for whichever channel the panel last showed) said the
// assistant isn't enabled there: the server's switch is off, the community turned it off, or the channel is
// archived. There's no separate server config exposed to the client for this (see the app's README), so the rail
// icon and the panel both read it from the feed response of the channel being viewed.
export function isAssistantKnownOff(state: GlobalState): boolean {
    return getPluginState(state).serverOff;
}
