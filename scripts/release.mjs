import { cp, mkdir, rm } from "node:fs/promises";
const out = "release/mindmap-studio";
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const file of ["main.js", "manifest.json", "styles.css"]) await cp(file, `${out}/${file}`);
console.log(`Release files copied to ${out}`);
