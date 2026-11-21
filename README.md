# GTA VI Trophy Tracker

A fan-made, offline-friendly Grand Theft Auto VI trophy checklist and roadmap. The app lives in `app/` as plain static files (HTML, CSS, JS, JSON) with no build step and no network dependencies.

## Features

- Checklist for all 55 trophies with local browser persistence
- Filters for search, kind, and grade
- Story spoiler toggle to hide story trophy names/details
- Progress summary and grade breakdown
- Roadmap section for a suggested completion order

## Run locally

Serve the `app/` directory with any static file server. For Node 22+:

```sh
node serve.ts
```

Then open the printed local URL.

## Build the submission bundle

The build script copies `app/` and `screenshots/` into `out/` and generates `out/dossier.json` using the kit contract:

```sh
mkdir -p out
MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Project layout

- `app/` — static web app
- `app/data/trophies.json` — trophy data (55 canonical trophies)
- `screenshots/` — captured app screenshots
- `main.ts` — builds `out/` and `dossier.json`
- `serve.ts` — small local static server
- `vendor/makefun-frontend.ts` — kit dossier builder (unchanged)

## Notes

This is an unofficial fan project. Grand Theft Auto VI and related marks are property of their respective owners. Guide text is original and based on public trophy information.
