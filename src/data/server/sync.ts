import { writeBatch, doc, serverTimestamp, type Firestore } from 'firebase/firestore';
import type { Word } from '../../words/store';
import type { User } from 'firebase/auth';

export async function uploadWordsToFirestore(opts: {
  db: Firestore;
  user: User;
  words: Word[];
  batchSize?: number;
  path?: { root?: string; sub?: string };
}): Promise<{ written: number }> {
  const { db, user, words } = opts;
  const batchSize = opts.batchSize ?? 400;
  const root = opts.path?.root ?? 'users';
  const sub = opts.path?.sub ?? 'dictionary';

  let written = 0;
  for (let i = 0; i < words.length; i += batchSize) {
    const slice = words.slice(i, i + batchSize);
    const batch = writeBatch(db);
    for (const w of slice) {
      const ref = doc(db, root, user.uid, sub, w.id);
      batch.set(ref, {
        id: w.id,
        term: w.term,
        translation: w.translation,
        transcription: w.transcription ?? null,
        audio: w.audio ?? null,
        lang: w.lang ?? null,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
    await batch.commit();
    written += slice.length;
  }
  return { written };
}

