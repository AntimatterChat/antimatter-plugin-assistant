# Assistant

The panel of Antimatter's proactive assistant: a quiet feed of cards for the conversation you're
viewing, in the app rail next to the other apps.

This app is the webapp half only. The assistant's engines, feed, deduplication and API
(`/api/v4/assistant`) live in the server itself (`server/channels/app/assistant*.go`,
`server/channels/app/ASSISTANT_API.md`), next to the AI runtime; this app's `Makefile` builds no
server plugin.

## What it does

- **Rail icon.** One app rail icon, with a small count of cards added since the panel was last
  opened (kept client-side; the server never notifies or badges on its own).
- **The panel**, for the channel being viewed:
  - sends presence while it's open (so the server knows to keep following the conversation), and
    loads the feed, then keeps it current from the server's three websocket events;
  - shows each card: an **insight** (something read-only the assistant found, with a sparkline when
    the tool's result carries data points) or an **action** (something that would change something,
    shown with its exact parameters, never run on its own);
  - a card's **why** names the rules engine's matched words or the model engine's confidence, and
    highlights the triggering message in the channel on hover (or jumps to it on click);
  - buttons: **Post to channel** (with a warning first, since the channel may have members who can't
    see the source), **Pin**, **Dismiss**, and **"Don't suggest this kind again"** (mutes the tool);
  - an action's offer shows **Run** (only when it's yours to run), **"Offered to &lt;name&gt;"**, or
    **Claim** when nobody holds it yet; running one only records it for now (`executed: false`
    stage 1) and says so;
  - a per-channel on/off switch and the muted-tools list (with Unmute) in the panel's own header —
    there's no other prompt or menu for either;
  - one quiet line when there are no cards, and one quiet line (with the rail icon hidden) when the
    assistant is off — the server, the community, or this channel.

## Installing

Upload the app bundle in **System Console > Plugins > Plugin Management** and enable it, or set
`PluginSettings.PluginStates["com.antimatterchat.assistant"].Enable` to `true`. It has no settings
of its own: the assistant's behaviour (on/off, engine, budgets, patterns) is the server's own
`AssistantSettings`, under **System Console > Integrations**. The server-wide switch is off until a
system admin turns it on; see `server/channels/app/ASSISTANT_API.md` for the rest.

## Development

```
make dist     # build the webapp bundle
make deploy   # build and install it on a running Antimatter (AM_ADMIN_TOKEN or AM_ADMIN_USERNAME/PASSWORD)
cd webapp && npm run test         # jest
cd webapp && npm run check-types  # tsc
cd webapp && npm run lint         # eslint
```

See `AI_ASSISTANT_DESIGN.md` (not in this repo) for the feature's design and the decisions behind
stage 1.
