import { db } from "./db.js";

// Seeded from the user's actual ESPN roster screenshots (week 1). Names are
// kept exactly as ESPN's mobile app abbreviates them ("L. Jackson") rather
// than expanded/guessed — rosterMatch.ts resolves each one to a live ESPN
// player by last name + first initial on the first scheduled check, and
// updates the stored name to the full version once matched.
const ROSTER: Array<{
  name: string;
  position: string;
  team: string;
  slot_group: "starter" | "bench" | "ir";
  slot_label: string;
  slot_order: number;
  last_known_injury_status?: string;
}> = [
  { name: "L. Jackson", position: "QB", team: "BAL", slot_group: "starter", slot_label: "QB", slot_order: 0 },
  { name: "T. Etienne Jr.", position: "RB", team: "JAX", slot_group: "starter", slot_label: "RB", slot_order: 0 },
  { name: "A. Jeanty", position: "RB", team: "LV", slot_group: "starter", slot_label: "RB", slot_order: 1 },
  { name: "J. Jefferson", position: "WR", team: "MIN", slot_group: "starter", slot_label: "WR", slot_order: 0 },
  {
    name: "A. Pierce",
    position: "WR",
    team: "IND",
    slot_group: "starter",
    slot_label: "WR",
    slot_order: 1,
    last_known_injury_status: "QUESTIONABLE",
  },
  { name: "C. Sutton", position: "WR", team: "DEN", slot_group: "starter", slot_label: "WR", slot_order: 2 },
  { name: "M. Andrews", position: "TE", team: "BAL", slot_group: "starter", slot_label: "TE", slot_order: 0 },
  { name: "K. Monangai", position: "RB", team: "CHI", slot_group: "starter", slot_label: "FLEX", slot_order: 0 },
  { name: "Ravens D/ST", position: "D/ST", team: "BAL", slot_group: "starter", slot_label: "D/ST", slot_order: 0 },

  { name: "G. Kittle", position: "TE", team: "SF", slot_group: "bench", slot_label: "BE", slot_order: 0 },
  { name: "K. Murray", position: "QB", team: "ARI", slot_group: "bench", slot_label: "BE", slot_order: 1 },
  { name: "D. Samuel Sr.", position: "WR", team: "SF", slot_group: "bench", slot_label: "BE", slot_order: 2 },
  { name: "D. Stribling", position: "WR", team: "SF", slot_group: "bench", slot_label: "BE", slot_order: 3 },
  { name: "X. Worthy", position: "WR", team: "KC", slot_group: "bench", slot_label: "BE", slot_order: 4 },
];

const existing = db.prepare("SELECT COUNT(*) as count FROM roster_players").get() as { count: number };
if (existing.count > 0) {
  console.log(`roster_players already has ${existing.count} row(s) — skipping seed. Delete server/data/roster.db to reseed.`);
  process.exit(0);
}

const insert = db.prepare(`
  INSERT INTO roster_players (name, position, team, slot_group, slot_label, slot_order, last_known_injury_status)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (const p of ROSTER) {
  insert.run(p.name, p.position, p.team, p.slot_group, p.slot_label, p.slot_order, p.last_known_injury_status ?? null);
}

console.log(`Seeded ${ROSTER.length} roster players.`);
