import type { WordsRepo } from '../wordsRepo';
import type { Word } from '../../words/store';

const STORAGE_KEY = 'la_words_v1';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function load(): Word[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Word[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function save(words: Word[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  } catch {}
}

export class WordsLocalRepo implements WordsRepo {
  async list(): Promise<Word[]> {
    return load();
  }
  async add(word: Omit<Word, 'id'>): Promise<Word> {
    const w: Word = { id: uid(), ...word };
    const all = load();
    const updated = [w, ...all];
    save(updated);
    return w;
  }
  async remove(id: string): Promise<void> {
    const all = load();
    save(all.filter((w) => w.id !== id));
  }
  async bulkInsert(words: Omit<Word, 'id'>[]): Promise<void> {
    const all = load();
    const incoming: Word[] = words.map((w) => ({ id: uid(), ...w }));
    save([...incoming, ...all]);
  }
  async clear(): Promise<void> {
    save([]);
  }
}

