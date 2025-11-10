// src/services/votes.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@voted_posts';

export async function getVotedSet(): Promise<Set<number>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as number[];
    return new Set(arr.filter((n) => Number.isFinite(n)));
  } catch {
    return new Set();
  }
}

async function saveSet(set: Set<number>) {
  const arr = Array.from(set.values());
  await AsyncStorage.setItem(KEY, JSON.stringify(arr));
}

export async function markVoted(id: number) {
  const s = await getVotedSet();
  s.add(id);
  await saveSet(s);
}

export async function unmarkVoted(id: number) {
  const s = await getVotedSet();
  s.delete(id);
  await saveSet(s);
}
