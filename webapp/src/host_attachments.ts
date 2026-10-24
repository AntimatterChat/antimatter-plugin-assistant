// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import type React from 'react';

import type {MessageAttachment} from './types/message_attachments';

export type HostAttachmentsProps = {
    attachments: MessageAttachment[];
    summary: string;
};
export type HostAttachmentsRenderer = (props: HostAttachmentsProps) => React.ReactElement | null;

// hostAttachmentsRenderer looks for Fusion's own attachment renderer (webapp/fusion/src/fusion/messages/content/
// cards.tsx), published to apps on window.WebappUtils once the server repo adds it (see ASSISTANT_DISPLAY.md #2;
// not landed there yet, so this always falls through today). The exact published name isn't settled, so a couple
// of candidates are checked; only one that's actually a function is used, and a card falls back to this app's own
// rendering (attachment_card.tsx) otherwise.
export function hostAttachmentsRenderer(): HostAttachmentsRenderer | null {
    const host = window as unknown as {WebappUtils?: {cards?: Record<string, unknown>}};
    const cards = host.WebappUtils?.cards;
    if (!cards) {
        return null;
    }
    const candidate = cards.MessageAttachmentCard || cards.AttachmentCard || cards.MessageAttachments;
    return typeof candidate === 'function' ? candidate as HostAttachmentsRenderer : null;
}
