# Changelog

## 0.9.0

- Renamed the plugin from **MindMap Canvas** to **MindMap Studio** to avoid confusion with Obsidian Canvas.
- Changed the plugin ID and install folder to `mindmap-studio`; added one-time migration of old `mindmap-canvas/data.json` settings.
- Upgraded the document data version to 7.
- Added ordered node content blocks for arbitrary text/image sequences.
- Added true pure-image nodes; the default “新节点” text can now be removed.
- Added multiple text blocks per node, each retaining range-based rich-text styles.
- Added multiple image blocks per node with independent source and alt text.
- Added move-up, move-down, and delete controls for every content block.
- Added full-size image preview with wheel zoom, zoom buttons, reset, and scrolling.
- Added local image selection inside the node editor.
- Added configurable generic image-host uploads using multipart or raw binary requests.
- Added custom request headers and configurable JSON response URL paths.
- Updated Markdown export, search, cloning, normalization, SVG preview, and layout sizing for mixed content blocks.
- Preserved compatibility with legacy `text`, `richText`, and `image` fields.

## 0.8.4

### Fixed

- Fixed the current-map appearance dialog layout for bold, italic, and underline controls. Each option now uses a compact, aligned checkbox card instead of inheriting full-width input styling.
- Fixed pasted images being written to the vault-root asset folder when the active mind map was stored in a nested directory.
- Image assets are now saved under `current map directory / configured asset folder /` and the stored node path points to that actual vault location.

### Changed

- Clarified in plugin settings that the configured resource folder is relative to each current mind map's directory.

## 0.8.3

### Changed

- Removed the redundant small accent-colored circular parent-return button from the toolbar.
- Redesigned parent-map navigation as a neutral breadcrumb-style rectangular control with a separate arrow icon tile and readable two-line label.
- Replaced accent/pink backgrounds with Obsidian neutral background and border variables for consistent light and dark theme appearance.
- Added clearer hover and keyboard-focus states without turning the control into an oversized button.

## 0.8.2

### Fixed

- Fixed the “返回父导图” text button being vertically compressed or partially clipped by some Obsidian themes and larger interface fonts.
- Added a reliable minimum height, natural line height, visible overflow, and vertically centered label layout to the parent-map navigation control.
- Improved the parent navigation button width and padding on narrow/mobile layouts.

## 0.8.1

### Changed

- Hid all autosave progress/status text from the node editor while retaining quiet autosaving.
- Replaced the text-color control's visible color swatch with a compact fixed-size “颜色” button and a thin colored underline indicator.
- Kept the color button dimensions compact without allowing the color indicator to expand the button.
- Simplified the rich-text help text so it focuses on selection and live preview rather than autosave messaging.

## 0.8.0

### Changed

- Changed the node editor to a persistent editing workflow: formatting and field changes autosave without closing the modal.
- Added explicit autosave status messages and kept the live formatted preview visible throughout editing.
- Renamed the primary action to “保存并关闭”; clicking it, pressing Escape, or clicking the backdrop flushes pending changes and closes the editor.
- Removed the strikethrough button from the common rich-text toolbar while retaining rendering compatibility for existing files.
- Replaced the node editor form element with a non-submitting container so formatting buttons cannot accidentally submit and close the modal.
- Coalesced a continuous autosave editing session into one undo-history snapshot.

### Fixed

- Fixed style changes unexpectedly saving and immediately closing the node editor.
- Fixed pending edits potentially being lost when the editor is dismissed through the backdrop.

## 0.7.0

### Fixed

- Replaced browser `execCommand` rich-text formatting with deterministic character-range formatting based on textarea selection offsets.
- Fixed selected-text formatting accidentally affecting the entire node.
- Stopped auto-selecting the complete node label when the editor opens; the caret now starts at the end.
- Added a live formatted text preview and explicit selected-character range indicator.
- Added a persistent, visible parent-map navigation bar in child maps.

### Changed

- Child maps are now stored under `parent directory / asset folder / parent map name / child name.mindmap` instead of being placed beside the parent file.
- Child-map documents now retain parent title and source-node text in addition to parent path and node ID.
- Child-map root nodes also store a Wiki link back to the parent map.
- Upgraded the document schema to version 6 while keeping older files readable.

## 0.6.0

### Added

- Added per-character rich-text runs inside node labels.
- Added selection-based bold, italic, underline, strikethrough, text color, and clear-format controls in the node editor.
- Added combined formatting so the same character range can be bold, underlined, and colored at once.
- Added rich-text persistence in `.mindmap` JSON, Markdown export, SVG export, and static embed previews.

### Changed

- Upgraded the document schema to version 5 while retaining automatic reading of older files.
- Renamed node-wide typography controls in the editor to clearly distinguish them from selected-text formatting.

## 0.5.0

### Added

- Added editable table nodes with manual row/column controls and per-column alignment.
- Added Markdown table parsing from the table dialog and direct canvas paste.
- Added non-destructive child-node-to-table snapshots; original branches are preserved and collapsed.
- Added code nodes with language labels, fenced code recognition, scrolling, copying, Markdown export, and SVG preview.
- Added clipboard image paste with binary files saved into a configurable vault asset folder.
- Added nested submap creation, clickable submap cards, parent navigation metadata, a back button, and parent-node focusing on return.
- Added variable-width rich-node layout to prevent tables and code blocks from overlapping nearby branches.

### Changed

- Upgraded the document schema to version 4 while retaining automatic normalization of older files.
- `Ctrl/Cmd + V` now detects images, Markdown tables, fenced code, and MindMap Studio branches.
- SVG export and embedded previews now include readable table, code, and submap summaries.

### Safety

- Code blocks are rendered as text and are never executed.

## 0.4.0

### Added

- Added global appearance defaults for canvas background color, grid/dot/none patterns, pattern color, font family, custom font name, and font size.
- Added connector color, width, and curved/straight/elbow style settings.
- Added default node background, text color, border color, and border width settings.
- Added default bold, italic, and underline text settings.
- Added a per-document appearance editor in the mind-map toolbar; its settings are stored in the `.mindmap` file.
- Added per-node border color, border width, font size, bold, italic, and underline overrides.
- Added appearance-aware SVG export and Markdown embed previews.

### Changed

- Upgraded the document schema to version 3 while preserving automatic reading of version 2 files.
- Layout sizing now accounts for custom font sizes.
- Static SVG export now preserves background patterns, connector styles, typography, node borders, and text decoration.

### Fixed

- Preserved explicit `false` node style overrides, allowing a node to disable global bold, italic, or underline defaults.

## 0.3.0

### Changed

- Renamed the plugin to **MindMap Studio**.
- Changed the plugin ID and installation folder to `mindmap-studio`.
- Replaced Markdown-backed brain-map files with the dedicated `.mindmap` extension.
- Changed persistence to plain formatted JSON without Markdown frontmatter or fenced code blocks.
- Registered `.mindmap` directly to the editable `TextFileView`, fixing files reopening as Markdown source or static preview.
- Renamed CSS, view, settings, command, clipboard, and code-block namespaces.

### Added

- Safe conversion of legacy Markdown-backed mind maps to `.mindmap` files.
- Automatic legacy redirect/conversion setting, enabled by default.
- Context-menu and command-based legacy conversion.
- Read-only compatibility for existing legacy fenced mind-map code blocks.

### Fixed

- Fixed reopening a saved mind map in the wrong Obsidian view.
- Fixed an ancestor-path duplication bug used during node location.
- Cleared the view container before recreating the editor for a different file.

## 0.2.0

- Added tasks, progress, node images, icons, tags, colors, shapes, bold text, search, branch clipboard operations, JSON exchange, keyboard navigation, and expanded settings.

## 0.1.0

- Initial local-first mind-map editor with node editing, drag reparenting, links, Markdown conversion, SVG export, embeds, themes, and grid.
