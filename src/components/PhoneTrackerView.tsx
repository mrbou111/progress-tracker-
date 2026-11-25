import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import type { PhoneDayLog, PhoneHabits } from '../types/productivity';
import { getPhoneLimitStatus } from '../utils/analytics';
import { formatMinutesAsHm, formatReadableDate } from '../utils/dateUtils';

interface PhoneTrackerViewProps {
  todayKey: string;
  todayLog: PhoneDayLog | undefined;
  dailyPhoneLimitMinutes: number;
  replacementActivities: string[];
  onSaveTodayPhoneLog: (log: PhoneDayLog) => void;
  onUpdateDailyLimit: (minutes: number) => void;
  onToggleHabit: (habitKey: keyof PhoneHabits) => void;
  onAddReplacementActivity: (activity: string) => void;
  onDeleteReplacementActivity: (index: number) => void;
}

const DEFAULT_HABITS: PhoneHabits = {
  phoneOutOfReachFirstBlock: false,
  noPhoneFirst30Min: false,
  noPhoneBeforeSleep: false,
};

export function PhoneTrackerView({
  todayKey,
  todayLog,
  dailyPhoneLimitMinutes,
  replacementActivities,
  onSaveTodayPhoneLog,
  onUpdateDailyLimit,
  onToggleHabit,
  onAddReplacementActivity,
  onDeleteReplacementActivity,
}: PhoneTrackerViewProps) {
  const initialMins = todayLog?.screenTimeMinutes ?? 0;
  const [hours, setHours] = useState<number>(Math.floor(initialMins / 60));
  const [minutes, setMinutes] = useState<number>(initialMins % 60);
  const [appsInput, setAppsInput] = useState<string>(
    todayLog?.topDrainApps.join(', ') ?? '',
  );
  const [limitMinutesInput, setLimitMinutesInput] = useState<number>(
    dailyPhoneLimitMinutes,
  );
  const [entryError, setEntryError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const [newActivity, setNewActivity] = useState('');
  const [activityError, setActivityError] = useState<string | null>(null);

  useEffect(() => {
    const mins = todayLog?.screenTimeMinutes ?? 0;
    setHours(Math.floor(mins / 60));
    setMinutes(mins % 60);
    setAppsInput(todayLog?.topDrainApps.join(', ') ?? '');
  }, [todayLog]);

  useEffect(() => {
    setLimitMinutesInput(dailyPhoneLimitMinutes);
  }, [dailyPhoneLimitMinutes]);

  const habits = todayLog?.habits ?? DEFAULT_HABITS;
  const status = getPhoneLimitStatus(todayLog, dailyPhoneLimitMinutes);

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !Number.isFinite(hours) ||
      !Number.isFinite(minutes) ||
      hours < 0 ||
      hours > 16 ||
      minutes < 0 ||
      minutes > 59
    ) {
      setEntryError('Enter hours (0–16) and minutes (0–59).');
      return;
    }

    const totalMinutes = hours * 60 + minutes;
    if (totalMinutes <= 0) {
      setEntryError('Enter at least 1 minute to log today’s screen time.');
      return;
    }

    const topDrainApps = appsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);

    onSaveTodayPhoneLog({
      dateKey: todayKey,
      screenTimeMinutes: totalMinutes,
      topDrainApps,
      habits,
    });
    setEntryError(null);
    setSavedNotice(
      totalMinutes <= dailyPhoneLimitMinutes
        ? `Logged ${formatMinutesAsHm(totalMinutes)} — stayed under your ${formatMinutesAsHm(dailyPhoneLimitMinutes)} goal.`
        : `Logged ${formatMinutesAsHm(totalMinutes)} — over your ${formatMinutesAsHm(dailyPhoneLimitMinutes)} goal.`,
    );
  };

  const handleSaveLimit = (nextLimit: number) => {
    setLimitMinutesInput(nextLimit);
    if (Number.isFinite(nextLimit) && nextLimit >= 15 && nextLimit <= 480) {
      onUpdateDailyLimit(nextLimit);
    }
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.trim() || newActivity.trim().length < 2) {
      setActivityError('Enter a short offline activity.');
      return;
    }
    onAddReplacementActivity(newActivity.trim());
    setNewActivity('');
    setActivityError(null);
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {formatReadableDate(todayKey)} · Daily Goal {formatMinutesAsHm(dailyPhoneLimitMinutes)}
            </p>
            <h1 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
              Phone Usage &amp; Daily Habits
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <label
              htmlFor="daily-phone-limit"
              className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap"
            >
              Daily limit (min)
            </label>
            <input
              id="daily-phone-limit"
              type="number"
              min={15}
              max={480}
              step={15}
              value={limitMinutesInput}
              onChange={(e) => handleSaveLimit(Number(e.target.value))}
              className="w-24 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
          {status === 'under' && todayLog && (
            <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                Under Goal today: {formatMinutesAsHm(todayLog.screenTimeMinutes)} logged (limit {formatMinutesAsHm(dailyPhoneLimitMinutes)})
              </span>
            </p>
          )}
          {status === 'over' && todayLog && (
            <p className="inline-flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                Over Goal today: {formatMinutesAsHm(todayLog.screenTimeMinutes)} logged (limit {formatMinutesAsHm(dailyPhoneLimitMinutes)}) — pick a replacement reset below
              </span>
            </p>
          )}
          {status === 'unlogged' && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No screen time entered yet for today. Log your check-in below.
            </p>
          )}
        </div>
      </section>

      {/* Suggestion Banner on Bad Phone Day */}
      {status === 'over' && replacementActivities.length > 0 && (
        <section
          role="status"
          aria-label="Replacement activity suggestions"
          className="rounded-xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-900/60 dark:bg-amber-950/30"
        >
          <h2 className="text-sm font-semibold text-amber-950 dark:text-amber-200">
            Reset Without Guilt: Try One 5-Minute Replacement
          </h2>
          <p className="mt-1 text-xs text-amber-900 dark:text-amber-300">
            Today went above your limit. Next time you reach for your phone during a pause, pick one of your offline resets instead:
          </p>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {replacementActivities.map((act, idx) => (
              <li
                key={`${act}-${idx}`}
                className="rounded-lg bg-white/80 px-3.5 py-2 text-xs font-medium text-slate-800 dark:bg-slate-900/80 dark:text-slate-200"
              >
                {act}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 7 columns: Manual Entry + Daily Habit Checkboxes */}
        <div className="lg:col-span-7 space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Log Today&apos;s Screen Time
            </h2>

            <form onSubmit={handleSaveEntry} className="space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="phone-hours-input"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Hours
                  </label>
                  <input
                    id="phone-hours-input"
                    type="number"
                    min={0}
                    max={16}
                    value={hours}
                    onChange={(e) => {
                      setHours(Number(e.target.value));
                      if (entryError) setEntryError(null);
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 font-mono text-sm tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="phone-minutes-input"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Minutes
                  </label>
                  <input
                    id="phone-minutes-input"
                    type="number"
                    min={0}
                    max={59}
                    value={minutes}
                    onChange={(e) => {
                      setMinutes(Number(e.target.value));
                      if (entryError) setEntryError(null);
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 font-mono text-sm tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="phone-apps-input"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Top 2–3 apps that drained your time (comma-separated)
                </label>
                <input
                  id="phone-apps-input"
                  type="text"
                  value={appsInput}
                  onChange={(e) => setAppsInput(e.target.value)}
                  placeholder="e.g., Instagram, YouTube, TikTok"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              {entryError && (
                <p className="text-xs font-medium text-red-600 dark:text-red-400" role="alert">
                  {entryError}
                </p>
              )}

              {savedNotice && (
                <p className="text-xs font-medium text-blue-700 dark:text-blue-400" role="status">
                  {savedNotice}
                </p>
              )}

              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
              >
                Save Screen Time Log
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Daily Phone Habits
            </h2>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              <label className="flex cursor-pointer items-center gap-3 py-3 text-sm text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={habits.phoneOutOfReachFirstBlock}
                  onChange={() => onToggleHabit('phoneOutOfReachFirstBlock')}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span>Phone out of reach during first study block</span>
              </label>

              <label className="flex cursor-pointer items-center gap-3 py-3 text-sm text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={habits.noPhoneFirst30Min}
                  onChange={() => onToggleHabit('noPhoneFirst30Min')}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span>No phone first 30 min after waking</span>
              </label>

              <label className="flex cursor-pointer items-center gap-3 py-3 text-sm text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={habits.noPhoneBeforeSleep}
                  onChange={() => onToggleHabit('noPhoneBeforeSleep')}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span>No phone before sleep</span>
              </label>
            </div>
          </section>
        </div>

        {/* Right 5 columns: Editable Replacement Activity List */}
        <section className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="border-b border-slate-200 pb-3 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Replacement Activities
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Easy 5-minute offline defaults to swap in when you feel tempted to scroll.
            </p>
          </div>

          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {replacementActivities.map((activity, index) => (
              <li
                key={`${activity}-${index}`}
                className="flex items-center justify-between gap-2 py-2.5 text-sm text-slate-800 dark:text-slate-200"
              >
                <span>{activity}</span>
                <button
                  type="button"
                  onClick={() => onDeleteReplacementActivity(index)}
                  aria-label={`Remove replacement activity '${activity}'`}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>

          <form onSubmit={handleAddActivity} className="space-y-2 pt-2" noValidate>
            <label
              htmlFor="new-replacement-input"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              Add replacement activity
            </label>
            <div className="flex gap-2">
              <input
                id="new-replacement-input"
                type="text"
                value={newActivity}
                onChange={(e) => {
                  setNewActivity(e.target.value);
                  if (activityError) setActivityError(null);
                }}
                placeholder="e.g., Make tea or step outside"
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Add</span>
              </button>
            </div>
            {activityError && (
              <p className="text-xs text-red-600 dark:text-red-400" role="alert">
                {activityError}
              </p>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}
