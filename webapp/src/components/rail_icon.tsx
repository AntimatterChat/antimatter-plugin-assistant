// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import React from 'react';
import {useIntl} from 'react-intl';
import {useSelector} from 'react-redux';
import styled from 'styled-components';

import type {GlobalState} from '@mattermost/types/store';

import {getUnreadCount} from '../selectors';

import {messages} from './messages';
import {t} from './styles';

const Wrap = styled.span`
    position: relative;
    display: inline-grid;
    place-items: center;
    width: 18px;
    height: 18px;
`;

const Badge = styled.span`
    position: absolute;
    top: -6px;
    right: -8px;
    min-width: 15px;
    height: 15px;
    padding: 0 3px;
    border-radius: 999px;
    background: ${t.danger};
    color: var(--button-color, #fff);
    font: 700 10px/15px ${t.fontUI};
    text-align: center;
`;

// badgeText clamps a count to a short, readable badge ("9+" past 9): the assistant is meant to be quiet, so this
// should rarely show a large number, but a stuck client or a burst of cards shouldn't grow the icon.
export function badgeText(count: number): string {
    if (count <= 0) {
        return '';
    }
    return count > 9 ? '9+' : String(count);
}

// AssistantRailIcon is the app rail's icon (registered as a channel header button, which Fusion also draws in its
// app rail and panel header), with a small count of cards added since the panel was last opened. It never
// notifies, takes focus or plays a sound; the count is purely visual, from assistant_card_added events kept
// client-side (see reducer.ts's unreadCount).
//
// The mark is a concierge's service bell with a small sparkle ("ring and it's taken care of"), chosen by the owner
// over a butler figure and a bow tie. It is drawn in Fusion's own icon line style (see
// webapp/fusion/src/fusion/components/icon/icon_sprite.tsx: viewBox 0 0 24 24, round caps and joins, currentColor so
// it themes); the same shape is used for assets/icon.svg.
export default function AssistantRailIcon() {
    const {formatMessage} = useIntl();
    const count = useSelector((state: GlobalState) => getUnreadCount(state));
    const label = count > 0 ? formatMessage(messages.railLabel, {count}) : formatMessage(messages.appName);

    return (
        <Wrap
            role='img'
            aria-label={label}
        >
            <svg
                width='18'
                height='18'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth={1.8}
                strokeLinecap='round'
                strokeLinejoin='round'
                aria-hidden='true'
            >
                <path d='M4.5 17.5a7.5 7.5 0 0 1 15 0'/>
                <path d='M3 17.5h18M4.5 20.5h15'/>
                <path d='M12 10V8.3M10.4 8.3h3.2'/>
                <path d='M7.9 15.4a4.6 4.6 0 0 1 2.5-2.7'/>
                <path d='M19.2 3.2v2.6M17.9 4.5h2.6'/>
            </svg>
            {count > 0 && (
                <Badge aria-hidden='true'>{badgeText(count)}</Badge>
            )}
        </Wrap>
    );
}
