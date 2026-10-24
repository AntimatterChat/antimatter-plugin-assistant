// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import {render, screen} from '@testing-library/react';
import React from 'react';
import {IntlProvider} from 'react-intl';

import type {MessageAttachment} from '../types/message_attachments';

import AttachmentCard from './attachment_card';

function renderAttachment(attachment: MessageAttachment) {
    return render(
        <IntlProvider
            locale='en'
            onError={() => null}
        >
            <AttachmentCard attachment={attachment}/>
        </IntlProvider>,
    );
}

describe('AttachmentCard', () => {
    it('shows the author, title, text, fields and footer', () => {
        renderAttachment({
            author_name: 'Grafana',
            title: 'CPU on www-1 (last hour)',
            text: '4.1% now · peak 5.8% · average 3.8%',
            fields: [{title: 'Now', value: '4.1%', short: true}, {title: 'Peak', value: '5.8%', short: true}],
            footer: 'Grafana · Node overview',
        });

        expect(screen.getByText('Grafana')).toBeInTheDocument();
        expect(screen.getByText('CPU on www-1 (last hour)')).toBeInTheDocument();
        expect(screen.getByText(/4.1% now/)).toBeInTheDocument();
        expect(screen.getByText('Now')).toBeInTheDocument();
        expect(screen.getByText('4.1%')).toBeInTheDocument();
        expect(screen.getByText('Grafana · Node overview')).toBeInTheDocument();
    });

    it('makes the title a link when title_link is http(s)', () => {
        renderAttachment({title: 'Open in Grafana', title_link: 'https://grafana.example/d/node-www'});

        const link = screen.getByRole('link', {name: 'Open in Grafana'});
        expect(link).toHaveAttribute('href', 'https://grafana.example/d/node-www');
        expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    });

    it('keeps the title plain text when title_link is not http(s)', () => {
        renderAttachment({title: 'Open in Grafana', title_link: 'ftp://evil.example/x'});

        expect(screen.getByText('Open in Grafana')).toBeInTheDocument();
        expect(screen.queryByRole('link')).toBeNull();
    });

    it('draws a chart with a dashed threshold line when the attachment has one', () => {
        const {container} = renderAttachment({
            title: 'CPU',
            chart: {values: [3.1, 3.4, 4.0, 4.1], threshold: 80, label: 'CPU %'},
        });

        const svg = container.querySelector('svg');
        expect(svg).not.toBeNull();
        expect(svg?.getAttribute('aria-label')).toBe('CPU %');
        expect(container.querySelector('polyline')).not.toBeNull();
        expect(container.querySelector('line')).not.toBeNull();
    });

    it('draws no threshold line when the chart has none', () => {
        const {container} = renderAttachment({title: 'CPU', chart: {values: [1, 2, 3]}});

        expect(container.querySelector('polyline')).not.toBeNull();
        expect(container.querySelector('line')).toBeNull();
    });

    it('draws no chart at all for fewer than two values', () => {
        const {container} = renderAttachment({title: 'CPU', chart: {values: [1]}});
        expect(container.querySelector('svg')).toBeNull();
    });

    it('does not draw the author icon when its src is not http(s)', () => {
        const {container} = renderAttachment({author_name: 'Grafana', author_icon: 'ftp://evil.example/icon.png'});
        expect(container.querySelector('img')).toBeNull();
    });
});
