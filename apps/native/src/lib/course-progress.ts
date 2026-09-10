/**
 * Local, per-device tracking of where the user is with a skill: nothing here
 * is a claim on the CV — "learning" just marks intent; "can-do" is the user
 * explicitly confirming they have the skill, which is the only path that adds
 * it to the Career Profile.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "sumaiya_skill_progress_v1";

export type SkillState = "learning" | "can-do";

type Store = Record<string, SkillState>;

async function read(): Promise<Store> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

async function write(s: Store): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* best-effort */
  }
}

export async function getSkillProgress(): Promise<Store> {
  return read();
}

export async function setSkillState(skillId: string, state: SkillState | null): Promise<Store> {
  const s = await read();
  if (state === null) delete s[skillId];
  else s[skillId] = state;
  await write(s);
  return s;
}
