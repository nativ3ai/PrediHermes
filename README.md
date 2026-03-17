# PrediHermes

`PrediHermes` is an npm installer/ops package that makes the PrediHermes Hermes skill easy to deploy in fresh environments.

After install, agents can immediately run deterministic setup commands (`doctor`, `install-hermes`, optional `bootstrap-companions`) and follow a concise guide.

## Install

```bash
npm i -g predihermes
```

or without global install:

```bash
npx predihermes guide
```

## CLI

Preferred command names:

```bash
predihermes-installer guide
predihermes-installer doctor
predihermes-installer install-hermes
predihermes-installer bootstrap-companions
predihermes-installer verify-companions
predihermes-installer publish-check
```

Compatibility aliases:

```bash
predihermes-skill <command>
predihermes <command>
```

## Command name collision note

Some environments already have a `predihermes` command pointing to the Python pipeline wrapper.
If that happens, use either:

```bash
predihermes-installer <command>
```

or run from this repo:

```bash
npm run publish:check
node ./bin/predihermes-skill.js <command>
```

## What it installs

### Hermes skill

Installs skill files from:
- `https://github.com/nativ3ai/hermes-geopolitical-market-sim`

Into Hermes path:
- `~/.hermes/skills/research/geopolitical-market-sim`

Override Hermes home if needed:

```bash
export HERMES_HOME=/custom/path/.hermes
```

### Optional companion repos

`bootstrap-companions` can clone:
- `https://github.com/nativ3ai/worldosint-headless.git`
- `https://github.com/nativ3ai/MiroFish.git`

Default destination:
- `~/predihermes/companions`

## End-to-end setup for Hermes

1. Check compatibility.

```bash
predihermes-installer doctor
```

2. Install PrediHermes skill.

```bash
predihermes-installer install-hermes
```

3. Optional: clone WorldOSINT + MiroFish companions.

```bash
predihermes-installer bootstrap-companions
predihermes-installer verify-companions
```

4. Add required keys in your Hermes runtime environment.

```bash
XAI_API_KEY=...
ZEP_API_KEY=...
OPENAI_API_KEY=...  # optional but recommended
```

5. Validate skill script and command catalog.

```bash
python3 ~/.hermes/skills/research/geopolitical-market-sim/scripts/geopolitical_market_pipeline.py --help
python3 ~/.hermes/skills/research/geopolitical-market-sim/scripts/geopolitical_market_pipeline.py command-catalog --json
```

6. If you cloned companions, start them.

WorldOSINT websocket:

```bash
cd ~/predihermes/companions/worldosint
npm install
npm run headless:ws -- --base http://127.0.0.1:3000 --port 8787 --interval 60000 --allow-local 1
```

MiroFish backend:

```bash
cd ~/predihermes/companions/MiroFish/backend
pip install -r requirements.txt
python3 app.py
```

## Natural Hermes commands users can issue after install

- `Use PrediHermes list-worldosint-modules and propose modules for Hormuz shipping risk.`
- `Use PrediHermes update-topic hormuz-watch and add military_naval and maritime_snapshot.`
- `Use PrediHermes plan-tracked hormuz-watch and confirm feed quality before sim.`
- `Use PrediHermes run-tracked hormuz-watch in manual mode with 36 rounds and 60 agents.`

## Requirements

- Node.js >= 18
- npm
- python3
- git
- Hermes runtime directory (usually `~/.hermes`)

Optional:
- ffmpeg (for teaser/video workflows)

## Security

- No API keys are bundled.
- No `.env` file with secrets is generated.
- Keep keys outside git-tracked repos.

## Publish notes

Before publishing to npm:

```bash
npm run publish:check
npm login
npm version patch
npm publish --access public
```
