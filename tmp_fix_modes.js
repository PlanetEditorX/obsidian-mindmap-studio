const fs = require('fs');
let c = fs.readFileSync('D:\\Downloads\\obsidian-mindmap-studio\\src\\article\\modes.ts', 'utf8');
const oldCode = '    let numberedIndex = 0;\n    for (const child of parent.children) {\n      const isHeading = isArticleHeading(child);\n      const skipped = child.skipArticleNumbering === true;\n      if (!skipped) numberedIndex += 1;\n      const label = !skipped ? articleNumberLabel(depth, numberedIndex) : "";';
const newCode = '    // If any sibling is a heading, number ALL non-skipped siblings for consistency\n    const hasAnyHeading = parent.children.some((child) => isArticleHeading(child));\n    let numberedIndex = 0;\n    for (const child of parent.children) {\n      const isHeading = isArticleHeading(child);\n      const skipped = child.skipArticleNumbering === true;\n      const shouldNumber = !skipped && hasAnyHeading;\n      if (shouldNumber) numberedIndex += 1;\n      const label = shouldNumber ? articleNumberLabel(depth, numberedIndex) : "";';
c = c.replace(oldCode, newCode);
fs.writeFileSync('D:\\Downloads\\obsidian-mindmap-studio\\src\\article\\modes.ts', c, 'utf8');
console.log('done');