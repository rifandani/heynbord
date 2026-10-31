/* oxlint-disable eslint/no-await-in-loop, react-doctor/async-await-in-loop -- the runner reads each asset once, expands GLB dependencies in order, polls one build server, and measures each configuration one at a time */
import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { gzipSync } from "node:zlib";

import { Schema } from "effect";

import { battleBudgetAssets } from "./battle-budget-assets";
import type { BudgetAsset } from "./battle-budget-assets";
import { parseBattleBudgetConfig } from "./battle-budget-config";
import type { BattleBudgetConfig } from "./battle-budget-config";
import { makePublishedAssetReader } from "./battle-budget-files";
import {
  additionalBattleChunks,
  ASSET_BUDGET,
  battleBudgetPasses,
  HERO_APPEARANCE_BUDGET,
  JAVASCRIPT_BUDGET,
} from "./battle-budget-graph";
import type { BudgetGraph } from "./battle-budget-graph";

const webRoot = path.resolve(import.meta.dirname, "..");
const repoRoot = path.resolve(webRoot, "../..");
const publicRoot = path.join(webRoot, ".output/public");
const sha256 = (bytes: Uint8Array | string) =>
  createHash("sha256").update(bytes).digest("hex");

const readPublished = makePublishedAssetReader(publicRoot);

const ModelReferences = Schema.fromJsonString(
  Schema.Struct({
    buffers: Schema.optionalKey(
      Schema.Array(Schema.Struct({ uri: Schema.optionalKey(Schema.String) }))
    ),
    images: Schema.optionalKey(
      Schema.Array(
        Schema.Struct({
          uri: Schema.optionalKey(Schema.String),
          mimeType: Schema.optionalKey(Schema.String),
        })
      )
    ),
  })
);
const decodeModelReferences = Schema.decodeUnknownSync(ModelReferences);

/** Embedded data counts in the GLB. Include external files and texture decoders. */
const modelDependencies = (bytes: Buffer, url: string): readonly string[] => {
  if (
    bytes.byteLength < 20 ||
    bytes.toString("ascii", 0, 4) !== "glTF" ||
    bytes.readUInt32LE(4) !== 2 ||
    bytes.readUInt32LE(8) !== bytes.byteLength ||
    bytes.readUInt32LE(16) !== 0x4e_4f_53_4a
  ) {
    throw new Error(`Invalid published GLB: ${url}`);
  }
  const length = bytes.readUInt32LE(12);
  if (length > bytes.byteLength - 20) {
    throw new Error(`Invalid published GLB JSON length: ${url}`);
  }
  const json = decodeModelReferences(bytes.toString("utf-8", 20, 20 + length));
  const references = [...(json.buffers ?? []), ...(json.images ?? [])].flatMap(
    ({ uri }) => {
      if (!uri || uri.startsWith("data:")) {
        return [];
      }
      const resolved = new URL(uri, `http://budget.local${url}`);
      if (resolved.origin !== "http://budget.local") {
        throw new Error(`Uncounted external model asset: ${resolved.href}`);
      }
      return [resolved.pathname];
    }
  );
  if (
    json.images?.some(
      (image) => image.mimeType === "image/ktx2" || image.uri?.endsWith(".ktx2")
    )
  ) {
    references.push(
      "/decoders/basis/basis_transcoder.js",
      "/decoders/basis/basis_transcoder.wasm"
    );
  }
  return references;
};

const measuredAssets = async (config: BattleBudgetConfig) => {
  const listed = battleBudgetAssets(config);
  const stingFiles = await Promise.all(
    listed.stings.map(async (url) => {
      const bytes = await readPublished(url);
      return { url, bytes: bytes.byteLength };
    })
  );
  const [largest] = stingFiles.toSorted((a, b) => b.bytes - a.bytes);
  if (!largest) {
    throw new Error("No result stings were configured.");
  }
  const pending: BudgetAsset[] = [
    ...listed.files,
    { url: largest.url, category: "larger result sting" },
  ];
  const seen = new Set<string>();
  const files = [];
  for (const asset of pending) {
    if (seen.has(asset.url)) {
      continue;
    }
    seen.add(asset.url);
    const bytes = await readPublished(asset.url);
    files.push({ ...asset, bytes: bytes.byteLength, sha256: sha256(bytes) });
    if (asset.url.endsWith(".glb")) {
      pending.push(
        ...modelDependencies(bytes, asset.url).map((url) => ({
          url,
          category: asset.category,
        }))
      );
    }
  }
  // Shared decoder and texture files still count against the Hero ceiling.
  const heroUrls = new Set(listed.heroAssets);
  let heroBytes = 0;
  for (const url of heroUrls) {
    const bytes = await readPublished(url);
    heroBytes += bytes.byteLength;
    if (url.endsWith(".glb")) {
      for (const dependency of modelDependencies(bytes, url)) {
        heroUrls.add(dependency);
      }
    }
  }
  if (heroBytes > HERO_APPEARANCE_BUDGET) {
    throw new Error(
      `Hero appearance exceeds its separate ${HERO_APPEARANCE_BUDGET}-byte ceiling: ${heroBytes}`
    );
  }
  return {
    files: files.toSorted((a, b) => a.url.localeCompare(b.url)),
    models: listed.models,
    stings: stingFiles,
    heroBytes,
    total: files.reduce((total, file) => total + file.bytes, 0),
  };
};

const availablePort = async (): Promise<number> => {
  const server = createServer();
  const listening = once(server, "listening");
  server.listen(0, "127.0.0.1");
  await listening;
  // SAFETY: listening on an IP address gives AddressInfo, never a pipe name.
  const address = server.address() as AddressInfo;
  const closed = once(server, "close");
  server.close();
  await closed;
  return address.port;
};

const playHtml = async (): Promise<string> => {
  const port = await availablePort();
  const server = spawn("node", [".output/server/index.mjs"], {
    cwd: webRoot,
    env: { ...process.env, NITRO_HOST: "127.0.0.1", NITRO_PORT: String(port) },
    stdio: ["ignore", "ignore", "inherit"],
  });
  try {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (server.exitCode !== null) {
        throw new Error(`Production server exited with ${server.exitCode}.`);
      }
      try {
        const response = await fetch(`http://127.0.0.1:${port}/play`, {
          signal: AbortSignal.timeout(1000),
        });
        if (response.ok) {
          return await response.text();
        }
      } catch {
        // The server is still starting.
      }
      await delay(100);
    }
    throw new Error("The production /play page did not become ready.");
  } finally {
    server.kill("SIGTERM");
  }
};

const argumentsOf = (args: readonly string[]) => {
  const configs: string[] = [];
  let report = "artifacts/battle-budget.json";
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    const value = args[index + 1];
    if (!value || (flag !== "--config" && flag !== "--report")) {
      throw new Error(
        "Usage: bun web measure:battle-budget --config <file> [--config <file>] [--report <file>]"
      );
    }
    if (flag === "--config") {
      configs.push(value);
    } else {
      report = value;
    }
    index += 1;
  }
  if (configs.length === 0) {
    throw new Error("At least one explicit --config file is required.");
  }
  return { configs, report };
};

const main = async () => {
  const args = argumentsOf(process.argv.slice(2));
  const configs = await Promise.all(
    args.configs.map(async (file) =>
      parseBattleBudgetConfig(
        JSON.parse(await readFile(path.resolve(repoRoot, file), "utf-8"))
      )
    )
  );
  const commit = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: repoRoot,
    encoding: "utf-8",
  }).trim();
  const dirty = execFileSync("git", ["status", "--short"], {
    cwd: repoRoot,
    encoding: "utf-8",
  }).trim();
  // A clean output prevents stale compression sidecars and graph data.
  await rm(path.join(webRoot, ".output"), { recursive: true, force: true });
  execFileSync("bun", ["run", "build"], { cwd: webRoot, stdio: "inherit" });
  const [html, graphBytes, configurationBytes] = await Promise.all([
    playHtml(),
    readFile(path.join(publicRoot, "battle-build-graph.json"), "utf-8"),
    readFile(path.join(publicRoot, "battle-build-configuration.json"), "utf-8"),
  ]);
  // SAFETY: the Vite plugin writes this file in this process build, and every
  // consumer below rejects a missing chunk with a named error.
  const graph = JSON.parse(graphBytes) as BudgetGraph;
  const results = [];
  for (const config of configs) {
    const assets = await measuredAssets(config);
    const scriptUrls = new Set([
      ...additionalBattleChunks(graph, html, config.features.heroModel).map(
        (file) => `/${file}`
      ),
      ...assets.files.flatMap((file) =>
        file.url.endsWith(".js") ? [file.url] : []
      ),
    ]);
    const javascript = await Promise.all(
      [...scriptUrls].toSorted().map(async (url) => {
        const source = await readPublished(url);
        return {
          url,
          bytes: source.byteLength,
          gzip: gzipSync(source, { level: 9 }).byteLength,
          sha256: sha256(source),
        };
      })
    );
    const gzip = javascript.reduce((total, file) => total + file.gzip, 0);
    results.push({
      config,
      assets,
      javascript: { files: javascript, gzip },
      pass: battleBudgetPasses(assets.total, gzip),
    });
  }
  const rules = [
    "Decimal bytes. Assets < 50,000,000 published bytes before HTTP compression; warm cache gives no credit.",
    "Both Decks, each start Unit, possible Tokens and Boss Rule summons, selected appearance/cosmetics, original card art, every Unit Model, painting, FX and music; shared URLs count once.",
    "Read both result stings and count only the larger one. Missing required assets fail.",
    "JavaScript < 5,000,000 bytes, gzip level 9, once per distinct emitted chunk. Exclude the initial /play static graph from this same build; stop at loaded chunks before following Battle lazy edges.",
    "Meshopt decoder JavaScript is embedded in the loader chunks. Current vertex-colored Unit GLBs need no external texture decoder assets. External model images/buffers count when present.",
    "Hero models are controlled by the explicit feature input; the separate appearance ceiling is at most 10,000,000 bytes. Production activation uses VITE_HERO_MODELS=1; the preview flag is for local review.",
  ];
  const record = {
    measuredAt: new Date().toISOString(),
    commit,
    dirty: dirty.length > 0,
    workingTree: dirty.split("\n").filter(Boolean),
    build: "bun web build (Vite production / Nitro node-server)",
    buildConfiguration: Schema.decodeUnknownSync(
      Schema.fromJsonString(
        Schema.Struct({
          mode: Schema.String,
          base: Schema.String,
          e2e: Schema.String,
          heroModels: Schema.String,
          heroModelPreview: Schema.String,
        })
      )
    )(configurationBytes),
    node: process.version,
    bun: execFileSync("bun", ["--version"], { encoding: "utf-8" }).trim(),
    buildGraphSha256: sha256(graphBytes),
    playHtmlSha256: sha256(html),
    rules,
    results,
  };
  const output = path.resolve(repoRoot, args.report);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(record, null, 2)}\n`);
  console.log(`\n${rules.join("\n")}\n`);
  console.log(
    "| Configuration | Stage | Asset bytes | Additional gzip JS bytes | Result |\n| --- | --- | ---: | ---: | --- |"
  );
  for (const result of results) {
    console.log(
      `| ${result.config.id} | ${result.config.stageId} | ${result.assets.total} | ${result.javascript.gzip} | ${result.pass ? "PASS" : "FAIL"} |`
    );
  }
  console.log(
    `\nCommit: ${commit}; dirty: ${record.dirty}; report: ${output}\nLimits: assets < ${ASSET_BUDGET}; JavaScript < ${JAVASCRIPT_BUDGET}.`
  );
  if (results.some((result) => !result.pass)) {
    process.exitCode = 1;
  }
};

await main();
