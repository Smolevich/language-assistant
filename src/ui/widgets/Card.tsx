import { useMemo, useRef } from 'react';

type Props = {
  word: string;
  transcription: string;
  audio: string;
};

export function Card({ word, transcription, audio }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const ttsUrl = useMemo(() => {
    const q = encodeURIComponent(word);
    // Простой TTS через Google Translate endpoint (без ключа). Для продакшна лучше официальный провайдер.
    return `https://translate.google.com/translate_tts?ie=UTF-8&q=${q}&tl=en&client=tw-ob`;
  }, [word]);

  return (
    <div className="border rounded p-4 space-y-2">
      <div className="text-lg font-semibold">{word}</div>
      <div className="text-gray-500">{transcription}</div>
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-1 border rounded hover:bg-gray-50"
          onClick={() => audioRef.current?.play()}
        >
          ▶️ Произношение
        </button>
        <button
          className="px-3 py-1 border rounded hover:bg-gray-50"
          onClick={() => {
            const a = new Audio(ttsUrl);
            a.play();
          }}
        >
          🗣️ TTS
        </button>
        <audio ref={audioRef} src={audio} preload="none" />
      </div>
    </div>
  );
}


