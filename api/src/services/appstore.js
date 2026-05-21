import { readFile, writeFile, mkdir, access } from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Docker from 'dockerode';

const exec = promisify(execFile);
const __dir = dirname(fileURLToPath(import.meta.url));

const CATALOG_PATH   = join(__dir, '../catalog/apps.json');
const INSTALLS_PATH  = join(__dir, '../data/installs.json');
const STACKS_DIR     = join(__dir, '../stacks');
const docker         = new Docker({ socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock' });

// ─── LOAD CATALOG ────────────────────────────────────────────────────────────
export async function loadCatalog() {
  const raw = await readFile(CATALOG_PATH, 'utf8');
  return JSON.parse(raw);
}

// ─── INSTALLED APPS (persisted as JSON) ─────────────────────────────────────
async function loadInstalls() {
  try {
    await access(INSTALLS_PATH);
    return JSON.parse(await readFile(INSTALLS_PATH, 'utf8'));
  } catch {
    return {};
  }
}

async function saveInstalls(installs) {
  await mkdir(dirname(INSTALLS_PATH), { recursive: true });
  await writeFile(INSTALLS_PATH, JSON.stringify(installs, null, 2));
}

// ─── LIST APPS ───────────────────────────────────────────────────────────────
export async function listApps({ category, search, sort } = {}) {
  const catalog   = await loadCatalog();
  const installs  = await loadInstalls();

  let apps = catalog.apps.map(app => ({
    ...app,
    installed: !!installs[app.id],
    installed_at: installs[app.id]?.installed_at ?? null,
    container_id: installs[app.id]?.container_id ?? null,
    running: installs[app.id]?.running ?? false,
  }));

  if (category && category !== 'all') {
    apps = apps.filter(a => a.category === category);
  }

  if (search) {
    const q = search.toLowerCase();
    apps = apps.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.tagline.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.tags.some(t => t.includes(q))
    );
  }

  if (sort === 'installs') apps.sort((a, b) => b.installs - a.installs);
  else if (sort === 'stars') apps.sort((a, b) => b.stars - a.stars);
  else if (sort === 'name') apps.sort((a, b) => a.name.localeCompare(b.name));

  return { apps, categories: catalog.categories, total: apps.length };
}

// ─── GET SINGLE APP ──────────────────────────────────────────────────────────
export async function getApp(id) {
  const catalog  = await loadCatalog();
  const installs = await loadInstalls();
  const app = catalog.apps.find(a => a.id === id);
  if (!app) return null;

  return {
    ...app,
    installed:    !!installs[id],
    installed_at: installs[id]?.installed_at ?? null,
    container_id: installs[id]?.container_id ?? null,
    running:      installs[id]?.running ?? false,
  };
}

// ─── DEPLOY APP (Docker Compose) ─────────────────────────────────────────────
export async function deployApp(id, envOverrides = {}) {
  const catalog = await loadCatalog();
  const app = catalog.apps.find(a => a.id === id);
  if (!app) throw new Error(`App '${id}' not found in catalog`);

  // Build compose YAML with any env overrides applied
  let compose = app.compose;
  for (const [key, value] of Object.entries(envOverrides)) {
    // Simple substitution: replace 'KEY=defaultvalue' with 'KEY=newvalue'
    const envRegex = new RegExp(`(- ${key}=)[^\\n]+`, 'g');
    compose = compose.replace(envRegex, `$1${value}`);
  }

  // Write compose file to stacks directory
  const stackDir = join(STACKS_DIR, id);
  await mkdir(stackDir, { recursive: true });
  const composePath = join(stackDir, 'docker-compose.yml');
  await writeFile(composePath, compose, 'utf8');

  // Run docker compose up -d
  try {
    const { stdout, stderr } = await exec('docker', [
      'compose', '-f', composePath, 'up', '-d', '--pull', 'always',
    ]);

    // Record installation
    const installs = await loadInstalls();
    installs[id] = {
      installed_at: new Date().toISOString(),
      compose_path: composePath,
      running: true,
      container_id: null, // populated on status refresh
    };
    await saveInstalls(installs);

    return { ok: true, id, stdout: stdout.trim(), stderr: stderr.trim() };
  } catch (err) {
    throw new Error(`docker compose up failed: ${err.message}`);
  }
}

// ─── STOP APP ────────────────────────────────────────────────────────────────
export async function stopApp(id) {
  const installs = await loadInstalls();
  const install = installs[id];
  if (!install) throw new Error(`App '${id}' is not installed`);

  const { stdout } = await exec('docker', [
    'compose', '-f', install.compose_path, 'stop',
  ]);

  installs[id].running = false;
  await saveInstalls(installs);
  return { ok: true, id, stdout: stdout.trim() };
}

// ─── REMOVE APP ──────────────────────────────────────────────────────────────
export async function removeApp(id, removeVolumes = false) {
  const installs = await loadInstalls();
  const install  = installs[id];
  if (!install) throw new Error(`App '${id}' is not installed`);

  const args = ['compose', '-f', install.compose_path, 'down'];
  if (removeVolumes) args.push('--volumes');

  await exec('docker', args);

  delete installs[id];
  await saveInstalls(installs);
  return { ok: true, id, volumes_removed: removeVolumes };
}

// ─── APP STATUS ──────────────────────────────────────────────────────────────
export async function getAppStatus(id) {
  const installs = await loadInstalls();
  if (!installs[id]) return { id, installed: false };

  try {
    const containers = await docker.listContainers({ all: true });
    const related = containers.filter(c =>
      c.Names.some(n => n.replace(/^\//, '').startsWith(id.replace(/-/g, '')))
    );
    const running = related.filter(c => c.State === 'running').length;

    return {
      id,
      installed:    true,
      installed_at: installs[id].installed_at,
      containers:   related.length,
      running,
    };
  } catch {
    return { id, installed: true, installed_at: installs[id].installed_at, containers: 0, running: 0 };
  }
}

// ─── INSTALLED APPS LIST ─────────────────────────────────────────────────────
export async function listInstalledApps() {
  const catalog  = await loadCatalog();
  const installs = await loadInstalls();
  return catalog.apps
    .filter(a => installs[a.id])
    .map(a => ({ ...a, installed: true, installed_at: installs[a.id].installed_at, running: installs[a.id].running }));
}
