export const commonEnglishWords = [
  { word: 'hello', transcription: 'həˈloʊ', translation: 'привет', level: 'beginner' },
  { word: 'goodbye', transcription: 'ˌɡʊdˈbaɪ', translation: 'до свидания', level: 'beginner' },
  { word: 'please', transcription: 'pliːz', translation: 'пожалуйста', level: 'beginner' },
  { word: 'thank you', transcription: 'θæŋk juː', translation: 'спасибо', level: 'beginner' },
  { word: 'water', transcription: 'ˈwɔːtər', translation: 'вода', level: 'beginner' },
  { word: 'food', transcription: 'fuːd', translation: 'еда', level: 'beginner' },
  { word: 'house', transcription: 'haʊs', translation: 'дом', level: 'beginner' },
  { word: 'family', transcription: 'ˈfæməli', translation: 'семья', level: 'beginner' },
  { word: 'friend', transcription: 'frend', translation: 'друг', level: 'beginner' },
  { word: 'work', transcription: 'wɜːrk', translation: 'работа', level: 'beginner' },
  { word: 'school', transcription: 'skuːl', translation: 'школа', level: 'beginner' },
  { word: 'book', transcription: 'bʊk', translation: 'книга', level: 'beginner' },
  { word: 'beautiful', transcription: 'ˈbjuːtɪfl', translation: 'красивый', level: 'intermediate' },
  { word: 'important', transcription: 'ɪmˈpɔːrtnt', translation: 'важный', level: 'intermediate' },
  { word: 'different', transcription: 'ˈdɪfrənt', translation: 'разный', level: 'intermediate' },
  { word: 'possible', transcription: 'ˈpɑːsəbl', translation: 'возможный', level: 'intermediate' },
  { word: 'information', transcription: 'ˌɪnfərˈmeɪʃn', translation: 'информация', level: 'intermediate' },
  { word: 'experience', transcription: 'ɪkˈspɪriəns', translation: 'опыт', level: 'intermediate' },
  { word: 'development', transcription: 'dɪˈveləpmənt', translation: 'развитие', level: 'intermediate' },
  { word: 'opportunity', transcription: 'ˌɑːpərˈtuːnəti', translation: 'возможность', level: 'intermediate' },
  { word: 'environment', transcription: 'ɪnˈvaɪrənmənt', translation: 'окружающая среда', level: 'advanced' },
  { word: 'responsibility', transcription: 'rɪˌspɑːnsəˈbɪləti', translation: 'ответственность', level: 'advanced' },
  { word: 'understanding', transcription: 'ˌʌndərˈstændɪŋ', translation: 'понимание', level: 'advanced' },
  { word: 'nevertheless', transcription: 'ˌnevərðəˈles', translation: 'тем не менее', level: 'advanced' },
  { word: 'sophisticated', transcription: 'səˈfɪstɪkeɪtɪd', translation: 'сложный, изощренный', level: 'advanced' },
];

export type WordLevel = 'beginner' | 'intermediate' | 'advanced';

export interface DictionaryWord {
  word: string;
  transcription: string;
  translation: string;
  level: WordLevel;
}