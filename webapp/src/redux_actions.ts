// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

// Action objects for the host's own store, dispatched with its plain action type names (Antimatter's and upstream
// Mattermost's, both classic and Fusion: a long-standing, stable convention other apps in this codebase rely on
// too, e.g. the AI chat app's selectRegularPost). Not registry hooks: there's no Antimatter webapp API for "go to
// this message" or "highlight this message", so this dispatches the same actions the host's own post list does.

import type {AnyAction} from 'redux';

// highlightPost highlights a message in the channel being viewed, the way jumping to a search result does.
// clearHighlight removes it again (e.g. when the pointer leaves).
export function highlightPost(postId: string): AnyAction {
    return {type: 'HIGHLIGHT_REPLY', postId};
}

export function clearHighlight(): AnyAction {
    return {type: 'CLEAR_HIGHLIGHT_REPLY'};
}

// selectPost opens a message (scrolling to it, and its thread if it has one).
export function selectPost(postId: string, channelId: string): AnyAction {
    return {type: 'SELECT_POST', postId, channelId, timestamp: Date.now()};
}
