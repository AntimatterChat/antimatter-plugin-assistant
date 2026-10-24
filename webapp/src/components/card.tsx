// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import React from 'react';

import type {Store} from '../actions';
import type {AssistantCard} from '../types/assistant';

import ActionCard from './action_card';
import InsightCard from './insight_card';

// Card renders a card by its kind: an insight (a tool that only reads) or an action (never run on its own).
export default function Card({card, store}: {card: AssistantCard; store: Store}) {
    if (card.kind === 'action') {
        return (
            <ActionCard
                card={card}
                store={store}
            />
        );
    }
    return (
        <InsightCard
            card={card}
            store={store}
        />
    );
}
