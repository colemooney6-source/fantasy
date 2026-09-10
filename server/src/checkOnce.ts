import { db, type AlertRow } from "./db.js";
import { runRosterCheck } from "./rosterCheck.js";

// One-shot roster news check, meant for an external scheduler (a cron job,
// a Claude Code Routine) that resumes/invokes this rather than needing the
// Express server to stay running continuously between checks.
const year = process.env.ROSTER_CHECK_YEAR ? Number(process.env.ROSTER_CHECK_YEAR) : new Date().getFullYear();

const result = await runRosterCheck(year);

console.log(
  `Checked ${result.playersChecked} player(s), ${result.newlyMatched} newly matched, ` +
    `${result.alertsCreated} new alert(s) at ${result.checkedAt}.`,
);

if (result.alertsCreated > 0) {
  const rows = db
    .prepare("SELECT * FROM alerts ORDER BY id DESC LIMIT ?")
    .all(result.alertsCreated) as unknown as AlertRow[];
  console.log("New alerts:");
  for (const row of rows.reverse()) {
    console.log(`- ${row.message}`);
  }
}
