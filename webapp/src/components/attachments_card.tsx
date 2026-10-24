// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import React from 'react';

import {hostAttachmentsRenderer} from '../host_attachments';
import type {MessageAttachment} from '../types/message_attachments';

import AttachmentCard from './attachment_card';
import {AttachmentGroup} from './styles';

// AttachmentsCard draws an insight's result once it's known to be the attachments format (ASSISTANT_DISPLAY.md):
// Fusion's own attachment renderer when the host publishes one (so a card looks exactly like a formatted post),
// or this app's own rendering of the same fields otherwise. The group carries the result's one-line summary as
// its accessible label, so a screen reader announces it even for a chart-only result.
export default function AttachmentsCard({attachments, summary}: {attachments: MessageAttachment[]; summary: string}) {
    const Host = hostAttachmentsRenderer();
    if (Host) {
        return (
            <Host
                attachments={attachments}
                summary={summary}
            />
        );
    }

    return (
        <AttachmentGroup
            role='group'
            aria-label={summary}
        >
            {attachments.map((attachment, i) => (
                <AttachmentCard
                    key={i}
                    attachment={attachment}
                />
            ))}
        </AttachmentGroup>
    );
}
