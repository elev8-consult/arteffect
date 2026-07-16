import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadSitemapEntries } from "../lib/cms/sitemap-fallback.ts";

const root = new URL("../", import.meta.url);
const execFileAsync = promisify(execFile);

test("Railway config builds and starts the migrated app", async () => {
  const config = await readFile(new URL("railway.toml", root), "utf8");
  assert.match(config, /buildCommand = "npm run build"/);
  assert.match(config, /NIXPACKS_NODE_VERSION = "20"/);
  assert.match(config, /startCommand = "npm run payload:migrate && npm run start"/);
  assert.match(config, /healthcheckPath = "\/api\/health"/);
  assert.match(config, /restartPolicyType = "ON_FAILURE"/);
});

test("the Railway migration command loads the Payload config under Node", async () => {
  const { stdout } = await execFileAsync(
    process.execPath,
    [fileURLToPath(new URL("node_modules/payload/bin.js", root)), "migrate", "--help"],
    { cwd: fileURLToPath(root) }
  );

  assert.match(stdout, /Available commands: migrate/);
});

test("sitemap CMS failures do not fail a pre-migration production build", async (context) => {
  const expectedError = new Error("relation does not exist");
  const errors = [];
  context.mock.method(console, "error", (...args) => errors.push(args));

  const entries = await loadSitemapEntries("products", async () => {
    throw expectedError;
  });

  assert.deepEqual(entries, []);
  assert.equal(errors.length, 1);
  assert.match(errors[0][0], /products sitemap read failed/);
  assert.equal(errors[0][1], expectedError);
});

test("checked-in env templates contain no real credentials", async () => {
  const example = await readFile(new URL(".env.example", root), "utf8");
  const testExample = await readFile(new URL(".env.test.example", root), "utf8");
  assert.match(example, /PAYLOAD_SECRET=replace-with-a-long-random-secret/);
  assert.match(testExample, /PAYLOAD_SECRET=test-only-secret/);
  assert.doesNotMatch(example, /sk_live|rk_live|-----BEGIN/);
  assert.doesNotMatch(testExample, /sk_live|rk_live|-----BEGIN/);
});
