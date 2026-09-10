import type { CheckResult, RosterAlert, RosterPlayer, SlotGroup } from "./rosterTypes";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchRoster(): Promise<RosterPlayer[]> {
  const data = await request<{ roster: RosterPlayer[] }>("/api/roster");
  return data.roster;
}

export interface AddRosterPlayerInput {
  name: string;
  position: string;
  team?: string | null;
  slotGroup: SlotGroup;
  slotLabel: string;
  slotOrder?: number;
  espnPlayerId?: number;
  injuryStatus?: string | null;
}

export async function addRosterPlayer(input: AddRosterPlayerInput): Promise<{ id: number }> {
  return request("/api/roster", { method: "POST", body: JSON.stringify(input) });
}

export interface UpdateRosterSlotInput {
  slotGroup?: SlotGroup;
  slotLabel?: string;
  slotOrder?: number;
  espnPlayerId?: number;
}

export async function updateRosterSlot(id: number, patch: UpdateRosterSlotInput): Promise<void> {
  await request(`/api/roster/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export async function removeRosterPlayer(id: number): Promise<void> {
  await request(`/api/roster/${id}`, { method: "DELETE" });
}

export async function checkRosterNow(): Promise<CheckResult> {
  return request("/api/roster/check-now", { method: "POST" });
}

export async function fetchAlerts(): Promise<{ alerts: RosterAlert[]; unreadCount: number }> {
  return request("/api/alerts");
}

export async function markAlertRead(id: number): Promise<void> {
  await request(`/api/alerts/${id}/read`, { method: "POST" });
}

export async function markAllAlertsRead(): Promise<void> {
  await request("/api/alerts/read-all", { method: "POST" });
}
