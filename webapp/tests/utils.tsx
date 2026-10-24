// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import {render} from '@testing-library/react';
import React from 'react';
import {IntlProvider} from 'react-intl';
import {Provider} from 'react-redux';
import {createStore, type AnyAction} from 'redux';

import type {GlobalState} from '@mattermost/types/store';

import manifest from '../src/manifest';
import reducer, {type AssistantPluginState} from '../src/reducer';
import type {PluginStore} from '../src/types/host';

export const currentUserId = 'alice';
export const currentChannelId = 'channel1';

type TestStateOptions = {
    plugin?: Partial<AssistantPluginState>;
    users?: Array<{id: string; username: string}>;
    channelId?: string;
};

// makeState returns a minimal host state with this plugin's state.
export function makeState({plugin = {}, users = [], channelId = currentChannelId}: TestStateOptions = {}): GlobalState {
    const pluginState: AssistantPluginState = {
        ...reducer(undefined, {type: '@@INIT'}),
        ...plugin,
    };
    return {
        entities: {
            general: {config: {}, license: {}},
            preferences: {myPreferences: {}},
            users: {
                currentUserId,
                profiles: {
                    [currentUserId]: {id: currentUserId, username: currentUserId, roles: 'system_user'},
                    ...Object.fromEntries(users.map((u) => [u.id, {last_picture_update: 0, ...u}])),
                },
            },
            channels: {
                currentChannelId: channelId,
                channels: {[channelId]: {id: channelId, team_id: 'team1', type: 'O'}},
            },
            teams: {currentTeamId: 'team1', teams: {}},
        },
        [`plugins-${manifest.id}`]: pluginState,
    } as unknown as GlobalState;
}

// makeStore returns a store whose actions go through this plugin's reducer.
export function makeStore(initial: GlobalState): PluginStore {
    const pluginKey = `plugins-${manifest.id}`;
    return createStore((state: GlobalState | undefined, action: AnyAction) => {
        const current = state || initial;
        const pluginState = (current as unknown as Record<string, AssistantPluginState>)[pluginKey];
        const next = reducer(pluginState, action);
        if (next === pluginState) {
            return current;
        }
        return {...current, [pluginKey]: next} as GlobalState;
    }, initial) as unknown as PluginStore;
}

export function renderWithStore(ui: React.ReactElement, store: PluginStore) {
    return render(
        <Provider store={store}>
            <IntlProvider
                locale='en'
                onError={() => null}
            >
                {ui}
            </IntlProvider>
        </Provider>,
    );
}
