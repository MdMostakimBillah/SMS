#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function pxToRem(px) {
  const num = parseFloat(px);
  if (num === 0) return '0';
  const rem = num / 16;
  return parseFloat(rem.toFixed(4)).toString() + 'rem';
}

function convertFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Convert CSS px values (not in @page rules, not in media queries for html font-size)
  // Match Npx followed by ; or ) or space, but not inside @page or html font-size media queries
  content = content.replace(/(\d+(?:\.\d+)?)px/g, (match, num) => {
    return pxToRem(num);
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

const cssFiles = [
  path.join(__dirname, '..', 'src', 'index.css'),
];

for (const file of cssFiles) {
  if (convertFile(file)) {
    console.log(`✓ ${path.relative(path.join(__dirname, '..'), file)}`);
  }
}
console.log('Done!');
