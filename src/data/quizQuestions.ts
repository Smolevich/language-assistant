export interface QuizQuestion {
  id: number;
  type: 'translation' | 'pronunciation' | 'definition';
  prompt: string;
  options: string[];
  correctIndex: number;
  word?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
}

export const quizQuestions: QuizQuestion[] = [
  // Translation questions
  {
    id: 1,
    type: 'translation',
    prompt: 'Как переводится "Hello" на русский?',
    options: ['Привет', 'Пока', 'Спасибо', 'Извините'],
    correctIndex: 0,
    word: 'hello',
    level: 'beginner'
  },
  {
    id: 2,
    type: 'translation',
    prompt: 'Что означает "Beautiful"?',
    options: ['Уродливый', 'Красивый', 'Большой', 'Маленький'],
    correctIndex: 1,
    word: 'beautiful',
    level: 'intermediate'
  },
  {
    id: 3,
    type: 'translation',
    prompt: 'Перевод слова "Environment"?',
    options: ['Окружающая среда', 'Развитие', 'Возможность', 'Ответственность'],
    correctIndex: 0,
    word: 'environment',
    level: 'advanced'
  },
  
  // Pronunciation questions
  {
    id: 4,
    type: 'pronunciation',
    prompt: 'Как правильно произносится "Water"?',
    options: ['[ˈwætər]', '[ˈwɔːtər]', '[ˈwɑːtər]', '[ˈweɪtər]'],
    correctIndex: 1,
    word: 'water',
    level: 'beginner'
  },
  {
    id: 5,
    type: 'pronunciation',
    prompt: 'Транскрипция слова "Important"?',
    options: ['[ɪmˈpɔːrtənt]', '[ɪmˈpɔːrtnt]', '[ˈɪmpɔːrtənt]', '[ɪmpoʊˈrtænt]'],
    correctIndex: 1,
    word: 'important',
    level: 'intermediate'
  },
  
  // Definition questions
  {
    id: 6,
    type: 'definition',
    prompt: 'Какое слово означает "место где живут люди"?',
    options: ['School', 'House', 'Work', 'Book'],
    correctIndex: 1,
    word: 'house',
    level: 'beginner'
  },
  {
    id: 7,
    type: 'definition',
    prompt: 'Что означает "возможность что-то сделать"?',
    options: ['Experience', 'Information', 'Opportunity', 'Development'],
    correctIndex: 2,
    word: 'opportunity',
    level: 'intermediate'
  },
  {
    id: 8,
    type: 'definition',
    prompt: 'Слово для "понимание чего-либо"?',
    options: ['Responsibility', 'Understanding', 'Nevertheless', 'Sophisticated'],
    correctIndex: 1,
    word: 'understanding',
    level: 'advanced'
  },
  
  // More translation questions
  {
    id: 9,
    type: 'translation',
    prompt: 'Как сказать "Спасибо" по-английски?',
    options: ['Please', 'Thank you', 'Sorry', 'Excuse me'],
    correctIndex: 1,
    word: 'thank you',
    level: 'beginner'
  },
  {
    id: 10,
    type: 'translation',
    prompt: 'Что означает "Different"?',
    options: ['Одинаковый', 'Разный', 'Похожий', 'Странный'],
    correctIndex: 1,
    word: 'different',
    level: 'intermediate'
  }
];

export function getQuestionsByLevel(level: 'beginner' | 'intermediate' | 'advanced') {
  return quizQuestions.filter(q => q.level === level);
}

export function getRandomQuestions(count: number = 5) {
  const shuffled = [...quizQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function getQuestionsByType(type: 'translation' | 'pronunciation' | 'definition') {
  return quizQuestions.filter(q => q.type === type);
}