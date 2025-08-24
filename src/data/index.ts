import { WordsLocalRepo } from './local/wordsLocalRepo';
import type { WordsRepo } from './wordsRepo';

// In the next step, we will add a DuckDB-backed repo and select it here when available.
let wordsRepo: WordsRepo | null = null;

export function getWordsRepo(): WordsRepo {
  if (!wordsRepo) wordsRepo = new WordsLocalRepo();
  return wordsRepo;
}

