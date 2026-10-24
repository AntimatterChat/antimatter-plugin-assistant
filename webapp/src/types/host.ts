// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import type React from 'react';
import type {Reducer, Store} from 'redux';

import type {Channel} from '@mattermost/types/channels';
import type {GlobalState} from '@mattermost/types/store';

import type {WebUI} from '../web_ui';

export type WebSocketMessage<T = Record<string, unknown>> = {
    event: string;
    data: T;
    broadcast: {channel_id: string; team_id: string; user_id: string};
};

export type PluginStore = Store<GlobalState>;

export type RightHandSidebarComponentHandle = {
    id: string;
    showRHSPlugin: {type: string};
    hideRHSPlugin: {type: string};
    toggleRHSPlugin: {type: string};
};

// The subset of the host's plugin registry this app uses: a right-hand side panel and the app rail icon that opens
// it (registerChannelHeaderButtonAction, which Fusion also draws in its app rail), plus the websocket events and
// translations every app needs. The hooks older hosts may lack are optional.
export interface PluginRegistry {
    registerTranslations(getTranslations: (locale: string) => Record<string, string>): void;
    registerReducer(reducer: Reducer): void;
    registerWebSocketEventHandler(event: string, handler: (msg: WebSocketMessage) => void): void;
    registerReconnectHandler(handler: () => void): void;
    registerChannelHeaderButtonAction(
        icon: React.ReactNode,
        action: (channel: Channel) => void,
        dropdownText: React.ReactNode,
        tooltipText: React.ReactNode,
    ): string;
    registerRightHandSidebarComponent(
        component: React.ComponentType,
        title: React.ReactNode,
    ): RightHandSidebarComponentHandle;

    // Removes an earlier registerChannelHeaderButtonAction (etc.) entry: used to hide the rail icon when the
    // assistant turns out to be off (the server, the community, or the channel), since that hook has no
    // shouldRender of its own.
    unregisterComponent?(componentId: string): void;
}

export type PluginClass = {
    initialize(registry: PluginRegistry, store: PluginStore): void | Promise<void>;
    uninitialize?(): void;
};

declare global {
    interface Window {
        registerPlugin(pluginId: string, plugin: PluginClass): void;
        basename?: string;

        // Set by the Antimatter web UIs before plugins load.
        antimatterWebUI?: WebUI;
    }
}
