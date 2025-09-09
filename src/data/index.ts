import type { WordsRepo } from './wordsRepo';
import { WordsLocalRepo } from './local/wordsLocalRepo';
import { WordsDuckRepo } from './duckdb/wordsDuckRepo';

let wordsRepo: WordsRepo | null = null;

// Prefer DuckDB (WASM) in browser; fallback to localStorage repo if init fails
export function getWordsRepo(): WordsRepo {
  if (!wordsRepo) {
    try {
      wordsRepo = new WordsDuckRepo();
    } catch {
      wordsRepo = new WordsLocalRepo();
    }
  }
  return wordsRepo;
}
