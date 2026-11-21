[![make.fun - gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/cimotsimilikitiw/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/cimotsimilikitiw/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Ledger — GTA VI trophy guide and tracker

An offline guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI, built as plain static files that a browser opens directly from disk or from any static server. Nothing is fetched over the network: no fonts, no images, no analytics, no build step at run time.

The trophy names, descriptions and grades are shown as the official list publishes them. Everything else — the route to the platinum, the missable flags, the readings of the vaguer descriptions — is written for this guide, and every trophy's pane names where its facts come from.

## What it does

**The list.** All 55 trophies, each with its official name, its official description and its grade, in the order PlayStation publishes them. The grade split is shown in the header: 1 platinum, 2 gold, 6 silver, 46 bronze.

**Progress that survives a reload.** Ticking a row writes to `localStorage` immediately. The header meter, the percentage and the per-grade counters all move with it.

**Filters.** Kind chips for Story, Missable, Collectibles, Activities and Other; a grade select; a free-text search that looks through names, descriptions, chapters and guide text. A visible counter says how many rows are showing.

**A spoiler setting.** With it on, any unearned story trophy shows as `Hidden story trophy` with its description and guide replaced by a note — in the list, in the detail pane and in the roadmap. Earn the trophy, or switch spoilers off, and the text comes back. Earned story trophies are never hidden, on the reasoning that you have already seen them.

**A roadmap to the platinum.** Six stages in the order the descriptions imply: the story chapters first, then the stranger strands that can close as the story moves on, then open-world activities, then the collectible sweeps, then heists and free-roam one-offs, then 100% and the platinum. Each stage card lists its rows, shows how many are earned, and flags the missable ones.

**Missable flags.** Nineteen rows are flagged, each with the reason: a strand ending that story progress can close, a partner who has to be present at the moment the wanted level drops, a one-off social outing, a unique animal, an undetected robbery window, a secret encounter.

**Export, import and a share link.** Export writes a small JSON file of earned ids; import reads one back and ignores ids the list does not hold. The save view also builds a link that carries the earned ids in the URL fragment, so progress can move between browsers without a server.

## Guide policy

Each guide is written for this entry, in four parts: what the requirement literally is, how to meet it, when it can be lost, and what it is based on. Two labels keep the honesty visible in the app:

- **Stated** — the requirement is in the official description: a named mission, a named count, a named district or venue.
- **Reading** — the description is a joke or a riddle (the armoured-vehicle pun, the second-attempt joke, the secret encounter). The guide says so and offers the reading rather than inventing a location or a step.

No location, collectible position or step is asserted without a source. Where the official text gives no location, the guide says that too.

## Run it

Node 22.18 or later, no dependencies to install.

```sh
node serve.ts
```

That serves `app/` on <http://127.0.0.1:8080>. Pass `--port 9000` for another port. Opening `app/index.html` straight from the filesystem will not load the trophy data, because the browser blocks the module and JSON reads over `file://`; use the server.

## Build the submission bundle

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` into the output directory and writes `dossier.json` with `buildDossier` from the vendored make.fun library, under the scorer's caps: 4 screenshots at most and 256 KiB each, 993 entries and 48 MiB of app files, 160 KiB of dossier text. It refuses to build if the screenshots are missing, fewer than three, or over size.

## Layout

| Path | What it is |
| --- | --- |
| `app/index.html` | The page: masthead, filters, checklist, roadmap and save views |
| `app/app.js` | The tracker: state, storage, filters, spoiler mode, export and import |
| `app/style.css` | The look: warm paper, ink type, one hot accent, system fonts only |
| `app/data/trophies.json` | The 55 trophies with guides, stages, missable flags and sources |
| `screenshots/` | Four captures of the running app; the first by name is the cover |
| `main.ts` | Copies app and screenshots to the output directory, writes the dossier |
| `serve.ts` | A small static server for local preview |
| `shots.json` | Which app state each capture shows, and the URL that produces it |
| `vendor/makefun-frontend.ts` | The kit's dossier library, unchanged |

## Screenshots

`shots.json` records the state behind each capture. All four are headless Chromium renders of this app, 1280×720, taken from the local server with the URL fragment that sets the state.

## Notes

Unofficial fan project. Grand Theft Auto VI and related marks belong to their respective owners. No Rockstar logo, box art, official artwork or in-game screenshot appears anywhere in this repository: the only images are renders of the guide's own pages. Guide text is original; official trophy names and descriptions are quoted as published.

MIT licensed, see [LICENSE](LICENSE).

---

<sub>Entered on [make.fun](https://make.fun/?ref=fe0p3md4&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
