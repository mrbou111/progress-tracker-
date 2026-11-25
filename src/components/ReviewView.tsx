import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type {
  DailyReview,
  MustDoTask,
  WeeklyReview,
  WorkspaceData,
} from '../types/productivity';
import {
  computeWeeklySummary,
  validateDailyReview,
  validateWeeklyReview,
} from '../utils/analytics';
import { formatMinutesAsHm, formatReadableDate } from '../utils/dateUtils';

interface ReviewViewProps {
  todayKey: string;
  data: WorkspaceData;
  todayMustDos: MustDoTask[];
  onSaveDailyReview: (review: DailyReview) => void;
  onSaveWeeklyReview: (review: Omit<WeeklyReview, 'id' | 'savedAt'>) => void;
}

export function ReviewView({
  todayKey,
  data,
  todayMustDos,
  onSaveDailyReview,
  onSaveWeeklyReview,
}: ReviewViewProps) {
  const [mode, setMode] = useState<'daily' | 'weekly'>('daily');

  const existingDaily = data.dailyReviews[todayKey];
  const [finishedSummary, setFinishedSummary] = useState(
    existingDaily?.finishedSummary ?? '',
  );
  const [distractions, setDistractions] = useState(
    existingDaily?.distractions ?? '',
  );
  const [energyLevel, setEnergyLevel] = useState<1 | 2 | 3 | 4 | 5>(
    existingDaily?.energyLevel ?? 3,
  );
  const [oneWin, setOneWin] = useState(existingDaily?.oneWin ?? '');
  const [dailyError, setDailyError] = useState<string | null>(null);
  const [dailySavedNotice, setDailySavedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (existingDaily) {
      setFinishedSummary(existingDaily.finishedSummary);
      setDistractions(existingDaily.distractions);
      setEnergyLevel(existingDaily.energyLevel);
      setOneWin(existingDaily.oneWin);
    }
  }, [existingDaily]);

  const weeklySummary = computeWeeklySummary(data, todayKey);
  const [matteredMost, setMatteredMost] = useState('');
  const [wastedTime, setWastedTime] = useState('');
  const [oneChangeNextWeek, setOneChangeNextWeek] = useState('');
  const [weeklyError, setWeeklyError] = useState<string | null>(null);
  const [weeklySavedNotice, setWeeklySavedNotice] = useState<string | null>(null);

  const handlePrefillDone = () => {
    const completed = todayMustDos
      .filter((t) => t.completed)
      .map((t) => t.description);
    if (completed.length > 0) {
      setFinishedSummary(completed.join('; '));
    } else {
      setFinishedSummary('Worked through study blocks.');
    }
  };

  const handleSubmitDaily = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateDailyReview({ finishedSummary, oneWin });
    if (!validation.valid) {
      setDailyError(validation.error ?? 'Please fill in your review.');
      return;
    }

    onSaveDailyReview({
      dateKey: todayKey,
      finishedSummary: finishedSummary.trim(),
      distractions: distractions.trim() || 'None noted',
      energyLevel,
      oneWin: oneWin.trim(),
      savedAt: new Date().toISOString(),
    });
    setDailyError(null);
    setDailySavedNotice(`Saved End-of-Day Review for ${todayKey}.`);
  };

  const handleSubmitWeekly = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateWeeklyReview({
      matteredMost,
      oneChangeNextWeek,
    });
    if (!validation.valid) {
      setWeeklyError(validation.error ?? 'Please complete the weekly prompts.');
      return;
    }

    onSaveWeeklyReview({
      weekOfDateKey: weeklySummary.startDateKey,
      matteredMost: matteredMost.trim(),
      wastedTime: wastedTime.trim() || 'None noted',
      oneChangeNextWeek: oneChangeNextWeek.trim(),
    });
    setMatteredMost('');
    setWastedTime('');
    setOneChangeNextWeek('');
    setWeeklyError(null);
    setWeeklySavedNotice(
      `Saved Weekly Review for week starting ${weeklySummary.startDateKey}.`,
    );
  };

  const pastDailyReviews = Object.values(data.dailyReviews).sort((a, b) =>
    b.dateKey.localeCompare(a.dateKey),
  );
  const pastWeeklyReviews = [...data.weeklyReviews].sort((a, b) =>
    b.weekOfDateKey.localeCompare(a.weekOfDateKey),
  );

  return (
    <div className="space-y-6">
      {/* Header & Mode Switcher */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Reflect &amp; Calibrate
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Short daily and weekly check-ins turn raw hours into clear feedback.
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800 self-start">
            <button
              type="button"
              onClick={() => setMode('daily')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                mode === 'daily'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              End-of-Day (2 min)
            </button>
            <button
              type="button"
              onClick={() => setMode('weekly')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                mode === 'weekly'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              Weekly Review (15 min)
            </button>
          </div>
        </div>
      </section>

      {mode === 'daily' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  End-of-Day Review · {formatReadableDate(todayKey)}
                </h2>
              </div>
              <button
                type="button"
                onClick={handlePrefillDone}
                className="text-xs font-medium text-blue-700 hover:underline dark:text-blue-400 whitespace-nowrap"
              >
                Pre-fill completed tasks
              </button>
            </div>

            <form onSubmit={handleSubmitDaily} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label
                  htmlFor="daily-finished-input"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  What did I finish?
                </label>
                <textarea
                  id="daily-finished-input"
                  rows={2}
                  value={finishedSummary}
                  onChange={(e) => {
                    setFinishedSummary(e.target.value);
                    if (dailyError) setDailyError(null);
                  }}
                  placeholder="List the meaningful things you completed today..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="daily-distracted-input"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  What distracted me?
                </label>
                <input
                  id="daily-distracted-input"
                  type="text"
                  value={distractions}
                  onChange={(e) => setDistractions(e.target.value)}
                  placeholder="e.g., Phone checks between classes, replying to club chats"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1.5">
                <span className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Energy level (1–5)
                </span>
                <div className="flex items-center gap-2">
                  {([1, 2, 3, 4, 5] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setEnergyLevel(lvl)}
                      aria-label={`Energy level ${lvl} of 5`}
                      className={`h-10 w-10 rounded-lg border font-mono text-sm font-semibold tabular-nums transition-colors ${
                        energyLevel === lvl
                          ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="daily-win-input"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  One win from today
                </label>
                <input
                  id="daily-win-input"
                  type="text"
                  value={oneWin}
                  onChange={(e) => {
                    setOneWin(e.target.value);
                    if (dailyError) setDailyError(null);
                  }}
                  placeholder="e.g., Kept my phone in my backpack during my morning block"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              {dailyError && (
                <p className="text-xs font-medium text-red-600 dark:text-red-400" role="alert">
                  {dailyError}
                </p>
              )}

              {dailySavedNotice && (
                <p
                  role="status"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  <span>{dailySavedNotice}</span>
                </p>
              )}

              <div>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                >
                  Save Today&apos;s Review
                </button>
              </div>
            </form>
          </section>

          <section className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Saved Daily Reviews
            </h2>
            {pastDailyReviews.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No reviews saved yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {pastDailyReviews.slice(0, 7).map((rev) => (
                  <article key={rev.dateKey} className="py-3.5 space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono">{rev.dateKey}</span>
                      <span className="font-mono tabular-nums">
                        Energy {rev.energyLevel}/5
                      </span>
                    </div>
                    {rev.oneWin && (
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Win: {rev.oneWin}
                      </p>
                    )}
                    {rev.finishedSummary && (
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Finished: {rev.finishedSummary}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Auto-Summarized Weekly Numbers */}
          <section
            aria-label="Weekly auto summary"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Must-Dos Completed
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {weeklySummary.totalMustDosCompleted} / {weeklySummary.totalMustDosPlanned}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {weeklySummary.completionRatePercent}% completion rate
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total Focus Hours
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {weeklySummary.totalFocusHours} hrs
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {weeklySummary.totalFocusMinutes} minutes across 7 days
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Average Daily Phone Time
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {formatMinutesAsHm(weeklySummary.avgPhoneMinutes)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {weeklySummary.daysUnderPhoneLimit}/{weeklySummary.phoneLoggedDays} days under limit
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Active Habit Streaks
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                {weeklySummary.streaks.phoneFreeFirstBlockStreak}d
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                Phone-free block · {weeklySummary.streaks.plannedNightBeforeStreak}d planning
              </p>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <section className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-5">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Weekly Reflection ({weeklySummary.startDateKey} to {weeklySummary.endDateKey})
              </h2>

              <form onSubmit={handleSubmitWeekly} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <label
                    htmlFor="weekly-mattered-input"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    What mattered most this week?
                  </label>
                  <textarea
                    id="weekly-mattered-input"
                    rows={2}
                    value={matteredMost}
                    onChange={(e) => {
                      setMatteredMost(e.target.value);
                      if (weeklyError) setWeeklyError(null);
                    }}
                    placeholder="Which assignment, study routine, or habit moved things forward?"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="weekly-wasted-input"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    What wasted my time?
                  </label>
                  <textarea
                    id="weekly-wasted-input"
                    rows={2}
                    value={wastedTime}
                    onChange={(e) => setWastedTime(e.target.value)}
                    placeholder="Where did effort or phone time leak away?"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="weekly-change-input"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    What one thing will I change next week?
                  </label>
                  <input
                    id="weekly-change-input"
                    type="text"
                    value={oneChangeNextWeek}
                    onChange={(e) => {
                      setOneChangeNextWeek(e.target.value);
                      if (weeklyError) setWeeklyError(null);
                    }}
                    placeholder="Pick one small, specific adjustment..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                {weeklyError && (
                  <p className="text-xs font-medium text-red-600 dark:text-red-400" role="alert">
                    {weeklyError}
                  </p>
                )}

                {weeklySavedNotice && (
                  <p
                    role="status"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <span>{weeklySavedNotice}</span>
                  </p>
                )}

                <div>
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                  >
                    Save Weekly Reflection
                  </button>
                </div>
              </form>
            </section>

            <section className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Past Weekly Reflections
              </h2>
              {pastWeeklyReviews.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No weekly reflections saved yet.
                </p>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {pastWeeklyReviews.map((wr) => (
                    <article key={wr.id} className="py-3.5 space-y-1.5">
                      <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                        Week of {wr.weekOfDateKey}
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {wr.matteredMost}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Next week: {wr.oneChangeNextWeek}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
