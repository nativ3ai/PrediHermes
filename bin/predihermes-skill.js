#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const REPO_URL = 'https://github.com/nativ3ai/hermes-geopolitical-market-sim.git';
const SKILL_SUBPATH = 'skill/geopolitical-market-sim';
const DEFAULT_WORLDOSINT_URL = 'https://github.com/nativ3ai/worldosint-headless.git';
const DEFAULT_MIROFISH_URL = 'https://github.com/nativ3ai/MiroFish.git';
const hermesHome = process.env.HERMES_HOME || path.join(os.homedir(), '.hermes');
const targetSkillDir = path.join(hermesHome, 'skills', 'research', 'geopolitical-market-sim');
const defaultCompanionDir = path.join(os.homedir(), 'predihermes', 'companions');

function run(cmd, opts = {}) {
  return execSync(cmd, { stdio: 'pipe', encoding: 'utf8', ...opts }).trim();
}

function hasCmd(cmd) {
  try {
    run(`command -v ${cmd}`);
    return true;
  } catch {
    return false;
  }
}

function print(msg = '') {
  process.stdout.write(`${msg}\n`);
}

function usage() {
  print('PrediHermes Installer CLI');
  print('');
  print('Usage:');
  print('  predihermes guide [--short]');
  print('  predihermes doctor');
  print('  predihermes install-hermes [--repo <url>] [--force]');
  print('  predihermes bootstrap-companions [--dir <path>] [--force]');
  print('  predihermes verify-companions [--dir <path>]');
  print('  predihermes publish-check');
  print('  predihermes uninstall-hermes');
}

function parseValue(args, flag, fallback = '') {
  const idx = args.indexOf(flag);
  if (idx === -1) return fallback;
  return args[idx + 1] || fallback;
}

function guide(short = false) {
  if (short) {
    print('[PrediHermes] run: predihermes doctor && predihermes install-hermes');
    print('[PrediHermes] optional: predihermes bootstrap-companions');
    print(`[PrediHermes] skill path: ${targetSkillDir}`);
    return;
  }
  print('PrediHermes quickstart');
  print('1) Check environment: predihermes doctor');
  print('2) Install Hermes skill: predihermes install-hermes');
  print('3) Optional companion repos: predihermes bootstrap-companions');
  print('4) Set keys in Hermes runtime: XAI_API_KEY, ZEP_API_KEY, OPENAI_API_KEY (optional)');
  print('5) Validate skill script: python3 ~/.hermes/skills/research/geopolitical-market-sim/scripts/geopolitical_market_pipeline.py --help');
}

function doctor() {
  const required = [
    ['node', hasCmd('node')],
    ['npm', hasCmd('npm')],
    ['python3', hasCmd('python3')],
    ['git', hasCmd('git')],
  ];
  const optional = [
    ['ffmpeg (optional teaser rendering)', hasCmd('ffmpeg')],
  ];

  print('PrediHermes doctor');
  required.forEach(([name, ok]) => print(`${ok ? 'OK  ' : 'MISS'} ${name}`));
  optional.forEach(([name, ok]) => print(`${ok ? 'OK  ' : 'WARN'} ${name}`));

  const hermesExists = fs.existsSync(hermesHome);
  const skillExists = fs.existsSync(targetSkillDir);
  print(`${hermesExists ? 'OK  ' : 'WARN'} hermes_home ${hermesHome}`);
  print(`${skillExists ? 'OK  ' : 'INFO'} skill_path ${targetSkillDir}`);

  const requiredMissing = required.filter(([, ok]) => !ok).map(([name]) => name);
  if (requiredMissing.length > 0) {
    print('');
    print(`Missing required tools: ${requiredMissing.join(', ')}`);
    process.exitCode = 1;
    return;
  }

  print('');
  print('Doctor finished. Next: predihermes install-hermes');
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const item of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, item.name);
    const d = path.join(dst, item.name);
    if (item.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function installHermes(repoUrl = REPO_URL, force = false) {
  if (!hasCmd('git')) {
    print('git is required. Run predihermes doctor for details.');
    process.exit(1);
  }

  if (fs.existsSync(targetSkillDir)) {
    if (!force) {
      print(`Skill already exists at ${targetSkillDir}`);
      print('Use --force to overwrite.');
      return;
    }
    fs.rmSync(targetSkillDir, { recursive: true, force: true });
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'predihermes-skill-'));
  try {
    run(`git clone --depth 1 ${repoUrl} ${tmp}`);
    const src = path.join(tmp, SKILL_SUBPATH);
    if (!fs.existsSync(src)) {
      throw new Error(`Skill path not found in repo: ${SKILL_SUBPATH}`);
    }
    fs.mkdirSync(path.dirname(targetSkillDir), { recursive: true });
    copyDir(src, targetSkillDir);

    print('Installed PrediHermes skill for Hermes');
    print(`Source repo: ${repoUrl}`);
    print(`Target path: ${targetSkillDir}`);
    print('Next: predihermes guide');
  } catch (err) {
    print(`Install failed: ${err.message}`);
    process.exitCode = 1;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function cloneRepo(name, url, baseDir, force = false) {
  const dst = path.join(baseDir, name);
  if (fs.existsSync(dst)) {
    if (!force) {
      print(`SKIP ${name}: already exists at ${dst}`);
      print('Use --force to replace existing companion repos.');
      return;
    }
    fs.rmSync(dst, { recursive: true, force: true });
  }
  run(`git clone --depth 1 ${url} ${dst}`);
  print(`OK   ${name}: ${dst}`);
}

function bootstrapCompanions(args) {
  if (!hasCmd('git')) {
    print('git is required. Run predihermes doctor for details.');
    process.exit(1);
  }
  const baseDir = path.resolve(parseValue(args, '--dir', defaultCompanionDir));
  const worldosintUrl = parseValue(args, '--worldosint-url', DEFAULT_WORLDOSINT_URL);
  const mirofishUrl = parseValue(args, '--mirofish-url', DEFAULT_MIROFISH_URL);
  const force = args.includes('--force');
  fs.mkdirSync(baseDir, { recursive: true });

  try {
    cloneRepo('worldosint', worldosintUrl, baseDir, force);
    cloneRepo('MiroFish', mirofishUrl, baseDir, force);
    print('');
    print(`Companions ready in ${baseDir}`);
    print('WorldOSINT websocket sample:');
    print('  cd <base>/worldosint && npm install && npm run headless:ws -- --base http://127.0.0.1:3000 --port 8787 --interval 60000 --allow-local 1');
    print('MiroFish backend sample:');
    print('  cd <base>/MiroFish/backend && pip install -r requirements.txt && python3 app.py');
  } catch (err) {
    print(`Companion bootstrap failed: ${err.message}`);
    process.exitCode = 1;
  }
}

function verifyCompanions(args) {
  const baseDir = path.resolve(parseValue(args, '--dir', defaultCompanionDir));
  const worldosintDir = path.join(baseDir, 'worldosint');
  const mirofishDir = path.join(baseDir, 'MiroFish');
  const worldosintOk = fs.existsSync(path.join(worldosintDir, 'package.json'));
  const mirofishOk = fs.existsSync(path.join(mirofishDir, 'backend'));

  print(`Companion path: ${baseDir}`);
  print(`${worldosintOk ? 'OK  ' : 'MISS'} worldosint repo`);
  print(`${mirofishOk ? 'OK  ' : 'MISS'} MiroFish repo`);
  if (!worldosintOk || !mirofishOk) {
    print('Run: predihermes bootstrap-companions');
    process.exitCode = 1;
  }
}

function publishCheck() {
  try {
    const out = run('npm pack --dry-run', { cwd: process.cwd() });
    print(out);
    print('');
    print('Publish check passed. Next: npm version <patch|minor|major> && npm publish --access public');
  } catch (err) {
    print(`Publish check failed: ${err.message}`);
    process.exitCode = 1;
  }
}

function uninstallHermes() {
  if (!fs.existsSync(targetSkillDir)) {
    print(`No skill found at ${targetSkillDir}`);
    return;
  }
  fs.rmSync(targetSkillDir, { recursive: true, force: true });
  print(`Removed skill: ${targetSkillDir}`);
}

const args = process.argv.slice(2);
const cmd = args[0];

if (!cmd || cmd === '-h' || cmd === '--help') {
  usage();
  process.exit(0);
}

if (cmd === 'guide') {
  guide(args.includes('--short'));
} else if (cmd === 'doctor') {
  doctor();
} else if (cmd === 'install-hermes') {
  const repoUrl = parseValue(args, '--repo', REPO_URL);
  const force = args.includes('--force');
  installHermes(repoUrl, force);
} else if (cmd === 'bootstrap-companions') {
  bootstrapCompanions(args);
} else if (cmd === 'verify-companions') {
  verifyCompanions(args);
} else if (cmd === 'publish-check') {
  publishCheck();
} else if (cmd === 'uninstall-hermes') {
  uninstallHermes();
} else {
  usage();
  process.exit(1);
}
