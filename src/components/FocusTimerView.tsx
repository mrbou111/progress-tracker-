import { useEffect, useState } from 'react';
import { CheckCircle2, Pause, Play, RotateCcw } from 'lucide-react';
import type { FocusSession, MustDoTask, SmallTask } from '../types/productivity';
import {
  getFocusMinutesForDate,
  validateCustomTimer,
} from '../utils/analytics';
import { formatCountdown, formatMinutesAsHm } from '../utils/dateUtils';

interface FocusTimerViewProps {
  todayKey: string;
  todayMustDos: MustDoTask[];
  todaySmallTasks: SmallTask[];
  selectedTaskId: string | null;
  onSelectTaskId: (taskId: string) => void;
  sessions: FocusSession[];
  onLogSession: (session: Omit<FocusSession, 'id' | 'completedAt'>) => void;
}

type PresetKey = '25/5' | '45/10' | '60/10' | 'custom';

const PRESETS: Array<{ key: PresetKey; label: string; focus: number; brk: number }> = [
  { key: '25/5', label: '25 / 5', focus: 25, brk: 5 },
  { key: '45/10', label: '45 / 10', focus: 45, brk: 10 },
  { key: '60/10', label: '60 / 10', focus: 60, brk: 10 },
  { key: 'custom', label: 'Custom', focus: 35, brk: 7 },
];

export function FocusTimerView({
  todayKey,
  todayMustDos,
  todaySmallTasks,
  selectedTaskId,
  onSelectTaskId,
  sessions,
  onLogSession,
}: FocusTimerViewProps) {
  const linkableTasks = [
    ...todayMustDos.map((t) => ({
      id: t.id,
      label: `Must-Do: ${t.description}`,
    })),
    ...todaySmallTasks.map((s) => ({
      id: s.id,
      label: `Small Task: ${s.title}`,
    })),
  ];

  const activeTask =
    linkableTasks.find((t) => t.id === selectedTaskId) ??
    linkableTasks[0] ?? { id: 'general', label: 'Deep study block' };

  const [presetKey, setPresetKey] = useState<PresetKey>('45/10');
  const [focusMinutes, setFocusMinutes] = useState<number>(45);
  const [breakMinutes, setBreakMinutes] = useState<number>(10);
  const [customError, setCustomError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'focus' | 'break'>('focus');
  const [secondsLeft, setSecondsLeft] = useState<number>(45 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const [phoneOutOfReach, setPhoneOutOfReach] = useState<boolean>(false);
  const [notificationsOff, setNotificationsOff] = useState<boolean>(false);
  const [loggedBanner, setLoggedBanner] = useState<string | null>(null);

  useEffect(() => {
    if (!isRunning) return;
    const timerId = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [isRunning]);

  const checklistReady = phoneOutOfReach && notificationsOff;

  const handleSelectPreset = (key: PresetKey) => {
    const found = PRESETS.find((p) => p.key === key)!;
    setPresetKey(key);
    setIsRunning(false);
    setPhase('focus');
    setCustomError(null);
    if (key !== 'custom') {
      setFocusMinutes(found.focus);
      setBreakMinutes(found.brk);
      setSecondsLeft(found.focus * 60);
    } else {
      setSecondsLeft(focusMinutes * 60);
    }
  };

  const handleApplyCustom = (nextFocus: number, nextBreak: number) => {
    setFocusMinutes(nextFocus);
    setBreakMinutes(nextBreak);
    const validation = validateCustomTimer(nextFocus, nextBreak);
    if (!validation.valid) {
      setCustomError(validation.error ?? 'Invalid custom length');
      return;
    }
    setCustomError(null);
    setIsRunning(false);
    setSecondsLeft((phase === 'focus' ? nextFocus : nextBreak) * 60);
  };

  const handleSwitchPhase = (nextPhase: 'focus' | 'break') => {
    setIsRunning(false);
    setPhase(nextPhase);
    setSecondsLeft((nextPhase === 'focus' ? focusMinutes : breakMinutes) * 60);
  };

  const handleCompleteAndLog = () => {
    const elapsedMinutes = Math.max(
      1,
      Math.round((focusMinutes * 60 - secondsLeft) / 60) || focusMinutes,
    );
    onLogSession({
      dateKey: todayKey,
      taskId: activeTask.id,
      taskTitle: activeTask.label.replace(/^(Must-Do|Small Task): /, ''),
      focusMinutes: phase === 'focus' ? elapsedMinutes : focusMinutes,
      breakMinutes,
      presetLabel: presetKey === 'custom' ? 'Custom' : presetKey,
      phoneChecklistConfirmed: checklistReady,
    });
    setIsRunning(false);
    setPhase('break');
    setSecondsLeft(breakMinutes * 60);
    setLoggedBanner(
      `Logged ${phase === 'focus' ? elapsedMinutes : focusMinutes} minutes toward "${activeTask.label.replace(/^(Must-Do|Small Task): /, '')}".`,
    );
  };

  const todaySessions = sessions.filter((s) => s.dateKey === todayKey);
  const todayTotalFocus = getFocusMinutesForDate(sessions, todayKey);
  const totalDurationSeconds = (phase === 'focus' ? focusMinutes : breakMinutes) * 60;
  const progressPercent = Math.round(
    ((totalDurationSeconds - secondsLeft) / Math.max(1, totalDurationSeconds)) * 100,
  );

  return (
    <div className="space-y-6">
      {loggedBanner && (
        <div
          role="status"
          className="flex items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
        >
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{loggedBanner}</span>
          </span>
          <button
            type="button"
            onClick={() => setLoggedBanner(null)}
            className="text-xs font-medium hover:underline whitespace-nowrap"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 7 columns: Timer & Pre-start Phone Checklist */}
        <section className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-6">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Focus Timer
              </h1>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                One task, one interval, zero phone access.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800 self-start">
              {PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => handleSelectPreset(preset.key)}
                  className={`rounded-md px-2.5 py-1.5 font-mono text-xs font-medium tabular-nums transition-colors whitespace-nowrap ${
                    presetKey === preset.key
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {presetKey === 'custom' && (
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/70">
              <div className="space-y-1">
                <label
                  htmlFor="custom-focus-mins"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Focus (min)
                </label>
                <input
                  id="custom-focus-mins"
                  type="number"
                  min={5}
                  max={180}
                  value={focusMinutes}
                  onChange={(e) =>
                    handleApplyCustom(Number(e.target.value), breakMinutes)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm tabular-nums text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="custom-break-mins"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Break (min)
                </label>
                <input
                  id="custom-break-mins"
                  type="number"
                  min={1}
                  max={60}
                  value={breakMinutes}
                  onChange={(e) =>
                    handleApplyCustom(focusMinutes, Number(e.target.value))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm tabular-nums text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              {customError && (
                <p className="col-span-2 text-xs font-medium text-red-600 dark:text-red-400" role="alert">
                  {customError}
                </p>
              )}
            </div>
          )}

          {/* Task Link Selector */}
          <div className="space-y-1.5">
            <label
              htmlFor="focus-linked-task"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              Link this session to a task
            </label>
            <select
              id="focus-linked-task"
              value={activeTask.id}
              onChange={(e) => onSelectTaskId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {linkableTasks.length === 0 ? (
                <option value="general">Deep study block (no tasks queued)</option>
              ) : (
                linkableTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Countdown Box */}
          <div className="rounded-lg bg-slate-50 p-6 text-center dark:bg-slate-800/70">
            <div className="inline-flex items-center gap-1 rounded-lg bg-slate-200/80 p-1 dark:bg-slate-700/80">
              <button
                type="button"
                onClick={() => handleSwitchPhase('focus')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  phase === 'focus'
                    ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Focus
              </button>
              <button
                type="button"
                onClick={() => handleSwitchPhase('break')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  phase === 'break'
                    ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Break
              </button>
            </div>

            <p
              data-testid="focus-countdown"
              className="mt-4 font-mono text-5xl font-semibold tracking-tight tabular-nums text-slate-900 dark:text-slate-100 sm:text-6xl"
            >
              {formatCountdown(secondsLeft)}
            </p>

            <div className="mx-auto mt-4 h-2 max-w-sm overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Pre-Start Phone Checklist */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Before starting ({(phoneOutOfReach ? 1 : 0) + (notificationsOff ? 1 : 0)}/2 checked)
            </p>
            <div className="divide-y divide-slate-200 border-t border-b border-slate-200 dark:divide-slate-800 dark:border-slate-800">
              <label className="flex cursor-pointer items-center gap-3 py-2.5 text-sm text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={phoneOutOfReach}
                  onChange={(e) => setPhoneOutOfReach(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span>Phone out of reach?</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 py-2.5 text-sm text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={notificationsOff}
                  onChange={(e) => setNotificationsOff(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span>Notifications off?</span>
              </label>
            </div>
            {!checklistReady && phase === 'focus' && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Confirm both checks above to unlock Start Focus.
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={Boolean(customError) || (phase === 'focus' && !checklistReady)}
                onClick={() => setIsRunning((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:disabled:bg-slate-700 transition-colors whitespace-nowrap"
              >
                {isRunning ? (
                  <>
                    <Pause className="h-4 w-4" aria-hidden="true" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" aria-hidden="true" />
                    <span>{phase === 'focus' ? 'Start Focus' : 'Start Break'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsRunning(false);
                  setSecondsLeft((phase === 'focus' ? focusMinutes : breakMinutes) * 60);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>Reset</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleCompleteAndLog}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 transition-colors whitespace-nowrap"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              <span>Complete &amp; Log Session</span>
            </button>
          </div>
        </section>

        {/* Right 5 columns: Today's Total & Session Log */}
        <section className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-5">
          <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Focus Time Today
            </p>
            <p
              data-testid="today-focus-total"
              className="mt-1 font-mono text-3xl font-semibold tabular-nums text-slate-900 dark:text-slate-100"
            >
              {formatMinutesAsHm(todayTotalFocus)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {todaySessions.length} session{todaySessions.length === 1 ? '' : 's'} logged today
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Completed Sessions Today
            </h2>
            {todaySessions.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                No sessions completed yet today. Check the phone checklist and start your first block.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
                {todaySessions.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-start justify-between gap-3 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                        {s.taskTitle}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        {s.presetLabel} · Phone checklist confirmed
                      </p>
                    </div>
                    <span className="font-mono text-xs font-semibold tabular-nums text-emerald-700 dark:text-emerald-400 shrink-0">
                      +{s.focusMinutes}m
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
