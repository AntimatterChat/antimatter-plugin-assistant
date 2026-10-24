// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import type {AnyAction} from 'redux';

import type {GlobalState} from '@mattermost/types/store';

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
import * as client from './client';
import {getCard} from './selectors';
import type {AssistantCardEventData, AssistantOfferEventData} from './types/assistant';
import type {WebSocketMessage} from './types/host';

export type GetState = () => GlobalState;
export type Dispatch = (action: AnyAction) => unknown;
export type Store = {dispatch: Dispatch; getState: GetState};

export function logError(message: string, err: unknown) {
    // eslint-disable-next-line no-console
    console.error(`[assistant] ${message}`, err);
}

export function panelOpened(): AnyAction {
    return {type: PANEL_OPENED};
}

export function followingSet(channelId: string, following: boolean): AnyAction {
    return {type: FOLLOWING_SET, data: {channelId, following}};
}

// loadFeed fetches a channel's feed: the person's cards there, pinned first then newest.
export async function loadFeed(store: Store, channelId: string): Promise<void> {
    try {
        const feed = await client.getAssistantFeed(channelId);
        store.dispatch({type: FEED_RECEIVED, data: {channelId, feed}});
    } catch (err) {
        logError('failed to load the assistant feed', err);
    }
}

export async function setChannelOn(store: Store, channelId: string, on: boolean): Promise<void> {
    try {
        const result = await client.setAssistantChannelOn(channelId, on);
        store.dispatch({type: CHANNEL_ON_SET, data: {channelId, on: result.on}});
    } catch (err) {
        logError('failed to change the assistant switch', err);
    }
}

export async function dismissCard(store: Store, channelId: string, cardId: string): Promise<void> {
    try {
        const card = await client.dismissAssistantCard(channelId, cardId);
        store.dispatch({type: CARD_UPDATED, data: {channelId, card}});
    } catch (err) {
        logError('failed to dismiss a card', err);
    }
}

export async function pinCard(store: Store, channelId: string, cardId: string, pinned: boolean): Promise<void> {
    try {
        const card = await client.pinAssistantCard(channelId, cardId, pinned);
        store.dispatch({type: CARD_UPDATED, data: {channelId, card}});
    } catch (err) {
        logError('failed to pin a card', err);
    }
}

// muteCard mutes the card's tool for the person everywhere, and dismisses the card: the server does both; this
// also keeps the muted-tools list (read by the controls) in step without a second fetch.
export async function muteCard(store: Store, channelId: string, cardId: string, tool: string): Promise<void> {
    try {
        const card = await client.muteAssistantCard(channelId, cardId);
        store.dispatch({type: CARD_UPDATED, data: {channelId, card}});
        store.dispatch({type: TOOL_MUTED_LOCALLY, data: tool});
    } catch (err) {
        logError('failed to mute a card\'s tool', err);
    }
}

export async function claimCard(store: Store, channelId: string, cardId: string): Promise<void> {
    try {
        const card = await client.claimAssistantCard(channelId, cardId);
        store.dispatch({type: CARD_UPDATED, data: {channelId, card}});
    } catch (err) {
        logError('failed to claim an action', err);
    }
}

export async function runCard(store: Store, channelId: string, cardId: string): Promise<void> {
    try {
        const result = await client.runAssistantCard(channelId, cardId);
        store.dispatch({type: CARD_UPDATED, data: {channelId, card: result.card}});
    } catch (err) {
        logError('failed to run an action', err);
    }
}

// postCard posts an insight's content to its channel as the person. The card's status moves to "posted" once the
// server's own assistant_card_updated event arrives; this also applies it locally so the button doesn't wait on it.
export async function postCard(store: Store, channelId: string, cardId: string): Promise<void> {
    try {
        await client.postAssistantCard(channelId, cardId);
        const card = getCard(store.getState(), channelId, cardId);
        if (card) {
            store.dispatch({type: CARD_UPDATED, data: {channelId, card: {...card, status: 'posted'}}});
        }
    } catch (err) {
        logError('failed to post a card to the channel', err);
        throw err;
    }
}

export async function loadMutedTools(store: Store): Promise<void> {
    try {
        const result = await client.getAssistantMutedTools();
        store.dispatch({type: MUTED_TOOLS_RECEIVED, data: result});
    } catch (err) {
        logError('failed to load the muted tools', err);
    }
}

export async function unmuteTool(store: Store, tools: string[], tool: string): Promise<void> {
    try {
        const result = await client.setAssistantMutedTools(tools.filter((t) => t !== tool));
        store.dispatch({type: MUTED_TOOLS_RECEIVED, data: result});
    } catch (err) {
        logError('failed to unmute a tool', err);
    }
}

// handleCardAdded keeps a person's open panels and rail icon current with a card freshly in their feed.
export function handleCardAdded(store: Store, msg: WebSocketMessage<AssistantCardEventData>): void {
    store.dispatch({type: CARD_ADDED, data: {channelId: msg.data.channel_id, card: msg.data.card}});
}

// handleCardUpdated applies a dismiss, pin, unpin or post made from any of the person's other clients.
export function handleCardUpdated(store: Store, msg: WebSocketMessage<AssistantCardEventData>): void {
    store.dispatch({type: CARD_UPDATED, data: {channelId: msg.data.channel_id, card: msg.data.card}});
}

// handleOfferUpdated keeps an action's offer current for everyone who has its card.
export function handleOfferUpdated(store: Store, msg: WebSocketMessage<AssistantOfferEventData>): void {
    store.dispatch({
        type: OFFER_UPDATED,
        data: {channelId: msg.data.channel_id, cardId: msg.data.card_id, offer: msg.data.offer},
    });
}
