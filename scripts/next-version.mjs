import { pathToFileURL } from "node:url";

/**
 * Increments a release version using a single decimal patch digit.
 * For example, 1.6.8 -> 1.6.9 and 1.6.9 -> 1.7.0.
 *
 * @param {string} version Current semantic version.
 * @returns {string} Next release version.
 */
export function nextVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version ?? "");
  if (!match) throw new Error(`无效版本号：${version ?? "<empty>"}`);
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);
  return patch >= 9
    ? `${major}.${minor + 1}.0`
    : `${major}.${minor}.${patch + 1}`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(nextVersion(process.argv[2]));
}
