// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

// English only for now (i18n/en.json, hand-kept in step with components/messages.ts): translations run later and
// never block a release. Every message's defaultMessage is already English, so react-intl shows it correctly for
// an unlisted locale without this; registering it is just the usual hook other locales will fill in later.

import en from '../i18n/en.json';

import type {PluginRegistry} from './types/host';

const catalogs: Record<string, Record<string, string>> = {en};

export function translationsFor(locale: string): Record<string, string> {
    return catalogs[locale] || catalogs[locale.split('-')[0]] || {};
}

export function registerTranslations(registry: PluginRegistry) {
    registry.registerTranslations(translationsFor);
}
