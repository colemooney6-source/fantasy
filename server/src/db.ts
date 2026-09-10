import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.ROSTER_DB_DIR ?? path.join(__dirname, "..", "data");
const DB_PATH = path.join(DATA_DIR, "roster.db");

fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS roster_players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    team TEXT,
    slot_group TEXT NOT NULL CHECK (slot_group IN ('starter', 'bench', 'ir')),
    slot_label TEXT NOT NULL,
    slot_order INTEGER NOT NULL DEFAULT 0,
    espn_player_id INTEGER,
    last_known_injury_status TEXT,
    last_checked_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    roster_player_id INTEGER NOT NULL REFERENCES roster_players(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    read INTEGER NOT NULL DEFAULT 0
  );
`);

export interface RosterPlayerRow {
  id: number;
  name: string;
  position: string;
  team: string | null;
  slot_group: "starter" | "bench" | "ir";
  slot_label: string;
  slot_order: number;
  espn_player_id: number | null;
  last_known_injury_status: string | null;
  last_checked_at: string | null;
  created_at: string;
}

export interface AlertRow {
  id: number;
  roster_player_id: number;
  message: string;
  created_at: string;
  read: number;
}
