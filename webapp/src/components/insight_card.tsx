// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import React, {useState} from 'react';
import {useIntl} from 'react-intl';

import {dismissCard, muteCard, pinCard, postCard, type Store} from '../actions';
import {parseAttachments} from '../attachments';
import {extractDataPoints} from '../sparkline';
import {sourceNameFromTool} from '../tool_source';
import type {AssistantCard} from '../types/assistant';

import AttachmentsCard from './attachments_card';
import {messages} from './messages';
import Sparkline from './sparkline';
import {Button, ButtonRow, Card, CardSummary, CardTitle, CardTitleRow, Note, PinMark, Warning} from './styles';
import WhyRow from './why_row';

// stripDataPointsLine removes a metrics tool's "points: ..." line from the text shown to the person: the
// sparkline already draws it (see sparkline.ts).
function stripDataPointsLine(result: string): string {
    return result.replace(/^\s*points:.*$/im, '').replace(/\n{2,}/g, '\n').trim();
}

// fallbackSummary is today's rendering of a plain-text result (no attachments format, see attachments.ts): its
// text, minus the sparkline's own "points: ..." line.
function fallbackSummary(result: string | undefined): string {
    return result ? stripDataPointsLine(result) : '';
}

// Footer shows the posted note, the post warning (once "Post to channel" is clicked), or the card's buttons.
function Footer({card, store}: {card: AssistantCard; store: Store}) {
    const {formatMessage} = useIntl();
    const [confirmingPost, setConfirmingPost] = useState(false);
    const [posting, setPosting] = useState(false);

    const onPost = async () => {
        setPosting(true);
        try {
            await postCard(store, card.channel_id, card.id);
            setConfirmingPost(false);
        } finally {
            setPosting(false);
        }
    };

    if (card.status === 'posted') {
        return <Note>{formatMessage(messages.posted)}</Note>;
    }

    if (confirmingPost) {
        const source = sourceNameFromTool(card.tool);
        return (
            <Warning>
                <span>{formatMessage(messages.postWarning, {source})}</span>
                <ButtonRow>
                    <Button
                        $variant='primary'
                        disabled={posting}
                        onClick={onPost}
                    >
                        {formatMessage(messages.postConfirm)}
                    </Button>
                    <Button
                        disabled={posting}
                        onClick={() => setConfirmingPost(false)}
                    >
                        {formatMessage(messages.postCancel)}
                    </Button>
                </ButtonRow>
            </Warning>
        );
    }

    return (
        <ButtonRow>
            <Button onClick={() => setConfirmingPost(true)}>
                {formatMessage(messages.postToChannel)}
            </Button>
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
    );
}

export default function InsightCard({card, store}: {card: AssistantCard; store: Store}) {
    const {formatMessage} = useIntl();
    const parsed = parseAttachments(card.result);
    const points = parsed ? null : extractDataPoints(card.result);
    const summary = parsed ? parsed.summary : fallbackSummary(card.result);

    return (
        <Card>
            <CardTitleRow>
                <CardTitle>{card.tool_title}</CardTitle>
                {card.pinned && <PinMark>{formatMessage(messages.pinned)}</PinMark>}
            </CardTitleRow>
            {summary && <CardSummary>{summary}</CardSummary>}
            {parsed ? (
                <AttachmentsCard
                    attachments={parsed.attachments}
                    summary={parsed.summary}
                />
            ) : (
                points && <Sparkline points={points}/>
            )}
            <WhyRow
                why={card.why}
                postId={card.post_ids[0]}
                channelId={card.channel_id}
            />
            <Footer
                card={card}
                store={store}
            />
        </Card>
    );
}
