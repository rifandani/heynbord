#!/usr/bin/env bun
/**
 * Run pwa-check against the production build of `apps/web`.
 *
 * Usage:
 *   bun web build
 *   bun check:pwa
 *
 * Set `PWA_CHECK_URL` to check an already-running app instead, for example a
 * deployment. Set `PWA_CHECK_PORT` when the default port is not free. The
 * check fails on warnings as well as failures, so a new gap blocks CI.
 */
import type { ChildProcess } from "node:child_process";
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const WEB_DIR = path.join(REPO_ROOT, "apps", "web");
const SERVER_ENTRY = path.join(WEB_DIR, ".output", "server", "index.mjs");
const PWA_CHECK = path.join(REPO_ROOT, "node_modules", ".bin", "pwa-check");
const DEFAULT_PORT = 4173;
const START_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 250;

const fail: (message: string) => never = (message) => {
  console.error(`pwa: ${message}`);
  process.exit(1);
};

/** Run the check and return its exit code. Warnings fail the run. */
const runCheck = (url: string): number => {
  const result = spawnSync(
    PWA_CHECK,
    ["--fail-on-warn", "--issues-only", url],
    { stdio: "inherit" }
  );
  if (result.error) {
    throw result.error;
  }
  return result.status ?? 1;
};

const isUp = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
};

/** Poll until the built server answers, and stop early if it exits. */
const waitForServer = async (
  url: string,
  server: ChildProcess,
  attempt = 0
): Promise<void> => {
  if (server.exitCode !== null) {
    throw new Error("the server exited before it answered");
  }
  if (attempt * POLL_INTERVAL_MS >= START_TIMEOUT_MS) {
    throw new Error(`the server did not answer at ${url}`);
  }
  if (await isUp(url)) {
    return;
  }
  await sleep(POLL_INTERVAL_MS);
  await waitForServer(url, server, attempt + 1);
};

/** Stop the server and wait for it to exit. */
const stop = async (server: ChildProcess): Promise<void> => {
  if (server.exitCode !== null) {
    return;
  }
  server.kill("SIGTERM");
  await sleep(1000);
  if (server.exitCode === null) {
    server.kill("SIGKILL");
    await sleep(250);
  }
};

const externalUrl = process.env.PWA_CHECK_URL;
if (!existsSync(PWA_CHECK)) {
  fail("pwa-check is not installed. Run `bun install` first.");
}
if (externalUrl) {
  try {
    process.exit(runCheck(externalUrl));
  } catch (error) {
    fail(error instanceof Error ? error.message : "unknown error");
  }
}

if (!existsSync(SERVER_ENTRY)) {
  fail("no production build. Run `bun web build` first.");
}

const port = Number(process.env.PWA_CHECK_PORT ?? DEFAULT_PORT);
if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
  fail(`PWA_CHECK_PORT is not a valid port: ${process.env.PWA_CHECK_PORT}`);
}

const url = `http://127.0.0.1:${port}`;
if (await isUp(url)) {
  fail(`port ${port} is already in use. Set PWA_CHECK_PORT to a free port.`);
}

const server = spawn("node", [SERVER_ENTRY], {
  cwd: WEB_DIR,
  env: { ...process.env, HOST: "127.0.0.1", PORT: String(port) },
  stdio: "ignore",
});
server.once("error", (error) => {
  fail(error.message);
});

let exitCode = 1;
try {
  await waitForServer(url, server);
  exitCode = runCheck(url);
} catch (error) {
  console.error(
    `pwa: ${error instanceof Error ? error.message : "unknown error"}`
  );
} finally {
  await stop(server);
}
process.exit(exitCode);
