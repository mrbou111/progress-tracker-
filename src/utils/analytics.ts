import type {
  DailyReview,
  FocusSession,
  MustDoTask,
  PhoneDayLog,
  SmallTask,
  TaskCategory,
  WeeklyReview,
  WorkspaceData,
} from '../types/productivity';
import {
  addDaysToDateKey,
  formatMinutesAsHm,
  formatShortDateLabel,
  getTrailingDateKeys,
} from './dateUtils';

export const MAX_MUST_DOS_PER_DAY = 3;

export function getMustDosForDate(
  mustDos: MustDoTask[],
  dateKey: string,
): MustDoTask[] {
  return mustDos.filter((t) => t.dateKey === dateKey);
}

export function getSmallTasksForDate(
  smallTasks: SmallTask[],
  dateKey: string,
): SmallTask[] {
  return smallTasks.filter((t) => t.dateKey === dateKey);
}

export interface MustDoProgress {
  completedCount: number;
  totalCount: number;
  ratePercent: number;
  label: string;
}

export function getMustDoProgress(mustDos: MustDoTask[]): MustDoProgress {
  const totalCount = mustDos.length;
  const completedCount = mustDos.filter((t) => t.completed).length;
  const ratePercent =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const label =
    totalCount === 0
      ? 'No must-dos planned yet'
      : `${completedCount}/${totalCount} must-dos done`;
  return { completedCount, totalCount, ratePercent, label };
}

export function getFocusMinutesForDate(
  sessions: FocusSession[],
  dateKey: string,
): number {
  return sessions
    .filter((s) => s.dateKey === dateKey)
    .reduce((sum, s) => sum + s.focusMinutes, 0);
}

export type PhoneLimitStatus = 'under' | 'over' | 'unlogged';

export function getPhoneLimitStatus(
  log: PhoneDayLog | undefined,
  dailyLimitMinutes: number,
): PhoneLimitStatus {
  if (!log || log.screenTimeMinutes <= 0) return 'unlogged';
  return log.screenTimeMinutes <= dailyLimitMinutes ? 'under' : 'over';
}

/**
 * Counts consecutive days ending at `todayKey` (or `yesterdayKey` if `todayKey` is not yet satisfied)
 * where `predicate(dateKey)` is true. Maximum lookback is 60 days.
 */
export function computeConsecutiveStreak(
  todayKey: string,
  predicate: (dateKey: string) => boolean,
  maxDays: number = 60,
): number {
  const todayMet = predicate(todayKey);
  let cursor = todayMet ? todayKey : addDaysToDateKey(todayKey, -1);
  let streak = 0;

  for (let i = 0; i < maxDays; i += 1) {
    if (!predicate(cursor)) {
      break;
    }
    streak += 1;
    cursor = addDaysToDateKey(cursor, -1);
  }

  return streak;
}

export interface StreakSummary {
  plannedNightBeforeStreak: number;
  phoneFreeFirstBlockStreak: number;
  mustDosCompletedStreak: number;
}

export function computeAllStreaks(
  data: WorkspaceData,
  todayKey: string,
): StreakSummary {
  const plannedSet = new Set(data.plannedNightBeforeDates);

  const plannedNightBeforeStreak = computeConsecutiveStreak(todayKey, (dk) =>
    plannedSet.has(dk),
  );

  const phoneFreeFirstBlockStreak = computeConsecutiveStreak(todayKey, (dk) => {
    const log = data.phoneLogs[dk];
    return Boolean(log?.habits.phoneOutOfReachFirstBlock);
  });

  const mustDosCompletedStreak = computeConsecutiveStreak(todayKey, (dk) => {
    const list = getMustDosForDate(data.mustDos, dk);
    return list.length > 0 && list.every((t) => t.completed);
  });

  return {
    plannedNightBeforeStreak,
    phoneFreeFirstBlockStreak,
    mustDosCompletedStreak,
  };
}

export interface WeeklySummary {
  startDateKey: string;
  endDateKey: string;
  totalMustDosPlanned: number;
  totalMustDosCompleted: number;
  completionRatePercent: number;
  totalFocusMinutes: number;
  totalFocusHours: number;
  avgPhoneMinutes: number;
  phoneLoggedDays: number;
  daysUnderPhoneLimit: number;
  streaks: StreakSummary;
}

export function computeWeeklySummary(
  data: WorkspaceData,
  todayKey: string,
): WeeklySummary {
  const keys = getTrailingDateKeys(todayKey, 7);
  const keySet = new Set(keys);

  const weekMustDos = data.mustDos.filter((t) => keySet.has(t.dateKey));
  const totalMustDosPlanned = weekMustDos.length;
  const totalMustDosCompleted = weekMustDos.filter((t) => t.completed).length;
  const completionRatePercent =
    totalMustDosPlanned === 0
      ? 0
      : Math.round((totalMustDosCompleted / totalMustDosPlanned) * 100);

  const totalFocusMinutes = data.focusSessions
    .filter((s) => keySet.has(s.dateKey))
    .reduce((sum, s) => sum + s.focusMinutes, 0);
  const totalFocusHours = Number((totalFocusMinutes / 60).toFixed(1));

  const loggedPhoneDays = keys
    .map((k) => data.phoneLogs[k])
    .filter((log): log is PhoneDayLog => Boolean(log && log.screenTimeMinutes > 0));

  const phoneLoggedDays = loggedPhoneDays.length;
  const avgPhoneMinutes =
    phoneLoggedDays === 0
      ? 0
      : Math.round(
          loggedPhoneDays.reduce((s, l) => s + l.screenTimeMinutes, 0) /
            phoneLoggedDays,
        );

  const daysUnderPhoneLimit = loggedPhoneDays.filter(
    (l) => l.screenTimeMinutes <= data.dailyPhoneLimitMinutes,
  ).length;

  return {
    startDateKey: keys[0],
    endDateKey: keys[keys.length - 1],
    totalMustDosPlanned,
    totalMustDosCompleted,
    completionRatePercent,
    totalFocusMinutes,
    totalFocusHours,
    avgPhoneMinutes,
    phoneLoggedDays,
    daysUnderPhoneLimit,
    streaks: computeAllStreaks(data, todayKey),
  };
}

export interface DashboardDayPoint {
  dateKey: string;
  label: string;
  focusMinutes: number;
  mustDosDone: number;
  mustDosTotal: number;
  mustDoRate: number;
  phoneMinutes: number | null;
  energyLevel: number | null;
}

export function computeDashboardSeries(
  data: WorkspaceData,
  todayKey: string,
): DashboardDayPoint[] {
  const keys = getTrailingDateKeys(todayKey, 7);
  return keys.map((dateKey) => {
    const dayMustDos = getMustDosForDate(data.mustDos, dateKey);
    const mustDosTotal = dayMustDos.length;
    const mustDosDone = dayMustDos.filter((t) => t.completed).length;
    const mustDoRate =
      mustDosTotal === 0 ? 0 : Math.round((mustDosDone / mustDosTotal) * 100);
    const focusMinutes = getFocusMinutesForDate(data.focusSessions, dateKey);
    const phoneLog = data.phoneLogs[dateKey];
    const review = data.dailyReviews[dateKey];

    return {
      dateKey,
      label: formatShortDateLabel(dateKey),
      focusMinutes,
      mustDosDone,
      mustDosTotal,
      mustDoRate,
      phoneMinutes:
        phoneLog && phoneLog.screenTimeMinutes > 0
          ? phoneLog.screenTimeMinutes
          : null,
      energyLevel: review ? review.energyLevel : null,
    };
  });
}

export function getSupportiveMessage(
  data: WorkspaceData,
  todayKey: string,
): { headline: string; detail: string } {
  const todayMustDos = getMustDosForDate(data.mustDos, todayKey);
  const progress = getMustDoProgress(todayMustDos);
  const todayFocus = getFocusMinutesForDate(data.focusSessions, todayKey);
  const streaks = computeAllStreaks(data, todayKey);
  const todayPhone = data.phoneLogs[todayKey];

  if (progress.totalCount > 0 && progress.completedCount === progress.totalCount) {
    return {
      headline: `All ${progress.totalCount} must-dos finished today.`,
      detail:
        'You protected what mattered most instead of getting lost in busywork. Let the rest of the day feel lighter.',
    };
  }

  if (todayFocus >= 45) {
    return {
      headline: `${formatMinutesAsHm(todayFocus)} of phone-free focus logged today.`,
      detail:
        'Every uninterrupted study block weakens the habit of reaching for your phone when work gets tough.',
    };
  }

  if (streaks.phoneFreeFirstBlockStreak >= 2) {
    return {
      headline: `${streaks.phoneFreeFirstBlockStreak}-day streak keeping your phone away for the first study block.`,
      detail:
        'Starting one meaningful block without your phone sets the tone for the rest of the day.',
    };
  }

  if (todayPhone && todayPhone.screenTimeMinutes > data.dailyPhoneLimitMinutes) {
    return {
      headline: 'Tough phone days happen—one honest check-in still counts.',
      detail:
        'Notice what pulled your attention, pick one 5-minute replacement activity, and reset on your next study block.',
    };
  }

  if (progress.completedCount >= 1) {
    return {
      headline: `${progress.completedCount} must-do completed—solid forward motion.`,
      detail:
        'One finished priority outweighs ten checked-off minor errands. Take a short breath before your next block.',
    };
  }

  return {
    headline: 'Small, calm steps compound faster than perfect days.',
    detail:
      'Pick one concrete must-do, place your phone out of reach, and just work for 25 minutes.',
  };
}

export interface MustDoDraftInput {
  description: string;
  category: TaskCategory;
  estimatedMinutes: number;
  timeSlot: string;
  confirmedGladIfOnlyThis: boolean;
}

export interface MustDoValidationResult {
  valid: boolean;
  errors: {
    limit?: string;
    description?: string;
    estimatedMinutes?: string;
    timeSlot?: string;
    confirmedGladIfOnlyThis?: string;
  };
}

export function validateMustDoDraft(
  draft: MustDoDraftInput,
  existingCountForDate: number,
): MustDoValidationResult {
  const errors: MustDoValidationResult['errors'] = {};

  if (existingCountForDate >= MAX_MUST_DOS_PER_DAY) {
    errors.limit = `Maximum of ${MAX_MUST_DOS_PER_DAY} must-do tasks reached. Remove one or move smaller work to the batch list.`;
  }

  const trimmedDesc = draft.description.trim();
  if (!trimmedDesc) {
    errors.description =
      'Write a concrete action (e.g., "Solve 15 problems from ch. 4").';
  } else if (trimmedDesc.length < 5) {
    errors.description = 'Be a bit more specific (at least 5 characters).';
  }

  if (
    !Number.isFinite(draft.estimatedMinutes) ||
    draft.estimatedMinutes < 5 ||
    draft.estimatedMinutes > 360
  ) {
    errors.estimatedMinutes = 'Estimated time must be between 5 and 360 minutes.';
  }

  if (!draft.timeSlot.trim()) {
    errors.timeSlot = 'Choose or enter a planned time slot.';
  }

  if (!draft.confirmedGladIfOnlyThis) {
    errors.confirmedGladIfOnlyThis =
      'Confirm: "If I only did this one thing today, would I be glad?"';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateCustomTimer(
  focusMinutes: number,
  breakMinutes: number,
): { valid: boolean; error?: string } {
  if (!Number.isFinite(focusMinutes) || focusMinutes < 5 || focusMinutes > 180) {
    return {
      valid: false,
      error: 'Focus duration must be between 5 and 180 minutes.',
    };
  }
  if (!Number.isFinite(breakMinutes) || breakMinutes < 1 || breakMinutes > 60) {
    return {
      valid: false,
      error: 'Break duration must be between 1 and 60 minutes.',
    };
  }
  return { valid: true };
}

export function validateDailyReview(input: {
  finishedSummary: string;
  oneWin: string;
}): { valid: boolean; error?: string } {
  if (!input.finishedSummary.trim() && !input.oneWin.trim()) {
    return {
      valid: false,
      error: 'Enter at least what you finished or one win from today.',
    };
  }
  return { valid: true };
}

export function validateWeeklyReview(input: {
  matteredMost: string;
  oneChangeNextWeek: string;
}): { valid: boolean; error?: string } {
  if (!input.matteredMost.trim() || !input.oneChangeNextWeek.trim()) {
    return {
      valid: false,
      error: 'Fill in what mattered most and one change for next week.',
    };
  }
  return { valid: true };
}

export function getCategoryLabel(category: TaskCategory): string {
  switch (category) {
    case 'study':
      return 'Study';
    case 'health':
      return 'Health';
    case 'project':
      return 'Project';
    case 'personal':
      return 'Personal';
  }
}

function escapeHtml(raw: string): string {
  return raw
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Generates a self-contained offline HTML report & embedded JSON snapshot
 * that opens cleanly in any browser without external assets or network requests.
 */
export function buildStandaloneHtmlBackup(
  data: WorkspaceData,
  todayKey: string,
): string {
  const summary = computeWeeklySummary(data, todayKey);
  const todayMustDos = getMustDosForDate(data.mustDos, todayKey);
  const recentReviews: DailyReview[] = Object.values(data.dailyReviews)
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
    .slice(0, 7);
  const recentWeekly: WeeklyReview[] = [...data.weeklyReviews].sort((a, b) =>
    b.weekOfDateKey.localeCompare(a.weekOfDateKey),
  );

  const safeJson = JSON.stringify(data).replaceAll('</script>', '<\\/script>');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AnchorDesk Backup (${escapeHtml(todayKey)})</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 820px; margin: 2rem auto; padding: 0 1.25rem; color: #0f172a; background: #f8fafc; line-height: 1.55; }
    h1, h2 { font-weight: 600; margin-bottom: 0.5rem; }
    .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 0.75rem; margin-bottom: 1rem; }
    .metric { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1rem; }
    .muted { color: #64748b; font-size: 0.875rem; }
    .val { font-size: 1.5rem; font-weight: 600; font-variant-numeric: tabular-nums; margin-top: 0.25rem; }
    ul { padding-left: 1.25rem; margin: 0.5rem 0 0; }
    li { margin-bottom: 0.35rem; }
  </style>
</head>
<body>
  <h1>AnchorDesk Personal Productivity Snapshot</h1>
  <p class="muted">Exported on ${escapeHtml(todayKey)} · Self-contained offline HTML backup</p>
  <div class="grid">
    <div class="metric"><div class="muted">Weekly Must-Dos</div><div class="val">${summary.totalMustDosCompleted}/${summary.totalMustDosPlanned} (${summary.completionRatePercent}%)</div></div>
    <div class="metric"><div class="muted">Weekly Focus</div><div class="val">${summary.totalFocusHours}h</div></div>
    <div class="metric"><div class="muted">Avg Phone Time</div><div class="val">${formatMinutesAsHm(summary.avgPhoneMinutes)}</div></div>
    <div class="metric"><div class="muted">Phone-Free Streak</div><div class="val">${summary.streaks.phoneFreeFirstBlockStreak}d</div></div>
  </div>
  <div class="card">
    <h2>Today's Must-Dos (${escapeHtml(todayKey)})</h2>
    <ul>
      ${
        todayMustDos.length === 0
          ? '<li>No must-dos logged for today.</li>'
          : todayMustDos
              .map(
                (t) =>
                  `<li>${t.completed ? '[Done]' : '[Todo]'} ${escapeHtml(t.description)} (${escapeHtml(getCategoryLabel(t.category))} · ${t.estimatedMinutes}m · ${escapeHtml(t.timeSlot)})</li>`,
              )
              .join('')
      }
    </ul>
  </div>
  <div class="card">
    <h2>Recent End-of-Day Reviews</h2>
    <ul>
      ${
        recentReviews.length === 0
          ? '<li>No reviews saved yet.</li>'
          : recentReviews
              .map(
                (r) =>
                  `<li><strong>${escapeHtml(r.dateKey)}</strong> (Energy ${r.energyLevel}/5): ${escapeHtml(r.oneWin || r.finishedSummary)}</li>`,
              )
              .join('')
      }
    </ul>
  </div>
  ${
    recentWeekly.length > 0
      ? `<div class="card"><h2>Weekly Reflections</h2><ul>${recentWeekly
          .map(
            (w) =>
              `<li><strong>Week of ${escapeHtml(w.weekOfDateKey)}</strong>: ${escapeHtml(w.matteredMost)} — Change: ${escapeHtml(w.oneChangeNextWeek)}</li>`,
          )
          .join('')}</ul></div>`
      : ''
  }
  <script id="anchordesk-backup-json" type="application/json">${safeJson}</script>
</body>
</html>`;
}
