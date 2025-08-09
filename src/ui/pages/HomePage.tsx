import { Card } from '../widgets/Card';

const sampleWords = [
  { word: 'mountain', transcription: "['maʊntɪn]" },
  { word: 'river', transcription: "['rɪvə]" },
  { word: 'valley', transcription: "['vælɪ]" },
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


