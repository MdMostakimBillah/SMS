#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function pxToRem(px) {
  const num = parseFloat(px);
  if (num === 0) return '0';
  if (num === 1) return '1px'; // keep 1px borders crisp
  const rem = num / 16;
  return parseFloat(rem.toFixed(4)).toString() + 'rem';
}

const filePath = path.join(__dirname, '..', 'src', 'index.css');
let content = fs.readFileSync(filePath, 'utf8');

// Split into lines, skip html font-size lines
const lines = content.split('\n');
const result = [];
let skipHtmlBlock = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Skip html font-size media query blocks
  if (line.includes('html { font-size:') || line.includes('font-size: 14px')) {
    result.push(line);
    continue;
  }
  // Convert all other Npx values (but keep 1px for borders)
  result.push(line.replace(/(\d+(?:\.\d+)?)px/g, (match, num) => pxToRem(num)));
}

fs.writeFileSync(filePath, result.join('\n'), 'utf8');
console.log('✓ index.css converted');
