import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { loadTypeScriptModule } from "./compile-typescript.mjs";

let filterModule;
let cleanup;

before(async () => {
  const loaded = await loadTypeScriptModule("src/file-explorer-filter.ts");
  filterModule = loaded.module;
  cleanup = loaded.cleanup;
});

after(async () => cleanup?.());

test("normalizeHiddenFolderPaths normalizes basic folder paths", () => {
  const result = filterModule.normalizeHiddenFolderPaths("folder1, folder2; folder3\nfolder4");
  assert.deepEqual(result, ["folder1", "folder2", "folder3", "folder4"]);
});

test("normalizeHiddenFolderPaths handles mixed separators", () => {
  const result = filterModule.normalizeHiddenFolderPaths("folder1/sub\\folder2, folder3\\sub/folder4");
  assert.deepEqual(result, ["folder1/sub/folder2", "folder3/sub/folder4"]);
});

test("normalizeHiddenFolderPaths handles consecutive separators", () => {
  const result = filterModule.normalizeHiddenFolderPaths("folder1,,folder2;;;\nfolder3");
  assert.deepEqual(result, ["folder1", "folder2", "folder3"]);
});

test("normalizeHiddenFolderPaths handles excessive and leading/trailing slashes", () => {
  const result = filterModule.normalizeHiddenFolderPaths("///folder1///, \\\\folder2\\\\");
  assert.deepEqual(result, ["folder1", "folder2"]);
});

test("normalizeHiddenFolderPaths filters out whitespace-only entries and duplicates", () => {
  const result = filterModule.normalizeHiddenFolderPaths("folder1,   , \t, folder2, folder1");
  assert.deepEqual(result, ["folder1", "folder2"]);
});

test("normalizeHiddenFileExtensions normalizes and filters file extensions", () => {
  const result = filterModule.normalizeHiddenFileExtensions(".md, JPG; png\n .txt,,  txt , \t, .invalid_extension_name_that_is_very_long");
  assert.deepEqual(result, ["md", "jpg", "png", "txt"]);
});

test("normalizeHiddenFileExtensions formatting cleanup", () => {
  const result = filterModule.normalizeHiddenFileExtensions(" ,.Jpg; PnG");
  assert.deepEqual(result, ["jpg", "png"]);
});

test("normalizeHiddenFileExtensions handles deduplication and mixed case", () => {
  const result = filterModule.normalizeHiddenFileExtensions(".md, MD, md, .Md");
  assert.deepEqual(result, ["md"]);
});

test("normalizeHiddenFileExtensions handles multiple leading dots", () => {
  const result = filterModule.normalizeHiddenFileExtensions("..tar, ...txt");
  assert.deepEqual(result, ["tar", "txt"]);
});

test("normalizeHiddenFileExtensions ignores invalid patterns and empty strings", () => {
  const result = filterModule.normalizeHiddenFileExtensions("*.png, ?, .a#b, ,  ");
  assert.deepEqual(result, []);
});

test("normalizeHiddenFileExtensions rejects extensions that are too long", () => {
  const result = filterModule.normalizeHiddenFileExtensions("a".repeat(33)); // 33 characters (limit is 32)
  assert.deepEqual(result, []);
});

test("shouldHideFileExplorerPath handles hiding the asset folder", () => {
  const settings = {
    assetFolder: "my/assets/folder",
    hideAssetFolderInFileExplorer: true,
    hideConfiguredFilesInFileExplorer: false,
    hiddenFileExtensions: "",
    hiddenFileFolders: ""
  };

  assert.equal(filterModule.shouldHideFileExplorerPath("some/path/folder/file.md", settings), true);
  assert.equal(filterModule.shouldHideFileExplorerPath("some/path/other/file.md", settings), false);

  // Test when hideAssetFolderInFileExplorer is false
  const settingsFalse = { ...settings, hideAssetFolderInFileExplorer: false };
  assert.equal(filterModule.shouldHideFileExplorerPath("some/path/folder/file.md", settingsFalse), false);
});

test("shouldHideFileExplorerPath handles configured file extensions", () => {
  const settings = {
    assetFolder: "assets",
    hideAssetFolderInFileExplorer: false,
    hideConfiguredFilesInFileExplorer: true,
    hiddenFileExtensions: "md, pdf",
    hiddenFileFolders: ""
  };

  assert.equal(filterModule.shouldHideFileExplorerPath("file.md", settings), true);
  assert.equal(filterModule.shouldHideFileExplorerPath("folder/file.PDF", settings), true);
  assert.equal(filterModule.shouldHideFileExplorerPath("file.txt", settings), false);
});

test("shouldHideFileExplorerPath handles configured hidden folders", () => {
  const settings = {
    assetFolder: "assets",
    hideAssetFolderInFileExplorer: false,
    hideConfiguredFilesInFileExplorer: true,
    hiddenFileExtensions: "",
    hiddenFileFolders: "hidden, secret/folder"
  };

  assert.equal(filterModule.shouldHideFileExplorerPath("hidden/file.md", settings), true);
  assert.equal(filterModule.shouldHideFileExplorerPath("some/hidden/file.md", settings), true); // matches segment

  assert.equal(filterModule.shouldHideFileExplorerPath("secret/folder", settings), true);
  assert.equal(filterModule.shouldHideFileExplorerPath("secret/folder/file.md", settings), true);
  assert.equal(filterModule.shouldHideFileExplorerPath("other/secret/folder/file.md", settings), false); // specific path does not start with or equal
});
