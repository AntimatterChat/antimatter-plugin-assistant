// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

// The subset of the server's message-attachment format (webapp/platform/types/src/message_attachments.ts,
// props.attachments on a post) an assistant tool's result may use, plus Antimatter's own `chart` field. Kept here
// rather than imported from @mattermost/types for the same reason types/assistant.ts is: that package tracks
// upstream Mattermost releases and doesn't carry Antimatter's own additions yet. Assistant results never carry
// `actions` (buttons): the server drops them before a card ever reaches here (see ASSISTANT_DISPLAY.md).

export type MessageAttachmentField = {
    title?: string;
    value?: unknown;
    short?: boolean;
};

export type MessageAttachmentChart = {
    values: number[];
    threshold?: number;
    label?: string;
};

export type MessageAttachment = {
    fallback?: string;
    color?: string;
    author_name?: string;
    author_icon?: string;
    title?: string;
    title_link?: string;
    text?: string;
    fields?: MessageAttachmentField[];
    footer?: string;
    chart?: MessageAttachmentChart;
};
