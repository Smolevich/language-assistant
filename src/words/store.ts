import { create } from 'zustand';
import { getWordsRepo } from '../data';

export type Word = {
  id: string;
  term: string;
  translation: string;
  transcription?: string;
  audio?: string;
  lang?: string; // e.g. 'en'
};

type WordsState = {
  loaded: boolean;
  words: Word[];
  ensureLoaded: () => Promise<void>;
  addWord: (w: Omit<Word, 'id'>) => Promise<void>;
  removeWord: (id: string) => Promise<void>;
  importWords: (ws: Omit<Word, 'id'>[]) => Promise<void>;
  clearAll: () => Promise<void>;
};

const seed: Omit<Word, 'id'>[] = [
  { term: 'mountain', translation: 'гора', transcription: "['maʊntɪn]", lang: 'en' },
  { term: 'river', translation: 'река', transcription: "['rɪvə]", lang: 'en' },
  { term: 'valley', translation: 'долина', transcription: "['vælɪ]", lang: 'en' },
  { term: 'forest', translation: 'лес', transcription: "['fɒrɪst]", lang: 'en' },
  { term: 'sky', translation: 'небо', transcription: "[skaɪ]", lang: 'en' },
  { term: 'ocean', translation: 'океан', transcription: "['oʊʃən]", lang: 'en' },
  { term: 'island', translation: 'остров', transcription: "['aɪlənd]", lang: 'en' },
  { term: 'bridge', translation: 'мост', transcription: "[brɪdʒ]", lang: 'en' },
  { term: 'language', translation: 'язык', transcription: "['læŋgwɪdʒ]", lang: 'en' },
  { term: 'knowledge', translation: 'знание', transcription: "['nɒlɪdʒ]", lang: 'en' },
  { term: 'habit', translation: 'привычка', transcription: "['hæbɪt]", lang: 'en' },
  { term: 'progress', translation: 'прогресс', transcription: "['prəʊgres]", lang: 'en' },
  { term: 'challenge', translation: 'вызов', transcription: "['tʃælɪndʒ]", lang: 'en' },
  { term: 'practice', translation: 'практика', transcription: "['præktɪs]", lang: 'en' },
  { term: 'memory', translation: 'память', transcription: "['meməri]", lang: 'en' },
  { term: 'sentence', translation: 'предложение', transcription: "['sentəns]", lang: 'en' },
  { term: 'question', translation: 'вопрос', transcription: "['kwestʃən]", lang: 'en' },
  { term: 'answer', translation: 'ответ', transcription: "['ɑːnsə]", lang: 'en' },
  { term: 'example', translation: 'пример', transcription: "[ɪg'zɑːmpl]", lang: 'en' },
  { term: 'reason', translation: 'причина', transcription: "['riːzn]", lang: 'en' },
  { term: 'result', translation: 'результат', transcription: "[rɪ'zʌlt]", lang: 'en' },
  { term: 'future', translation: 'будущее', transcription: "['fjuːtʃə]", lang: 'en' },
  { term: 'past', translation: 'прошлое', transcription: "[pɑːst]", lang: 'en' },
  { term: 'present', translation: 'настоящее', transcription: "['preznt]", lang: 'en' },
  { term: 'friend', translation: 'друг', transcription: "[frend]", lang: 'en' },
  { term: 'family', translation: 'семья', transcription: "['fæmɪlɪ]", lang: 'en' },
  { term: 'work', translation: 'работа', transcription: "[wɜːk]", lang: 'en' },
  { term: 'study', translation: 'учёба', transcription: "['stʌdɪ]", lang: 'en' },
  { term: 'travel', translation: 'путешествовать', transcription: "['trævəl]", lang: 'en' },
  { term: 'health', translation: 'здоровье', transcription: "[helθ]", lang: 'en' },
];

export const useWords = create<WordsState>((set, get) => ({
  loaded: false,
  words: [],
  async ensureLoaded() {
    if (get().loaded) return;
    const repo = getWordsRepo();
    let list = await repo.list();
    if (!list.length) {
      await repo.bulkInsert(seed);
      list = await repo.list();
    }
    set({ words: list, loaded: true });
  },
  async addWord(w) {
    const repo = getWordsRepo();
    const nw = await repo.add(w);
    set((s) => ({ words: [nw, ...s.words] }));
  },
  async removeWord(id) {
    const repo = getWordsRepo();
    await repo.remove(id);
    set((s) => ({ words: s.words.filter((w) => w.id !== id) }));
  },
  async importWords(ws) {
    const repo = getWordsRepo();
    await repo.bulkInsert(ws);
    const list = await repo.list();
    set({ words: list });
  },
  async clearAll() {
    const repo = getWordsRepo();
    await repo.clear();
    set({ words: [] });
  },
}));
