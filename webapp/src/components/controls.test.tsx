// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import React from 'react';
import {IntlProvider} from 'react-intl';
import {Provider} from 'react-redux';

import * as client from '../client';
import type {Store} from '../actions';
import manifest from '../manifest';
import reducer from '../reducer';

import {makeStore} from '../../tests/utils';

import {MutedTools, OnSwitch} from './controls';

jest.mock('../client');

const mockedClient = client as jest.Mocked<typeof client>;

beforeEach(() => jest.clearAllMocks());

describe('OnSwitch', () => {
    it('reflects the channel\'s on state and sends PUT /enabled on change', () => {
        mockedClient.setAssistantChannelOn.mockResolvedValue({on: false});
        const dispatch = jest.fn();
        const store: Store = {dispatch, getState: jest.fn(() => ({})) as never};

        render(
            <IntlProvider
                locale='en'
                onError={() => null}
            >
                <OnSwitch
                    channelId='channel1'
                    on={true}
                    store={store}
                />
            </IntlProvider>,
        );

        const checkbox = screen.getByRole('checkbox', {name: 'Assistant in this channel'});
        expect(checkbox).toBeChecked();

        fireEvent.click(checkbox);
        expect(mockedClient.setAssistantChannelOn).toHaveBeenCalledWith('channel1', false);
    });
});

describe('MutedTools', () => {
    it('shows an empty note when nothing is muted', async () => {
        mockedClient.getAssistantMutedTools.mockResolvedValue({tools: []});
        const reduxStore = makeStore({[`plugins-${manifest.id}`]: reducer(undefined, {type: '@@INIT'})} as never);
        const store: Store = {dispatch: reduxStore.dispatch as never, getState: reduxStore.getState as never};

        render(
            <Provider store={reduxStore}>
                <IntlProvider
                    locale='en'
                    onError={() => null}
                >
                    <MutedTools store={store}/>
                </IntlProvider>
            </Provider>,
        );

        expect(await screen.findByText('Nothing muted.')).toBeInTheDocument();
    });

    it('lists muted tools with Unmute, which sends the rest of the list', async () => {
        mockedClient.getAssistantMutedTools.mockResolvedValue({tools: ['mcp.grafana.query_metrics']});
        mockedClient.setAssistantMutedTools.mockResolvedValue({tools: []});
        const reduxStore = makeStore({[`plugins-${manifest.id}`]: reducer(undefined, {type: '@@INIT'})} as never);
        const store: Store = {dispatch: reduxStore.dispatch as never, getState: reduxStore.getState as never};

        render(
            <Provider store={reduxStore}>
                <IntlProvider
                    locale='en'
                    onError={() => null}
                >
                    <MutedTools store={store}/>
                </IntlProvider>
            </Provider>,
        );

        expect(await screen.findByText('mcp.grafana.query_metrics')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Unmute'));
        await waitFor(() => expect(mockedClient.setAssistantMutedTools).toHaveBeenCalledWith([]));
    });
});
