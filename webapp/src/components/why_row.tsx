// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import React from 'react';
import {useIntl} from 'react-intl';
import {useDispatch} from 'react-redux';

import {clearHighlight, highlightPost, selectPost} from '../redux_actions';
import type {AssistantWhy} from '../types/assistant';

import {messages} from './messages';
import {WhyRow as WhyRowButton} from './styles';

// highestProbability picks the probability most worth showing: "card" (whether to show a card at all) when
// present, else the first one the model gave.
function highestProbability(why: AssistantWhy): number | undefined {
    if (!why.probabilities) {
        return undefined;
    }
    if (typeof why.probabilities.card === 'number') {
        return why.probabilities.card;
    }
    return Object.values(why.probabilities)[0];
}

// WhyRow shows a card's "why": the rules engine's matched words, or the model engine's confidence. The triggering
// message (post_ids[0]) highlights in the channel while the pointer is over it (Fusion exposes this through the
// same action the host's own post list uses to highlight a jumped-to message), and clicking it opens the message.
export default function WhyRow({why, postId, channelId}: {why: AssistantWhy; postId?: string; channelId: string}) {
    const {formatMessage} = useIntl();
    const dispatch = useDispatch();

    let text: string | null = null;
    if (why.engine === 'rules' && why.words?.length) {
        text = formatMessage(messages.whyWords, {words: why.words.join(', ')});
    } else {
        const probability = highestProbability(why);
        if (typeof probability === 'number') {
            text = formatMessage(messages.whyConfidence, {percent: Math.round(probability * 100)});
        }
    }
    if (!text) {
        return null;
    }

    if (!postId) {
        return <WhyRowButton as='span'>{text}</WhyRowButton>;
    }

    return (
        <WhyRowButton
            type='button'
            title={formatMessage(messages.goToMessage)}
            onMouseEnter={() => dispatch(highlightPost(postId))}
            onMouseLeave={() => dispatch(clearHighlight())}
            onFocus={() => dispatch(highlightPost(postId))}
            onBlur={() => dispatch(clearHighlight())}
            onClick={() => dispatch(selectPost(postId, channelId))}
        >
            {text}
        </WhyRowButton>
    );
}
