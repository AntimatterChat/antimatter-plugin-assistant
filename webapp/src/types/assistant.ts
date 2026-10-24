// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

// The assistant's own types, matching the server's exactly (server/channels/app/ASSISTANT_API.md,
// webapp/platform/types/src/assistant.ts in the main Antimatter checkout). Kept here rather than imported from
// @mattermost/types because that package tracks upstream Mattermost releases and doesn't carry Antimatter's own
// additions yet.

export type AssistantEngine = 'rules' | 'model';
export type AssistantCardKind = 'insight' | 'action';
export type AssistantCardStatus = 'new' | 'dismissed' | 'posted';
export type AssistantOfferStatus = 'open' | 'done' | 'expired';

export type AssistantEntityMatch = {
    type: string;
    value: string;
    text: string;
};

// Why a card appeared: the pattern and the words that matched (rules), or the model's probabilities (model).
export type AssistantWhy = {
    engine: AssistantEngine;
    pattern?: string;
    words?: string[];
    entities?: AssistantEntityMatch[];
    probabilities?: Record<string, number>;
};

// An action's offer as the viewer sees it.
export type AssistantOfferView = {
    id: string;
    status: AssistantOfferStatus;

    // Whom it's offered to now; '' for nobody.
    holder_id: string;
    offered_to_me: boolean;
    can_run: boolean;

    // When it goes to the next person if the holder neither runs nor dismisses it (milliseconds; 0: it doesn't).
    moves_at: number;
    done_by?: string;
    done_at?: number;
};

export type AssistantCard = {
    id: string;
    user_id: string;
    channel_id: string;
    kind: AssistantCardKind;
    tool: string;
    tool_title: string;
    arguments: Record<string, unknown>;
    why: AssistantWhy;

    // The triggering message first.
    post_ids: string[];
    dedupe_key: string;

    // What the tool gave (insights only).
    result?: string;
    status: AssistantCardStatus;
    pinned: boolean;
    offer_id?: string;
    offer?: AssistantOfferView;
    create_at: number;
    update_at: number;
};

export type AssistantFeed = {
    channel_id: string;

    // Whether the assistant works in the channel (the server's and the community's settings), and the person's own
    // switch for it.
    enabled: boolean;
    on: boolean;
    engine: AssistantEngine;

    // Pinned first, then the newest.
    cards: AssistantCard[];
};

export type AssistantPresence = {
    following: boolean;
    ttl_seconds: number;
    heartbeat_seconds: number;
};

export type AssistantMutedTools = {
    tools: string[];
};

export type AssistantRunResult = {
    card: AssistantCard;

    // False until actions run (stage 3): the offer is claimed and closed.
    executed: boolean;
};

// The events' data.
export type AssistantCardEventData = {
    channel_id: string;
    card: AssistantCard;
};

export type AssistantOfferEventData = {
    channel_id: string;
    card_id: string;
    offer: AssistantOfferView;
};
