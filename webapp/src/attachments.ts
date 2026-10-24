// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

// parseAttachments reads an insight's result text (AIToolResult.Text) for the attachments format documented in
// ASSISTANT_DISPLAY.md: a JSON object with an `attachments` array (the same shape a bot post's props.attachments
// uses) and a plain-text `summary`. Plain text, or JSON without an `attachments` array, returns null so the card
// falls back to today's text rendering (see insight_card.tsx). This is read-only rendering of a tool's own result,
// so parsing is lenient: a malformed attachment is dropped rather than failing the whole card.

import type {MessageAttachment, MessageAttachmentChart, MessageAttachmentField} from './types/message_attachments';

export type ParsedAttachments = {
    attachments: MessageAttachment[];
    summary: string;
};

export function parseAttachments(result: string | undefined): ParsedAttachments | null {
    if (!result) {
        return null;
    }

    let data: unknown;
    try {
        data = JSON.parse(result);
    } catch {
        return null;
    }

    if (typeof data !== 'object' || data === null) {
        return null;
    }
    const obj = data as Record<string, unknown>;
    if (!Array.isArray(obj.attachments)) {
        return null;
    }

    const attachments = obj.attachments.filter(isMessageAttachment);
    const summary = typeof obj.summary === 'string' ? obj.summary : '';
    return {attachments, summary};
}

function isMessageAttachment(v: unknown): v is MessageAttachment {
    if (typeof v !== 'object' || v === null) {
        return false;
    }
    const a = v as Record<string, unknown>;

    if ('fallback' in a && typeof a.fallback !== 'string') {
        return false;
    }
    if ('color' in a && typeof a.color !== 'string') {
        return false;
    }
    if ('author_name' in a && typeof a.author_name !== 'string') {
        return false;
    }
    if ('author_icon' in a && typeof a.author_icon !== 'string') {
        return false;
    }
    if ('title' in a && typeof a.title !== 'string') {
        return false;
    }
    if ('title_link' in a && typeof a.title_link !== 'string') {
        return false;
    }
    if ('text' in a && typeof a.text !== 'string') {
        return false;
    }
    if ('footer' in a && typeof a.footer !== 'string') {
        return false;
    }
    if ('fields' in a && !isFieldArray(a.fields)) {
        return false;
    }
    if ('chart' in a && !isChart(a.chart)) {
        return false;
    }
    return true;
}

function isFieldArray(v: unknown): v is MessageAttachmentField[] {
    if (!Array.isArray(v)) {
        return false;
    }
    return v.every((field) => {
        if (typeof field !== 'object' || field === null) {
            return false;
        }
        const f = field as Record<string, unknown>;
        if ('title' in f && typeof f.title !== 'string') {
            return false;
        }
        return !('short' in f) || typeof f.short === 'boolean';
    });
}

function isChart(v: unknown): v is MessageAttachmentChart {
    if (typeof v !== 'object' || v === null) {
        return false;
    }
    const c = v as Record<string, unknown>;
    if (!Array.isArray(c.values)) {
        return false;
    }
    if ('threshold' in c && typeof c.threshold !== 'number') {
        return false;
    }
    return !('label' in c) || typeof c.label === 'string';
}
