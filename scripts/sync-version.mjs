import { readFile, writeFile } from "node:fs/promises";

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version ?? "")) {
  throw new Error(`无效版本号：${version ?? "<empty>"}`);
}

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const writeJson = async (path, value) => writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");

const pkg = await readJson("package.json");
const lock = await readJson("package-lock.json");
const manifest = await readJson("manifest.json");
const versions = await readJson("versions.json");

pkg.version = version;
manifest.version = version;
lock.version = version;
if (lock.packages?.[""]) lock.packages[""].version = version;
versions[version] = manifest.minAppVersion;

await Promise.all([
  writeJson("package.json", pkg),
  writeJson("package-lock.json", lock),
  writeJson("manifest.json", manifest),
  writeJson("versions.json", versions)
]);

console.log(`版本文件已同步为 ${version}`);
