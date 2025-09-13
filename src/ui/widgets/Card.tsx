import { useMemo, useRef } from 'react';

type Props = {
  word: string;
  transcription: string;
  audio?: string;
};

export function Card({ word, transcription, audio }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const ttsUrl = useMemo(() => {
    const q = encodeURIComponent(word);
    // Простой TTS через Google Translate endpoint (без ключа). Для продакшна лучше официальный провайдер.
    return `https://translate.google.com/translate_tts?ie=UTF-8&q=${q}&tl=en&client=tw-ob`;
  }, [word]);

  function speakUsingWebAPI() {
    try {
      const utter = new SpeechSynthesisUtterance(word);
      utter.lang = 'en-US';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch {
      // fallback to old audio URL
      const a = new Audio(ttsUrl);
      a.play();
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="text-xl font-bold text-gray-800 mb-2">{word}</div>
      <div className="text-gray-600 mb-4 font-mono text-sm">[{transcription}]</div>
      <div className="flex flex-wrap gap-2">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2 text-sm font-medium"
          onClick={speakUsingWebAPI}
        >
          <span>🔊</span> Произнести
        </button>
        <button
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center gap-2 text-sm font-medium"
          onClick={() => {
            const a = new Audio(ttsUrl);
            a.play();
          }}
        >
          <span>🗣️</span> TTS
        </button>
        {audio && <audio ref={audioRef} src={audio} preload="none" />}
      </div>
    </div>
  );
}

