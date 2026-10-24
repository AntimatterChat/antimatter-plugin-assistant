// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import React from 'react';
import {useIntl} from 'react-intl';

import {chartLine, cleanValues} from '../chart';
import type {MessageAttachment, MessageAttachmentField} from '../types/message_attachments';

import {messages} from './messages';
import {
    AttachmentAuthor,
    AttachmentBox,
    AttachmentChartSvg,
    AttachmentFoot,
    AttachmentIcon,
    AttachmentText,
    AttachmentTitleLink,
    AttachmentTitlePlain,
    FieldItem,
    FieldsGrid,
    t,
} from './styles';

const CHART_WIDTH = 280;
const CHART_HEIGHT = 56;

const NAMED_COLORS: Record<string, string> = {good: t.ok, warning: t.away, danger: t.danger};

// cardColor resolves an attachment's colour bar: a hex colour, one of the three named colours the server's apps
// use (good/warning/danger, as a bot post's attachments do), or the neutral line colour.
function cardColor(color?: string): string {
    if (color && (/^#[0-9a-f]{3,8}$/i).test(color)) {
        return color;
    }
    if (color && NAMED_COLORS[color]) {
        return NAMED_COLORS[color];
    }
    return t.line;
}

// isHttpUrl keeps a link (or an icon's src) to http(s), as ASSISTANT_DISPLAY.md requires: a tool's result is a
// link an app made up, not something the person typed, so it gets no benefit of the doubt.
function isHttpUrl(url?: string): boolean {
    return typeof url === 'string' && (/^https?:\/\//i).test(url);
}

function fieldValue(value: unknown): string {
    if (value === null || typeof value === 'undefined') {
        return '';
    }
    return String(value);
}

function Title({attachment}: {attachment: MessageAttachment}) {
    if (!attachment.title) {
        return null;
    }
    if (isHttpUrl(attachment.title_link)) {
        return (
            <AttachmentTitleLink
                href={attachment.title_link}
                target='_blank'
                rel='noopener noreferrer'
            >
                {attachment.title}
            </AttachmentTitleLink>
        );
    }
    return <AttachmentTitlePlain>{attachment.title}</AttachmentTitlePlain>;
}

function Author({attachment}: {attachment: MessageAttachment}) {
    if (!attachment.author_name && !attachment.author_icon) {
        return null;
    }
    return (
        <AttachmentAuthor>
            {isHttpUrl(attachment.author_icon) && (
                <AttachmentIcon
                    src={attachment.author_icon}
                    alt=''
                />
            )}
            {attachment.author_name}
        </AttachmentAuthor>
    );
}

function Fields({fields}: {fields: MessageAttachmentField[]}) {
    const shown = fields.filter((field) => field && (field.title || fieldValue(field.value)));
    if (shown.length === 0) {
        return null;
    }
    return (
        <FieldsGrid>
            {shown.map((field, i) => (
                <FieldItem
                    key={i}
                    $wide={!field.short}
                >
                    <dt>{field.title}</dt>
                    {fieldValue(field.value) && <dd>{fieldValue(field.value)}</dd>}
                </FieldItem>
            ))}
        </FieldsGrid>
    );
}

// Chart draws an attachment's recent values as a sparkline, with its threshold (if any) as a dashed line: the
// same look as Fusion's own attachment renderer (webapp/fusion/src/fusion/messages/content/cards.tsx), so a card
// looks the same whether that renderer draws it or this fallback does.
function Chart({attachment, color}: {attachment: MessageAttachment; color: string}) {
    const {formatMessage} = useIntl();
    const chart = attachment.chart;
    if (!chart) {
        return null;
    }
    const values = cleanValues(chart.values);
    if (values.length < 2) {
        return null;
    }
    const threshold = typeof chart.threshold === 'number' && Number.isFinite(chart.threshold) ? chart.threshold : null;
    const line = chartLine(values, threshold, CHART_WIDTH, CHART_HEIGHT);
    const label = chart.label || formatMessage(messages.chart);

    return (
        <AttachmentChartSvg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            preserveAspectRatio='none'
            role='img'
            aria-label={label}
        >
            <polygon
                points={line.area}
                fill={color}
                fillOpacity={0.14}
            />
            {line.thresholdY !== null && (
                <line
                    x1={8}
                    x2={CHART_WIDTH - 8}
                    y1={line.thresholdY}
                    y2={line.thresholdY}
                    stroke={t.danger}
                    strokeWidth={1.5}
                    strokeDasharray='5 4'
                />
            )}
            <polyline
                points={line.points}
                fill='none'
                stroke={color}
                strokeWidth={2}
                strokeLinejoin='round'
            />
            <circle
                cx={line.last.x}
                cy={line.last.y}
                r={3}
                fill={color}
            />
        </AttachmentChartSvg>
    );
}

// AttachmentCard draws one attachment of an insight's result (ASSISTANT_DISPLAY.md): this app's own rendering,
// used when the host doesn't publish Fusion's own attachment renderer (see host_attachments.ts).
export default function AttachmentCard({attachment}: {attachment: MessageAttachment}) {
    const color = cardColor(attachment.color);
    return (
        <AttachmentBox $color={color}>
            <Author attachment={attachment}/>
            <Title attachment={attachment}/>
            {attachment.text && <AttachmentText>{attachment.text}</AttachmentText>}
            {attachment.fields && <Fields fields={attachment.fields}/>}
            <Chart
                attachment={attachment}
                color={color}
            />
            {attachment.footer && <AttachmentFoot>{attachment.footer}</AttachmentFoot>}
        </AttachmentBox>
    );
}
