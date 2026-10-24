// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import React, {useState} from 'react';
import {useIntl} from 'react-intl';

import {claimCard, dismissCard, muteCard, pinCard, runCard, type Store} from '../actions';
import {useDisplayName} from '../hooks/use_display_name';
import type {AssistantCard} from '../types/assistant';

import {messages} from './messages';
import {Button, ButtonRow, Card, CardTitle, CardTitleRow, Note, ParamsList, PinMark} from './styles';
import WhyRow from './why_row';

function Parameters({args}: {args: Record<string, unknown>}) {
    const {formatMessage} = useIntl();
    const entries = Object.entries(args);
    if (entries.length === 0) {
        return null;
    }
    return (
        <div>
            <Note as='div'>{formatMessage(messages.parameters)}</Note>
            <ParamsList>
                {entries.map(([key, value]) => (
                    <React.Fragment key={key}>
                        <dt>{key}</dt>
                        <dd>{typeof value === 'string' ? value : JSON.stringify(value)}</dd>
                    </React.Fragment>
                ))}
            </ParamsList>
        </div>
    );
}

// OfferControls shows an action's offer: Run when it's the viewer's to run, "Offered to <name>" when it's
// someone else's, Claim when it's offered to nobody, and the recorded note once it's been run (stage 1 never
// actually runs it: see runCard).
function OfferControls({card, store}: {card: AssistantCard; store: Store}) {
    const {formatMessage} = useIntl();
    const [running, setRunning] = useState(false);
    const offer = card.offer;
    const holderName = useDisplayName(offer?.holder_id || '');

    if (!offer) {
        return null;
    }
    if (offer.status === 'done') {
        return <Note>{formatMessage(messages.runRecorded)}</Note>;
    }
    if (offer.can_run) {
        return (
            <Button
                $variant='primary'
                disabled={running}
                onClick={async () => {
                    setRunning(true);
                    try {
                        await runCard(store, card.channel_id, card.id);
                    } finally {
                        setRunning(false);
                    }
                }}
            >
                {formatMessage(messages.run)}
            </Button>
        );
    }
    if (!offer.holder_id) {
        return (
            <Button onClick={() => claimCard(store, card.channel_id, card.id)}>
                {formatMessage(messages.claim)}
            </Button>
        );
    }
    return (
        <Note>{formatMessage(messages.offeredTo, {name: holderName || offer.holder_id})}</Note>
    );
}

export default function ActionCard({card, store}: {card: AssistantCard; store: Store}) {
    const {formatMessage} = useIntl();

    return (
        <Card>
            <CardTitleRow>
                <CardTitle>{card.tool_title}</CardTitle>
                {card.pinned && <PinMark>{formatMessage(messages.pinned)}</PinMark>}
            </CardTitleRow>
            <Parameters args={card.arguments}/>
            <WhyRow
                why={card.why}
                postId={card.post_ids[0]}
                channelId={card.channel_id}
            />
            <OfferControls
                card={card}
                store={store}
            />
            <ButtonRow>
                <Button onClick={() => pinCard(store, card.channel_id, card.id, !card.pinned)}>
                    {formatMessage(card.pinned ? messages.unpin : messages.pin)}
                </Button>
                <Button onClick={() => dismissCard(store, card.channel_id, card.id)}>
                    {formatMessage(messages.dismiss)}
                </Button>
                <Button onClick={() => muteCard(store, card.channel_id, card.id, card.tool)}>
                    {formatMessage(messages.muteKind)}
                </Button>
            </ButtonRow>
        </Card>
    );
}
