// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

// The assistant's own routes (server/channels/app/ASSISTANT_API.md), under /api/v4/assistant: core server routes,
// not a plugin's own (unlike the pattern other apps' client.ts files use for their own /plugins/<id>/... routes).
// Every route is the caller's own: their feed in a channel, their presence, their cards and muted tools.

import {Client4} from 'mattermost-redux/client';

import type {AssistantCard, AssistantFeed, AssistantMutedTools, AssistantPresence, AssistantRunResult} from './types/assistant';

export class ClientError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

function assistantRoute(path: string) {
    return `${window.basename || ''}/api/v4/assistant${path}`;
}

function channelRoute(channelId: string, path = '') {
    return assistantRoute(`/channels/${encodeURIComponent(channelId)}${path}`);
}

function cardRoute(channelId: string, cardId: string, path: string) {
    return channelRoute(channelId, `/cards/${encodeURIComponent(cardId)}${path}`);
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
    const options: {method: string; body?: string} = {method};
    if (typeof body !== 'undefined') {
        options.body = JSON.stringify(body);
    }
    const response = await fetch(url, Client4.getOptions(options));

    if (!response.ok) {
        let message = response.statusText;
        try {
            const data = await response.json();
            message = data.error || message;
        } catch {
            // Not JSON.
        }
        throw new ClientError(message, response.status);
    }

    if (response.status === 204) {
        return undefined as T;
    }
    return response.json();
}

export function getAssistantFeed(channelId: string) {
    return request<AssistantFeed>('GET', channelRoute(channelId, '/feed'));
}

export function setAssistantPresence(channelId: string, open: boolean) {
    return request<AssistantPresence>('POST', channelRoute(channelId, '/presence'), {open});
}

export function setAssistantChannelOn(channelId: string, on: boolean) {
    return request<{on: boolean}>('PUT', channelRoute(channelId, '/enabled'), {on});
}

export function dismissAssistantCard(channelId: string, cardId: string) {
    return request<AssistantCard>('POST', cardRoute(channelId, cardId, '/dismiss'));
}

export function pinAssistantCard(channelId: string, cardId: string, pinned: boolean) {
    return request<AssistantCard>('POST', cardRoute(channelId, cardId, '/pin'), {pinned});
}

export function muteAssistantCard(channelId: string, cardId: string) {
    return request<AssistantCard>('POST', cardRoute(channelId, cardId, '/mute'));
}

export function claimAssistantCard(channelId: string, cardId: string) {
    return request<AssistantCard>('POST', cardRoute(channelId, cardId, '/claim'));
}

export function runAssistantCard(channelId: string, cardId: string) {
    return request<AssistantRunResult>('POST', cardRoute(channelId, cardId, '/run'));
}

export function postAssistantCard(channelId: string, cardId: string) {
    return request<{id: string}>('POST', cardRoute(channelId, cardId, '/post'));
}

export function getAssistantMutedTools() {
    return request<AssistantMutedTools>('GET', assistantRoute('/muted_tools'));
}

export function setAssistantMutedTools(tools: string[]) {
    return request<AssistantMutedTools>('PUT', assistantRoute('/muted_tools'), {tools});
}
