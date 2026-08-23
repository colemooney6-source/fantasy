import type { DraftedPick, Settings } from "./types";

export interface PersistedDraft {
  settings: Settings;
  drafted: DraftedPick[];
}

const KEY = "fantasy-draft-helper:v1";

export function saveDraft(state: PersistedDraft) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage unavailable (e.g. private browsing) — draft state just won't persist across reloads
  }
}

export function loadDraft(): PersistedDraft | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedDraft;
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
