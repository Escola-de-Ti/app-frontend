// src/services/votes.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@voted_posts';

export async function getVotedSet(): Promise<Set<number>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    const clean = arr.map((n) => Number(n)).filter((n) => Number.isFinite(n));
    return new Set(clean);
  } catch {
    return new Set();
  }
}

async function saveSet(set: Set<number>) {
  const arr = Array.from(set.values()).filter((n) => Number.isFinite(n));
  await AsyncStorage.setItem(KEY, JSON.stringify(arr));
}

export async function markVoted(id: number) {
  const n = Number(id);
  if (!Number.isFinite(n)) return;
  const s = await getVotedSet();
  s.add(n);
  await saveSet(s);
}

export async function unmarkVoted(id: number) {
  const n = Number(id);
  if (!Number.isFinite(n)) return;
  const s = await getVotedSet();
  s.delete(n);
  await saveSet(s);
}
