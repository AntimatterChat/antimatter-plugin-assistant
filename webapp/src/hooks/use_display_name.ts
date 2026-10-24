// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';

import type {GlobalState} from '@mattermost/types/store';

import {UserTypes} from 'mattermost-redux/action_types';
import {Client4} from 'mattermost-redux/client';
import {getTeammateNameDisplaySetting} from 'mattermost-redux/selectors/entities/preferences';
import {displayUsername} from 'mattermost-redux/utils/user_utils';

import {logError} from '../actions';

const loading = new Set<string>();

// useDisplayName resolves a user ID (an action's holder) to a display name, the way other apps show names
// (e.g. the Polls app's voters), fetching the profile once if the host hasn't got it yet. Returns '' until known.
export function useDisplayName(userId: string): string {
    const dispatch = useDispatch();
    const profile = useSelector((state: GlobalState) => state.entities.users.profiles[userId]);
    const nameDisplay = useSelector(getTeammateNameDisplaySetting);

    useEffect(() => {
        if (!userId || profile || loading.has(userId)) {
            return;
        }
        loading.add(userId);
        Client4.getProfilesByIds([userId]).then((users) => {
            dispatch({type: UserTypes.RECEIVED_PROFILES_LIST, data: users});
        }).catch((err) => {
            logError('failed to load a user profile', err);
        }).finally(() => {
            loading.delete(userId);
        });
    }, [userId, profile, dispatch]);

    return profile ? displayUsername(profile, nameDisplay) : '';
}
