// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import React, {useEffect} from 'react';
import {useIntl} from 'react-intl';
import {useSelector} from 'react-redux';

import type {GlobalState} from '@mattermost/types/store';

import type {Store} from '../actions';
import {loadMutedTools, setChannelOn, unmuteTool} from '../actions';
import {getMutedTools} from '../selectors';

import {messages} from './messages';
import {Button, SectionHeading, Switch, ToolChip} from './styles';

// Controls is the panel header's per-channel switch and the muted-tools list ("Don't suggest this kind again",
// with Unmute). The switch and the list are both reachable only here: no other prompt or menu duplicates them.
export function OnSwitch({channelId, on, store}: {channelId: string; on: boolean; store: Store}) {
    const {formatMessage} = useIntl();
    return (
        <Switch>
            <input
                type='checkbox'
                checked={on}
                aria-label={formatMessage(messages.onSwitch)}
                onChange={(e) => setChannelOn(store, channelId, e.target.checked)}
            />
            {formatMessage(messages.onSwitch)}
        </Switch>
    );
}

export function MutedTools({store}: {store: Store}) {
    const {formatMessage} = useIntl();
    const tools = useSelector((state: GlobalState) => getMutedTools(state));

    useEffect(() => {
        loadMutedTools(store);

        // Loaded once when the controls mount; a mute from a card updates the list locally without refetching.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div>
            <SectionHeading>{formatMessage(messages.mutedToolsHeading)}</SectionHeading>
            {tools.length === 0 ? (
                <ToolChip>{formatMessage(messages.mutedToolsEmpty)}</ToolChip>
            ) : (
                tools.map((tool) => (
                    <ToolChip key={tool}>
                        {tool}
                        <Button onClick={() => unmuteTool(store, tools, tool)}>
                            {formatMessage(messages.unmute)}
                        </Button>
                    </ToolChip>
                ))
            )}
        </div>
    );
}
