// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import React, {useEffect, useRef, useState} from 'react';
import {useIntl} from 'react-intl';
import {useDispatch, useSelector, useStore} from 'react-redux';

import type {GlobalState} from '@mattermost/types/store';

import {getCurrentChannelId} from 'mattermost-redux/selectors/entities/channels';

import {loadFeed, panelOpened, type Store} from '../actions';
import {useAssistantPresence} from '../hooks/use_presence';
import {getCards, getChannelFeed} from '../selectors';

import Card from './card';
import {MutedTools, OnSwitch} from './controls';
import {messages} from './messages';
import {Body, Center, Grow, NewCardChip, NewCardChipWrap, Panel, PanelHeader, Text} from './styles';

// A reader within this many pixels of the bottom counts as "at the bottom": new cards stick there instead of
// showing the jump chip.
const BOTTOM_THRESHOLD = 24;

function isNearBottom(el: HTMLDivElement): boolean {
    return el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_THRESHOLD;
}

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

    const bodyRef = useRef<HTMLDivElement>(null);
    const wasAtBottomRef = useRef(true);
    const openedChannelRef = useRef('');
    const cardCountRef = useRef(0);
    const [newCardBelow, setNewCardBelow] = useState(false);

    useEffect(() => {
        dispatch(panelOpened());
    }, [dispatch]);

    useEffect(() => {
        if (channelId) {
            loadFeed(store, channelId);
        }

        // Reloaded on every channel switch; loadFeed is stable across renders.
    }, [channelId]);

    useAssistantPresence(channelId, channel.enabled);

    // Scroll to the bottom once this channel's feed has loaded, whether that's on this panel's first mount or
    // after switching channels; resets the "is the reader at the bottom" tracking fresh for it.
    useEffect(() => {
        if (!channel.loaded || openedChannelRef.current === channelId) {
            return;
        }
        openedChannelRef.current = channelId;
        cardCountRef.current = cards.length;
        wasAtBottomRef.current = true;
        setNewCardBelow(false);
        const el = bodyRef.current;
        if (el) {
            el.scrollTop = el.scrollHeight;
        }
    }, [channelId, channel.loaded, cards.length]);

    // A card appended to an already-open feed: stick to the bottom if the reader was already there, otherwise
    // let them know with the jump chip instead of yanking their scroll position.
    useEffect(() => {
        if (openedChannelRef.current !== channelId) {
            return;
        }
        const previousCount = cardCountRef.current;
        cardCountRef.current = cards.length;
        if (cards.length <= previousCount) {
            return;
        }
        if (wasAtBottomRef.current) {
            const el = bodyRef.current;
            if (el) {
                el.scrollTop = el.scrollHeight;
            }
        } else {
            setNewCardBelow(true);
        }
    }, [channelId, cards.length]);

    const onBodyScroll = () => {
        const el = bodyRef.current;
        if (!el) {
            return;
        }
        wasAtBottomRef.current = isNearBottom(el);
        if (wasAtBottomRef.current) {
            setNewCardBelow(false);
        }
    };

    const jumpToNewCard = () => {
        const el = bodyRef.current;
        if (el) {
            el.scrollTop = el.scrollHeight;
        }
        wasAtBottomRef.current = true;
        setNewCardBelow(false);
    };

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
            <Body
                ref={bodyRef}
                role='log'
                aria-label={formatMessage(messages.feed)}
                onScroll={onBodyScroll}
            >
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
            {newCardBelow && (
                <NewCardChipWrap>
                    <NewCardChip
                        type='button'
                        onClick={jumpToNewCard}
                    >
                        {formatMessage(messages.newCard)}
                    </NewCardChip>
                </NewCardChipWrap>
            )}
        </Panel>
    );
}

// PanelTitle is the side panel's title: the app's name, without a picture (Fusion draws the app's own icon beside
// it from the app rail entry).
export function PanelTitle() {
    const {formatMessage} = useIntl();
    return <>{formatMessage(messages.appName)}</>;
}
