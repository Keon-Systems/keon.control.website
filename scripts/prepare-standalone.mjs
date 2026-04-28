import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const standaloneDir = ".next/standalone";
const nextDirInStandalone = join(standaloneDir, ".next");
const staticSource = ".next/static";
const staticTarget = join(nextDirInStandalone, "static");
const publicSource = "public";
const publicTarget = join(standaloneDir, "public");

if (!existsSync(standaloneDir)) {
  throw new Error("Standalone build output was not found at .next/standalone");
}

mkdirSync(nextDirInStandalone, { recursive: true });

if (existsSync(staticSource)) {
  cpSync(staticSource, staticTarget, { recursive: true });
}

if (existsSync(publicSource)) {
  cpSync(publicSource, publicTarget, { recursive: true });
}

console.log("Prepared standalone assets for Azure Static Web Apps.");