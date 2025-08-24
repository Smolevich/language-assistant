import type { Word } from '../words/store';

export interface WordsRepo {
  list(): Promise<Word[]>;
  add(word: Omit<Word, 'id'>): Promise<Word>;
  remove(id: string): Promise<void>;
  bulkInsert(words: Omit<Word, 'id'>[]): Promise<void>;
  clear(): Promise<void>;
}

