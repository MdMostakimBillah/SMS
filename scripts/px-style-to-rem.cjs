#!/usr/bin/env node
// Converts hardcoded pixel values in style={{ }} to rem in JSX/TSX files
// Handles patterns like: fontSize: '13px', padding: '8px', width: '100px', etc.

const fs = require('fs');
const path = require('path');

function pxToRem(px) {
  const num = parseFloat(px);
  if (num === 0) return '0';
  const rem = num / 16;
  return parseFloat(rem.toFixed(4)).toString();
}

function convertFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Convert style properties with px values in quotes
  // Matches: 'Npx', "Npx" in style contexts
  content = content.replace(/(:\s*['"])(\d+(?:\.\d+)?)px(['"])/g, (match, pre, num, post) => {
    const rem = pxToRem(num);
    return `${pre}${rem}rem${post}`;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

function walkDir(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
      files.push(...walkDir(fullPath));
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

const srcDir = path.join(__dirname, '..', 'src');
const files = walkDir(srcDir);
let converted = 0;

for (const file of files) {
  if (convertFile(file)) {
    converted++;
    console.log(`✓ ${path.relative(path.join(__dirname, '..'), file)}`);
  }
}

console.log(`\nDone! Converted ${converted} files.`);
