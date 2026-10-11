#!/usr/bin/env node
/**
 * Merges public/alarm-sop-content.html into public/alarm-list.html (SOP tab panel).
 * Edit alarm-sop-content.html for SOP updates, then run: npm run merge-alarm-doc
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');
const listPath = join(publicDir, 'alarm-list.html');
const sopPath = join(publicDir, 'alarm-sop-content.html');

let list = readFileSync(listPath, 'utf8');
let sop = readFileSync(sopPath, 'utf8');
const sopLines = sop.split('\n');
if (sopLines[0]?.startsWith('<!--')) {
  sop = sopLines.slice(1).join('\n');
}

const start = list.indexOf('<div id="panel-sop"');
const end = list.indexOf('<footer>', start);
if (start === -1 || end === -1) {
  console.error('Could not find panel-sop region in alarm-list.html');
  process.exit(1);
}

const before = list.slice(0, start);
const after = list.slice(end);
const merged =
  before +
  '<div id="panel-sop" class="tab-panel card">\n' +
  sop.trim() +
  '\n      </div>\n      ' +
  after;

writeFileSync(listPath, merged);
console.log('Merged SOP into alarm-list.html');
