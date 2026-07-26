const fs = require('fs');
const scan = JSON.parse(fs.readFileSync('D:/Downloads/obsidian-mindmap-studio/.ua/tmp/ua-scan-files.json', 'utf8'));
const im = JSON.parse(fs.readFileSync('D:/Downloads/obsidian-mindmap-studio/.ua/tmp/ua-import-map-output.json', 'utf8'));
const result = {
  name: 'obsidian-mindmap-studio',
  description: 'Editable local-first .mindmap diagrams for Obsidian with synchronized mind map, outline, and article modes, read-only locking, global search, themes, rich content, image mirrors, tables, code, and exports.',
  languages: ['css','javascript','json','markdown','typescript','yaml'],
  frameworks: ['Obsidian'],
  files: scan.files,
  totalFiles: scan.totalFiles,
  filteredByIgnore: scan.filteredByIgnore,
  estimatedComplexity: scan.estimatedComplexity,
  importMap: im.importMap
};
fs.writeFileSync('D:/Downloads/obsidian-mindmap-studio/.ua/intermediate/scan-result.json', JSON.stringify(result, null, 2));
console.log('Written ' + result.totalFiles + ' files');
