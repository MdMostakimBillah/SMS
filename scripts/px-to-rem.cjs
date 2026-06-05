#!/usr/bin/env node
// Converts hardcoded [Npx] values in Tailwind classes to [Nrem]
// Formula: Npx / 16 = Nrem

const fs = require('fs');
const path = require('path');

function pxToRem(px) {
  const num = parseFloat(px);
  if (num === 0) return '0';
  const rem = num / 16;
  // Use up to 4 decimal places, remove trailing zeros
  return parseFloat(rem.toFixed(4)).toString();
}

function convertFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Match patterns like [Npx] where N is a number (int or decimal)
  // Exclude things that are already rem, %, vh, vw, etc.
  // Only match inside Tailwind class brackets [...]
  content = content.replace(/\[(\d+(?:\.\d+)?)px\]/g, (match, num) => {
    const rem = pxToRem(num);
    return `[${rem}rem]`;
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
    } else if (/\.(tsx?|jsx?|css)$/.test(entry.name)) {
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
