import { Card } from '../widgets/Card';

const sampleWords = [
  { word: 'mountain', transcription: "['maʊntɪn]", audio: 'https://cdn.jsdelivr.net/gh/mdn/webaudio-examples/voice-change-o-matic/audio/concert-crowd.ogg' },
  { word: 'river', transcription: "['rɪvə]", audio: 'https://cdn.jsdelivr.net/gh/mdn/webaudio-examples/voice-change-o-matic/audio/concert-crowd.ogg' },
  { word: 'valley', transcription: "['vælɪ]", audio: 'https://cdn.jsdelivr.net/gh/mdn/webaudio-examples/voice-change-o-matic/audio/concert-crowd.ogg' },
];

export function HomePage() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sampleWords.map((w) => (
        <Card key={w.word} {...w} />
      ))}
    </div>
  );
}


