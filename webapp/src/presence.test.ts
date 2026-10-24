// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import * as client from './client';
import {startAssistantPresence} from './presence';

jest.mock('./client');

const mockedClient = client as jest.Mocked<typeof client>;

describe('startAssistantPresence', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockedClient.setAssistantPresence.mockReset();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('opens presence immediately and keeps sending it on the server\'s own heartbeat interval', async () => {
        mockedClient.setAssistantPresence.mockResolvedValue({following: true, ttl_seconds: 90, heartbeat_seconds: 30});

        startAssistantPresence('channel1');
        await flush();

        expect(mockedClient.setAssistantPresence).toHaveBeenCalledWith('channel1', true);
        expect(mockedClient.setAssistantPresence).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(30000);
        await flush();
        expect(mockedClient.setAssistantPresence).toHaveBeenCalledTimes(2);

        jest.advanceTimersByTime(30000);
        await flush();
        expect(mockedClient.setAssistantPresence).toHaveBeenCalledTimes(3);
    });

    it('stops the heartbeat and sends open: false exactly once when stopped', async () => {
        mockedClient.setAssistantPresence.mockResolvedValue({following: true, ttl_seconds: 90, heartbeat_seconds: 30});

        const stop = startAssistantPresence('channel1');
        await flush();
        mockedClient.setAssistantPresence.mockClear();

        stop();
        await flush();

        expect(mockedClient.setAssistantPresence).toHaveBeenCalledWith('channel1', false);
        expect(mockedClient.setAssistantPresence).toHaveBeenCalledTimes(1);

        // No more heartbeats after stopping.
        jest.advanceTimersByTime(120000);
        await flush();
        expect(mockedClient.setAssistantPresence).toHaveBeenCalledTimes(1);

        // Stopping twice sends nothing more.
        stop();
        await flush();
        expect(mockedClient.setAssistantPresence).toHaveBeenCalledTimes(1);
    });

    it('calls back with the presence it receives', async () => {
        mockedClient.setAssistantPresence.mockResolvedValue({following: false, ttl_seconds: 90, heartbeat_seconds: 30});
        const onPresence = jest.fn();

        startAssistantPresence('channel1', onPresence);
        await flush();

        expect(onPresence).toHaveBeenCalledWith({following: false, ttl_seconds: 90, heartbeat_seconds: 30});
    });
});

// flush lets queued promise callbacks run under fake timers.
async function flush() {
    await Promise.resolve();
    await Promise.resolve();
}
