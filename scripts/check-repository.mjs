import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const requiredFiles = [
  "README.md",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "docs/ARCHITECTURE.md",
  "docs/CODE_CLEANUP.zh-CN.md",
  "docs/DATA_MODEL.md",
  "docs/DEVELOPMENT.md",
  "docs/TESTING.md",
  "docs/GIT_WORKFLOW.zh-CN.md",
  "docs/GIT_DELIVERY.zh-CN.md",
  "docs/MAINTENANCE_GUIDE.zh-CN.md",
  "docs/PROJECT_GUIDE.zh-CN.md",
  "MODIFIED_FILES.md"
];
for (const file of requiredFiles) await access(file);

for (const transientPath of [".ua", ".local-test-build", "start-dashboard.bat"]) {
  await assert.rejects(access(transientPath), undefined, `${transientPath} is a local analysis artifact and must not be committed`);
}

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const packageLock = JSON.parse(await readFile("package-lock.json", "utf8"));
const manifest = JSON.parse(await readFile("manifest.json", "utf8"));
const versions = JSON.parse(await readFile("versions.json", "utf8"));
assert.equal(packageJson.version, manifest.version, "package.json and manifest.json versions must match");
assert.equal(packageLock.version, packageJson.version, "package-lock.json version must match package.json");
assert.equal(packageLock.packages?.[""]?.version, packageJson.version, "package-lock root version must match package.json");
assert.equal(versions[packageJson.version], manifest.minAppVersion, "versions.json must contain the current version");

for (const script of ["test:unit", "test:regression", "test:docs", "test:repo", "verify"]) {
  assert.equal(typeof packageJson.scripts?.[script], "string", `package.json must define ${script}`);
}

const readme = await readFile("README.md", "utf8");
assert.match(readme, /^# MindMap Studio for Obsidian/m);
assert.match(readme, /## 功能概览/);
assert.match(readme, /## 开发与验证/);
assert.ok(readme.includes(`当前源码版本：\`${packageJson.version}\`。`), "README source version must match package.json");
assert.doesNotMatch(readme, /^## \d+\.\d+\.\d+/m, "README must describe the current product instead of stacking release notes");

const gitignore = await readFile(".gitignore", "utf8");
for (const ignored of [".ua/", ".local-test-build/", "coverage/", "dist/"]) {
  assert.ok(gitignore.includes(ignored), `.gitignore must include ${ignored}`);
}

console.log(`Repository checks passed for MindMap Studio ${packageJson.version}.`);
