#!/usr/bin/env node
// Convert Kaikki/Wiktextract JSONL dump to app JSON format
// Usage:
//   node scripts/kaikki-import.mjs --in enwiktionary.jsonl --out en-ru.json --lang ru [--limit 100000]
// Input: JSON Lines where each line is an entry from Kaikki (https://kaikki.org)
// Output: [ { term, translation, transcription?, lang: 'en' } ]

import fs from 'node:fs';
import readline from 'node:readline';
import { argv, exit, stdin } from 'node:process';

function parseArgs() {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--in') args.in = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--lang') args.lang = argv[++i];
    else if (a === '--limit') args.limit = Number(argv[++i]);
  }
  if (!args.in || !args.out) {
    console.error('Usage: node scripts/kaikki-import.mjs --in <file.jsonl> --out <out.json> --lang ru');
    exit(2);
  }
  if (!args.lang) args.lang = 'ru';
  return args;
}

const { in: inFile, out: outFile, lang: targetLang, limit } = parseArgs();

const input = inFile === '-' ? stdin : fs.createReadStream(inFile);
const rl = readline.createInterface({ input, crlfDelay: Infinity });

const out = [];
const seen = new Set();

let count = 0;
for await (const line of rl) {
  if (!line || !line.trim()) continue;
  let obj;
  try {
    obj = JSON.parse(line);
  } catch {
    continue;
  }
  if (obj.lang !== 'English' || !obj.word) continue;
  const term = obj.word;

  // Try pronunciations/sounds for IPA
  let ipa = undefined;
  const sounds = obj.sounds || obj.pronunciations || [];
  for (const s of sounds) {
    if (s && (s.ipa || s.IPA)) { ipa = s.ipa || s.IPA; break; }
  }

  const senses = obj.senses || [];
  for (const s of senses) {
    const trs = s.translations || [];
    for (const t of trs) {
      if (!t) continue;
      const langName = (t.lang || t.language || '').toLowerCase();
      const code = (t.code || t.lang_code || '').toLowerCase();
      const matches = code === targetLang.toLowerCase() || langName.includes('russian');
      if (!matches) continue;
      const translation = t.word || t.term || t.translation || null;
      if (!translation) continue;
      const key = `${term}\u0001${translation}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ term, translation, transcription: ipa, lang: 'en' });
      if (limit && out.length >= limit) break;
    }
    if (limit && out.length >= limit) break;
  }
  count++;
  if (limit && out.length >= limit) break;
}

fs.writeFileSync(outFile, JSON.stringify(out, null, 2), 'utf8');
console.log(`Wrote ${out.length} entries to ${outFile}`);
