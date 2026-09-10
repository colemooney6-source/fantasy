import { runRosterCheck } from "./rosterCheck.js";

let intervalHandle: ReturnType<typeof setInterval> | null = null;

export function startScheduler(year: number, intervalMinutes: number) {
  stopScheduler();

  const run = () => {
    runRosterCheck(year)
      .then((result) => {
        console.log(
          `[roster-check] ${result.checkedAt}: checked ${result.playersChecked} player(s), ` +
            `${result.newlyMatched} newly matched, ${result.alertsCreated} new alert(s)`,
        );
      })
      .catch((err) => console.error("[roster-check] failed:", err));
  };

  run();
  intervalHandle = setInterval(run, intervalMinutes * 60 * 1000);
}

export function stopScheduler() {
  if (intervalHandle) clearInterval(intervalHandle);
  intervalHandle = null;
}
