// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import {useEffect} from 'react';
import {useDispatch} from 'react-redux';

import {followingSet, logError} from '../actions';
import {startAssistantPresence} from '../presence';

// useAssistantPresence starts the panel's presence for a channel while it stays open, and stops it (sending
// "open: false" once) when the channel changes or the panel closes. enabled lets the caller skip it entirely, e.g.
// while the assistant is off there.
export function useAssistantPresence(channelId: string, enabled: boolean): void {
    const dispatch = useDispatch();

    useEffect(() => {
        if (!enabled || !channelId) {
            return undefined;
        }
        const stop = startAssistantPresence(
            channelId,
            (presence) => dispatch(followingSet(channelId, presence.following)),
            (err) => logError('presence failed', err),
        );
        return stop;
    }, [channelId, enabled, dispatch]);
}
