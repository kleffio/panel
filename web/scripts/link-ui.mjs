#!/usr/bin/env node
// Syncs packages/ui/src into the GitHub-installed @kleffio/ui so that
// components added locally (but not yet published) are visible to TypeScript
// and the local dev server.
//
// Skips silently when packages/ui doesn't exist (e.g. inside a Docker build
// where only the panel directory is in the build context). In Docker, the
// docker-compose bind mount handles this at runtime instead.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const srcRoot = path.resolve(__dirname, "../../packages/ui/src");
const dstRoot = path.resolve(__dirname, "../node_modules/@kleffio/ui/src");

if (!fs.existsSync(srcRoot) || !fs.existsSync(dstRoot)) {
  process.exit(0);
}

function syncDir(src, dst) {
  let count = 0;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(dstPath, { recursive: true });
      count += syncDir(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
      count++;
    }
  }
  return count;
}

const count = syncDir(srcRoot, dstRoot);
console.log(`[@kleffio/ui] synced ${count} file(s) from packages/ui`);
