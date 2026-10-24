// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import {defineMessages} from 'react-intl';

export const messages = defineMessages({
    appName: {
        id: 'assistant.app_name',
        defaultMessage: 'Assistant',
        description: 'The assistant app\'s name: its rail icon\'s label and its panel\'s title.',
    },
    railLabel: {
        id: 'assistant.rail_label',
        defaultMessage: 'Assistant, {count} new',
        description: 'Accessible label of the app rail icon when it has an unread count; {count} is a number, 1 or more.',
    },

    emptyState: {
        id: 'assistant.empty',
        defaultMessage: 'Nothing yet. The assistant shows up here when something in this conversation might help.',
        description: 'Shown in the panel when the channel has no cards.',
    },
    off: {
        id: 'assistant.off',
        defaultMessage: 'The assistant is off here.',
        description: 'Shown in the panel instead of the feed when the assistant is off (the server, the community, or this channel).',
    },
    loading: {
        id: 'assistant.loading',
        defaultMessage: 'Loading…',
        description: 'Shown in the panel while its feed is loading.',
    },

    onSwitch: {
        id: 'assistant.on_switch',
        defaultMessage: 'Assistant in this channel',
        description: 'Label of the panel header\'s on/off switch for this channel.',
    },
    mutedToolsHeading: {
        id: 'assistant.muted_tools.heading',
        defaultMessage: 'Muted',
        description: 'Heading of the panel\'s list of tools the person asked not to be suggested any more.',
    },
    mutedToolsEmpty: {
        id: 'assistant.muted_tools.empty',
        defaultMessage: 'Nothing muted.',
        description: 'Shown under "Muted" when the person hasn\'t muted any tool.',
    },
    unmute: {
        id: 'assistant.unmute',
        defaultMessage: 'Unmute',
        description: 'Button that lets a muted tool suggest cards again.',
    },

    why: {
        id: 'assistant.why',
        defaultMessage: 'Why',
        description: 'Label introducing a card\'s "why" row: the words that matched, or the model\'s confidence.',
    },
    whyWords: {
        id: 'assistant.why.words',
        defaultMessage: 'Matched "{words}"',
        description: 'A card\'s why row for the rules engine: the words of the message that matched a pattern.',
    },
    whyConfidence: {
        id: 'assistant.why.confidence',
        defaultMessage: '{percent}% confident',
        description: 'A card\'s why row for the model engine: how sure the decision model was that this card was worth showing. {percent} is a number.',
    },
    goToMessage: {
        id: 'assistant.go_to_message',
        defaultMessage: 'Go to message',
        description: 'Link on a card that opens the message that triggered it.',
    },

    postToChannel: {
        id: 'assistant.post',
        defaultMessage: 'Post to channel',
        description: 'Button on an insight card that posts its result to the channel as a message.',
    },
    postWarning: {
        id: 'assistant.post.warning',
        defaultMessage: 'Some people in this channel may not have access to {source}.',
        description: 'Warning shown before posting an insight card to the channel, in case its source isn\'t visible to everyone there. {source} names the tool\'s service, e.g. "Grafana".',
    },
    postConfirm: {
        id: 'assistant.post.confirm',
        defaultMessage: 'Post anyway',
        description: 'Confirms posting an insight card to the channel after its warning.',
    },
    postCancel: {
        id: 'assistant.post.cancel',
        defaultMessage: 'Cancel',
        description: 'Cancels posting an insight card to the channel, after its warning.',
    },
    posted: {
        id: 'assistant.posted',
        defaultMessage: 'Posted to the channel.',
        description: 'Shown on a card once its result has been posted to the channel.',
    },

    pin: {
        id: 'assistant.pin',
        defaultMessage: 'Pin',
        description: 'Button that pins a card to the top of the feed.',
    },
    unpin: {
        id: 'assistant.unpin',
        defaultMessage: 'Unpin',
        description: 'Button that unpins a pinned card.',
    },
    dismiss: {
        id: 'assistant.dismiss',
        defaultMessage: 'Dismiss',
        description: 'Button that removes a card from the feed.',
    },
    muteKind: {
        id: 'assistant.mute_kind',
        defaultMessage: "Don't suggest this kind again",
        description: 'Button that mutes a card\'s tool for the person, everywhere, and dismisses the card.',
    },

    parameters: {
        id: 'assistant.parameters',
        defaultMessage: 'Parameters',
        description: 'Heading over an action card\'s exact arguments.',
    },
    run: {
        id: 'assistant.run',
        defaultMessage: 'Run',
        description: 'Button that runs an action offered to the person.',
    },
    runRecorded: {
        id: 'assistant.run.recorded',
        defaultMessage: 'Recorded. Running actions comes in a later version.',
        description: 'Shown on an action card after Run: the server records the offer as done but doesn\'t run the action yet.',
    },
    offeredTo: {
        id: 'assistant.offered_to',
        defaultMessage: 'Offered to {name}',
        description: 'Shown on an action card offered to someone else; {name} is their display name.',
    },
    claim: {
        id: 'assistant.claim',
        defaultMessage: 'Claim',
        description: 'Button that takes an action offered to nobody.',
    },
});
