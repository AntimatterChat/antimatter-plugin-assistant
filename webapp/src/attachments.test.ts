// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import {parseAttachments} from './attachments';

describe('parseAttachments', () => {
    it('reads a well-formed attachments result', () => {
        const result = JSON.stringify({
            attachments: [{
                fallback: 'CPU on www-1: 4% now',
                color: '#3E8EDE',
                title: 'CPU on www-1',
                text: '4.1% now',
                fields: [{title: 'Now', value: '4.1%', short: true}],
            }],
            summary: 'CPU on www-1: 4% now, 6% peak in the last hour',
        });

        const parsed = parseAttachments(result);

        expect(parsed).not.toBeNull();
        expect(parsed?.summary).toBe('CPU on www-1: 4% now, 6% peak in the last hour');
        expect(parsed?.attachments).toHaveLength(1);
        expect(parsed?.attachments[0].title).toBe('CPU on www-1');
    });

    it('falls back to null for plain text', () => {
        expect(parseAttachments('www-1 CPU, last hour: 23% average, 61% peak')).toBeNull();
    });

    it('falls back to null for JSON without an attachments array', () => {
        expect(parseAttachments(JSON.stringify({summary: 'all fine'}))).toBeNull();
    });

    it('falls back to null for unparseable text', () => {
        expect(parseAttachments('{not json')).toBeNull();
    });

    it('falls back to null for undefined or empty results', () => {
        expect(parseAttachments(undefined)).toBeNull();
        expect(parseAttachments('')).toBeNull();
    });

    it('drops a malformed attachment but keeps the valid ones', () => {
        const result = JSON.stringify({
            attachments: [{title: 'Good', text: 'fine'}, {title: 42}, 'nope'],
            summary: 'one of three was usable',
        });

        const parsed = parseAttachments(result);

        expect(parsed?.attachments).toHaveLength(1);
        expect(parsed?.attachments[0].title).toBe('Good');
    });

    it('defaults the summary to an empty string when missing', () => {
        const parsed = parseAttachments(JSON.stringify({attachments: []}));
        expect(parsed).toEqual({attachments: [], summary: ''});
    });
});
