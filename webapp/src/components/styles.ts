// Copyright (c) 2026-present Antimatter contributors.
// See LICENSE.txt for license information.

import styled from 'styled-components';

// Fusion's tokens (--am-*), which follow the theme (light, dark, OLED), with the classic web app's colours as a
// fallback where Fusion isn't running. The same pattern the AI chat app's panel uses.
export const t = {
    text: 'var(--am-text, var(--center-channel-color))',
    text2: 'var(--am-text-2, rgba(var(--center-channel-color-rgb), 0.8))',
    muted: 'var(--am-muted, rgba(var(--center-channel-color-rgb), 0.64))',
    faint: 'var(--am-faint, rgba(var(--center-channel-color-rgb), 0.48))',
    line: 'var(--am-line, rgba(var(--center-channel-color-rgb), 0.12))',
    raise: 'var(--am-raise, rgba(var(--center-channel-color-rgb), 0.06))',
    raise2: 'var(--am-raise-2, rgba(var(--center-channel-color-rgb), 0.1))',
    hover: 'var(--am-hover, rgba(var(--center-channel-color-rgb), 0.08))',
    main: 'var(--am-main, var(--center-channel-bg))',
    accent: 'var(--am-matter, var(--button-bg))',
    accentSoft: 'var(--am-matter-soft, rgba(var(--button-bg-rgb), 0.12))',
    danger: 'var(--am-danger, var(--error-text))',
    dangerSoft: 'var(--am-danger-soft, rgba(var(--error-text-color-rgb, 218, 53, 69), 0.12))',
    shadow: 'var(--am-shadow, 0 8px 24px rgba(0, 0, 0, 0.16))',
    fontUI: 'var(--am-font-ui, inherit)',
    fontDisplay: 'var(--am-font-display, inherit)',
};

export const Panel = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    height: 100%;
    min-height: 0;
    min-width: 0;
    color: ${t.text};
    font-family: ${t.fontUI};
`;

export const PanelHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    flex: none;
    min-height: 48px;
    padding: 8px 12px;
    border-bottom: 1px solid ${t.line};
    min-width: 0;
`;

export const Grow = styled.div`
    flex: 1;
    min-width: 0;
`;

export const Body = styled.div`
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px;
`;

export const Center = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 24px 20px;
    text-align: center;
`;

export const Title = styled.h3`
    margin: 0;
    font: 600 17px/24px ${t.fontDisplay};
    color: ${t.text};
    overflow-wrap: anywhere;
`;

export const Text = styled.p`
    margin: 0;
    max-width: 320px;
    font-size: 13px;
    line-height: 19px;
    color: ${t.muted};
`;

export const SectionHeading = styled.div`
    margin: 4px 2px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: ${t.faint};
`;

// A card (insight or action).
export const Card = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px;
    border: 1px solid ${t.line};
    border-radius: 10px;
    background: ${t.raise};
`;

export const CardTitle = styled.div`
    font: 600 14px/19px ${t.fontDisplay};
    color: ${t.text};
    overflow-wrap: anywhere;
`;

export const CardSummary = styled.p`
    margin: 0;
    font-size: 13px;
    line-height: 18px;
    color: ${t.text2};
    overflow-wrap: anywhere;
`;

export const WhyRow = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    align-self: flex-start;
    padding: 2px 0;
    border: 0;
    background: transparent;
    color: ${t.muted};
    font-size: 12px;
    cursor: pointer;

    &:hover, &:focus-visible {
        color: ${t.accent};
    }

    &:focus-visible {
        outline: 2px solid ${t.accent};
        outline-offset: 2px;
        border-radius: 4px;
    }
`;

export const ButtonRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 4px;
`;

export const Button = styled.button<{$variant?: 'primary' | 'danger'}>`
    padding: 5px 10px;
    border: 1px solid ${t.line};
    border-radius: 6px;
    background: ${({$variant}) => ($variant === 'primary' ? t.accent : 'transparent')};
    color: ${({$variant}) => {
        if ($variant === 'primary') {
            return 'var(--button-color, #fff)';
        }
        if ($variant === 'danger') {
            return t.danger;
        }
        return t.text2;
    }};
    font: 600 12px/16px ${t.fontUI};
    cursor: pointer;

    &:hover:not(:disabled) {
        background: ${({$variant}) => ($variant === 'primary' ? t.accent : t.hover)};
        opacity: ${({$variant}) => ($variant === 'primary' ? 0.9 : 1)};
    }

    &:disabled {
        opacity: 0.5;
        cursor: default;
    }

    &:focus-visible {
        outline: 2px solid ${t.accent};
        outline-offset: 1px;
    }
`;

export const Warning = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 10px;
    border-radius: 8px;
    background: ${t.dangerSoft};
    color: ${t.text};
    font-size: 12px;
    line-height: 17px;
`;

export const Note = styled.p`
    margin: 2px 0 0;
    font-size: 12px;
    color: ${t.muted};
`;

export const ParamsList = styled.dl`
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 2px 8px;
    margin: 0;
    font-size: 12px;

    dt {
        color: ${t.faint};
        font-weight: 600;
    }

    dd {
        margin: 0;
        color: ${t.text2};
        overflow-wrap: anywhere;
    }
`;

export const Switch = styled.label`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: ${t.text2};
    cursor: pointer;

    input {
        accent-color: ${t.accent};
    }
`;

export const ToolChip = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    border: 1px solid ${t.line};
    border-radius: 999px;
    font-size: 12px;
    color: ${t.text2};
    background: ${t.raise2};
`;

export const IconButton = styled.button`
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: ${t.muted};
    cursor: pointer;

    &:hover, &[aria-pressed='true'] {
        background: ${t.hover};
        color: ${t.text};
    }

    &:focus-visible {
        outline: 2px solid ${t.accent};
        outline-offset: 1px;
    }
`;
