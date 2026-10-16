# A Replay Link is the only URL that opens a screen

After a Stage Battle, a Dungeon Battle or a Heynspire Floor Battle with a win or a loss, the Player can share a **Replay Link**. The link holds the full Replay (rules ADR-0006: the Battle seed, the Battle setup and the Commands), compressed into the URL fragment (`/play#replay=…`). When a Player opens the link, the game starts Watching a Replay at once, in place of the Town. There is no import screen: the link is the import. We use the link for two purposes: a Player shares an exciting Battle, and a developer gets a bug report that the rules can run again.

We did this because the game has no database server to keep a Replay and give a short id, and a link is the only share that works with one tap on mobile. The fragment does not go to the server, so the TanStack Start server never sees or logs the Replay.

## Considered Options

- **A Replay file to download and upload.** Rejected. On mobile, a friend must save a file and then find it again.
- **A paste field in the Town or in the settings.** Rejected. It adds a screen only for people who cannot open a link.
- **A server that stores the Replay and gives a short link.** Rejected. The game has no database, and a Replay is small enough for a URL.
- **A record of the Battle Events in place of a Replay.** Rejected. It is much larger, and it shows only what the Player saw, so it is weak for debugging.

## Consequences

- This is an exception to ADR-0006. The game reads the fragment at the start and on a fragment change, and then removes it. A reload still opens the Town.
- During a Live Battle, the game ignores a Replay Link and shows a toast. A Battle in progress has no save, so the game must never lose it silently.
- Each link holds a hash of the rules and the content, made at build time. When the hash is not the same as the hash of this build, the game refuses the Replay, opens the Town and shows a toast. The same Commands can give a different Battle after a balance change, and a wrong Battle that looks correct is worse than no Battle. A UI-only deploy does not change the hash.
- A broken link also opens the Town with a toast, with a different message.
- Each shared link is a public contract. A change to the link format must still read the old format, or it must refuse the old links clearly.
- Watching a Replay never writes to the Profile: it shows no Hint and Discovers no card.
