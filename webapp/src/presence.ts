// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

// The panel's presence: "assistant, open: true" when it starts showing a channel, again every heartbeat_seconds
// while it stays open, and "open: false" on close or channel switch (server/channels/app/ASSISTANT_API.md). Kept
// apart from the React component so the start/stop behaviour is easy to test on its own.

import * as client from './client';
import type {AssistantPresence} from './types/assistant';

export type StopPresence = () => void;

// startAssistantPresence opens presence for a channel and keeps sending it every heartbeat_seconds (as the server's
// first answer says) until the returned function is called, which sends "open: false" once. Calling the returned
// function more than once does nothing after the first time.
export function startAssistantPresence(
    channelId: string,
    onPresence: (presence: AssistantPresence) => void = () => { /* no-op */ },
    onError: (err: unknown) => void = () => { /* no-op */ },
): StopPresence {
    let stopped = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const clearTimer = () => {
        if (timer !== null) {
            clearInterval(timer);
            timer = null;
        }
    };

    const open = () => {
        client.setAssistantPresence(channelId, true).then((presence) => {
            if (stopped) {
                return;
            }
            onPresence(presence);
            clearTimer();
            timer = setInterval(open, Math.max(1, presence.heartbeat_seconds) * 1000);
        }).catch(onError);
    };

    open();

    return () => {
        if (stopped) {
            return;
        }
        stopped = true;
        clearTimer();
        client.setAssistantPresence(channelId, false).catch(onError);
    };
}
