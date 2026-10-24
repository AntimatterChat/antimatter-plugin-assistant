// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import React from 'react';
import {createIntl} from 'react-intl';
import type {IntlShape} from 'react-intl';

import {handleCardAdded, handleCardUpdated, handleOfferUpdated} from './actions';
import AssistantPanel, {PanelTitle} from './components/assistant_panel';
import {messages} from './components/messages';
import AssistantRailIcon from './components/rail_icon';
import manifest from './manifest';
import reducer from './reducer';
import {isAssistantKnownOff} from './selectors';
import {registerTranslations, translationsFor} from './translations';
import type {AssistantCardEventData, AssistantOfferEventData} from './types/assistant';
import type {PluginClass, PluginRegistry, PluginStore, WebSocketMessage} from './types/host';

function getStaticIntl(store: PluginStore): IntlShape {
    const state = store.getState();
    const locale = (state as unknown as {entities?: {i18n?: {locale?: string}}}).entities?.i18n?.locale ?? 'en';
    return createIntl({
        locale,
        messages: translationsFor(locale),
        defaultLocale: 'en',
    });
}

export default class Plugin implements PluginClass {
    private railIconId: string | null = null;

    public initialize(registry: PluginRegistry, store: PluginStore) {
        registerTranslations(registry);
        registry.registerReducer(reducer);

        registry.registerWebSocketEventHandler(
            'assistant_card_added',
            (msg) => handleCardAdded(store, msg as WebSocketMessage<AssistantCardEventData>),
        );
        registry.registerWebSocketEventHandler(
            'assistant_card_updated',
            (msg) => handleCardUpdated(store, msg as WebSocketMessage<AssistantCardEventData>),
        );
        registry.registerWebSocketEventHandler(
            'assistant_offer_updated',
            (msg) => handleOfferUpdated(store, msg as WebSocketMessage<AssistantOfferEventData>),
        );

        // The panel for the conversation being viewed: no page of its own, just the rail icon and its side panel.
        const rhs = registry.registerRightHandSidebarComponent(AssistantPanel, <PanelTitle/>);

        const intl = getStaticIntl(store);
        const label = intl.formatMessage(messages.appName);
        this.registerRailIcon(registry, rhs.toggleRHSPlugin, store, label);

        // The rail icon hides once a loaded feed says the assistant is off here (the server, the community, or
        // the channel): registerChannelHeaderButtonAction has no shouldRender of its own, so this toggles the
        // registration itself as that becomes known. Starts registered: nothing is known yet.
        let wasOff = false;
        store.subscribe(() => {
            const off = isAssistantKnownOff(store.getState());
            if (off === wasOff) {
                return;
            }
            wasOff = off;
            if (off) {
                if (this.railIconId && registry.unregisterComponent) {
                    registry.unregisterComponent(this.railIconId);
                    this.railIconId = null;
                }
            } else if (!this.railIconId) {
                this.registerRailIcon(registry, rhs.toggleRHSPlugin, store, label);
            }
        });
    }

    private registerRailIcon(registry: PluginRegistry, toggle: {type: string}, store: PluginStore, label: string) {
        this.railIconId = registry.registerChannelHeaderButtonAction(
            <AssistantRailIcon/>,
            () => store.dispatch(toggle),
            label,
            label,
        );
    }
}

window.registerPlugin(manifest.id, new Plugin());
