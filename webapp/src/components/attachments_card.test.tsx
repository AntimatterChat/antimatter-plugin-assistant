// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import {render, screen} from '@testing-library/react';
import React from 'react';
import {IntlProvider} from 'react-intl';

import type {MessageAttachment} from '../types/message_attachments';

import AttachmentsCard from './attachments_card';

type HostWindow = Window & {WebappUtils?: {cards?: Record<string, unknown>}};

function renderCard(attachments: MessageAttachment[], summary: string) {
    return render(
        <IntlProvider
            locale='en'
            onError={() => null}
        >
            <AttachmentsCard
                attachments={attachments}
                summary={summary}
            />
        </IntlProvider>,
    );
}

describe('AttachmentsCard', () => {
    afterEach(() => {
        delete (window as HostWindow).WebappUtils;
    });

    it('labels the group with the result\'s summary, for screen readers', () => {
        renderCard([{title: 'CPU'}], 'CPU on www-1: 4% now');
        expect(screen.getByRole('group', {name: 'CPU on www-1: 4% now'})).toBeInTheDocument();
    });

    it('falls back to its own rendering when the host publishes no attachment renderer', () => {
        renderCard([{title: 'CPU on www-1'}], 'CPU on www-1: 4% now');
        expect(screen.getByText('CPU on www-1')).toBeInTheDocument();
    });

    it('uses the host\'s own renderer when one is published on window.WebappUtils.cards', () => {
        const HostRenderer = jest.fn((props: {attachments: MessageAttachment[]; summary: string}) => <div>{props.summary}</div>);
        (window as HostWindow).WebappUtils = {cards: {MessageAttachmentCard: HostRenderer}};

        renderCard([{title: 'CPU on www-1'}], 'CPU on www-1: 4% now');

        expect(screen.getByText('CPU on www-1: 4% now')).toBeInTheDocument();
        expect(screen.queryByText('CPU on www-1')).toBeNull();
        expect(HostRenderer).toHaveBeenCalled();
        expect(HostRenderer.mock.calls[0][0]).toEqual({
            attachments: [{title: 'CPU on www-1'}],
            summary: 'CPU on www-1: 4% now',
        });
    });
});
