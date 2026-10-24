// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import React, {useEffect} from 'react';
import {useIntl} from 'react-intl';
import {useDispatch, useSelector, useStore} from 'react-redux';

import type {GlobalState} from '@mattermost/types/store';

import {getCurrentChannelId} from 'mattermost-redux/selectors/entities/channels';

import type {Store} from '../actions';
import {loadFeed, panelOpened} from '../actions';
import {useAssistantPresence} from '../hooks/use_presence';
import {getCards, getChannelFeed} from '../selectors';

import Card from './card';
import {MutedTools, OnSwitch} from './controls';
import {messages} from './messages';
import {Body, Center, Grow, Panel, PanelHeader, Text} from './styles';

// AssistantPanel is the assistant's side panel: the feed of cards for the channel being viewed, the per-channel
// switch, and the muted tools. It's the only entry point into the assistant besides its rail icon; nothing else in
// Fusion prompts for it.
export default function AssistantPanel() {
    const {formatMessage} = useIntl();
    const dispatch = useDispatch();
    const store = useStore() as unknown as Store;
    const channelId = useSelector((state: GlobalState) => getCurrentChannelId(state));
    const channel = useSelector((state: GlobalState) => getChannelFeed(state, channelId));
    const cards = useSelector((state: GlobalState) => getCards(state, channelId));

    useEffect(() => {
        dispatch(panelOpened());
    }, [dispatch]);

    useEffect(() => {
        if (channelId) {
            loadFeed(store, channelId);
        }

        // Reloaded on every channel switch; loadFeed is stable across renders.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [channelId]);

    useAssistantPresence(channelId, channel.enabled);

    if (!channel.loaded) {
        return (
            <Panel>
                <Center>
                    <Text>{formatMessage(messages.loading)}</Text>
                </Center>
            </Panel>
        );
    }

    if (!channel.enabled) {
        return (
            <Panel>
                <Center>
                    <Text>{formatMessage(messages.off)}</Text>
                </Center>
            </Panel>
        );
    }

    return (
        <Panel>
            <PanelHeader>
                <Grow>
                    <OnSwitch
                        channelId={channelId}
                        on={channel.on}
                        store={store}
                    />
                </Grow>
            </PanelHeader>
            <Body>
                {channel.on && cards.length === 0 && (
                    <Center>
                        <Text>{formatMessage(messages.emptyState)}</Text>
                    </Center>
                )}
                {channel.on && cards.map((card) => (
                    <Card
                        key={card.id}
                        card={card}
                        store={store}
                    />
                ))}
                <MutedTools store={store}/>
            </Body>
        </Panel>
    );
}

// PanelTitle is the side panel's title: the app's name, without a picture (Fusion draws the app's own icon beside
// it from the app rail entry).
export function PanelTitle() {
    const {formatMessage} = useIntl();
    return <>{formatMessage(messages.appName)}</>;
}
