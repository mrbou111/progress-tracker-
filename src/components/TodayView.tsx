import { useState } from 'react';
import { ArrowRight, Check, Play, Plus, Trash2 } from 'lucide-react';
import type { MustDoTask, SmallTask } from '../types/productivity';
import { getCategoryLabel, getMustDoProgress } from '../utils/analytics';
import { formatReadableDate } from '../utils/dateUtils';

interface TodayViewProps {
  todayKey: string;
  mustDos: MustDoTask[];
  smallTasks: SmallTask[];
  onToggleMustDo: (id: string) => void;
  onDeleteMustDo: (id: string) => void;
  onStartFocus: (taskId: string) => void;
  onToggleSmallTask: (id: string) => void;
  onAddSmallTask: (title: string) => void;
  onDeleteSmallTask: (id: string) => void;
  onGoToPlanTomorrow: () => void;
}

export function TodayView({
  todayKey,
  mustDos,
  smallTasks,
  onToggleMustDo,
  onDeleteMustDo,
  onStartFocus,
  onToggleSmallTask,
  onAddSmallTask,
  onDeleteSmallTask,
  onGoToPlanTomorrow,
}: TodayViewProps) {
  const [smallInput, setSmallInput] = useState('');
  const [smallError, setSmallError] = useState<string | null>(null);

  const progress = getMustDoProgress(mustDos);
  const doneSmallCount = smallTasks.filter((t) => t.completed).length;

  const handleAddSmall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smallInput.trim() || smallInput.trim().length < 2) {
      setSmallError('Enter a short task name.');
      return;
    }
    onAddSmallTask(smallInput.trim());
    setSmallInput('');
    setSmallError(null);
  };

  return (
    <div className="space-y-6">
      {/* Gentle Reminder + Progress Header */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {formatReadableDate(todayKey)}
            </p>
            <h1 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
              Hard thing first. Phone away.
            </h1>
          </div>

          <div className="text-left sm:text-right">
            <p
              data-testid="today-progress-label"
              className="font-mono text-lg font-semibold tabular-nums text-blue-700 dark:text-blue-400"
            >
              {progress.label}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {progress.ratePercent}% of today&apos;s priorities
            </p>
          </div>
        </div>

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-200"
            style={{ width: `${progress.ratePercent}%` }}
          />
        </div>
      </section>

      {/* Top Section: Large, Clear Must-Do Tasks */}
      <section
        aria-labelledby="today-mustdos-heading"
        className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <h2
              id="today-mustdos-heading"
              className="text-base font-semibold text-slate-900 dark:text-slate-100"
            >
              Today&apos;s Must-Dos
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Finish these before opening non-urgent emails or social feeds.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToPlanTomorrow}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline dark:text-blue-400 whitespace-nowrap"
          >
            <span>Plan Tomorrow</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        {mustDos.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              No must-do tasks scheduled for today yet
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Set 1–3 concrete tasks in Plan Tomorrow (or bring tomorrow&apos;s tasks forward).
            </p>
            <button
              type="button"
              onClick={onGoToPlanTomorrow}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <span>Choose 1–3 Must-Dos</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {mustDos.map((task) => (
              <div
                key={task.id}
                className="flex items-start justify-between gap-3 py-4 sm:items-center"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => onToggleMustDo(task.id)}
                    aria-label={
                      task.completed
                        ? `Mark '${task.description}' incomplete`
                        : `Mark '${task.description}' complete`
                    }
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors ${
                      task.completed
                        ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500'
                        : 'border-slate-300 bg-white hover:border-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-blue-400'
                    }`}
                  >
                    {task.completed && (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <p
                      className={`text-sm sm:text-base font-medium leading-snug ${
                        task.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {task.description}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      <span>{getCategoryLabel(task.category)}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{task.estimatedMinutes} min</span>
                      <span aria-hidden="true"> · </span>
                      <span>{task.timeSlot}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {!task.completed && (
                    <button
                      type="button"
                      onClick={() => onStartFocus(task.id)}
                      aria-label={`Start focus timer for '${task.description}'`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-medium text-slate-800 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
                    >
                      <Play className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="hidden sm:inline">Focus</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteMustDo(task.id)}
                    aria-label={`Delete '${task.description}'`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bottom Section: Visually Quieter Small-Tasks Batch */}
      <section
        aria-labelledby="today-small-batch-heading"
        className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/60"
      >
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2
              id="today-small-batch-heading"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Small Tasks Batch
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Emails, errands, and quick admin — handle together after your must-dos.
            </p>
          </div>
          <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
            {doneSmallCount}/{smallTasks.length}
          </span>
        </div>

        {smallTasks.length > 0 && (
          <ul className="divide-y divide-slate-200/80 dark:divide-slate-800">
            {smallTasks.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 py-2.5 text-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => onToggleSmallTask(item.id)}
                    aria-label={
                      item.completed
                        ? `Mark small task '${item.title}' incomplete`
                        : `Mark small task '${item.title}' complete`
                    }
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      item.completed
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800'
                    }`}
                  >
                    {item.completed && (
                      <Check className="h-3 w-3" aria-hidden="true" />
                    )}
                  </button>
                  <span
                    className={`truncate text-xs sm:text-sm ${
                      item.completed
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.title}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteSmallTask(item.id)}
                  aria-label={`Delete small task '${item.title}'`}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAddSmall} className="mt-3 flex gap-2" noValidate>
          <label htmlFor="today-small-task-input" className="sr-only">
            Add small task to today&apos;s batch
          </label>
          <input
            id="today-small-task-input"
            type="text"
            value={smallInput}
            onChange={(e) => {
              setSmallInput(e.target.value);
              if (smallError) setSmallError(null);
            }}
            placeholder="Quick add small task (e.g., Reply to advisor email)..."
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Add</span>
          </button>
        </form>
        {smallError && (
          <p className="mt-1.5 text-xs text-red-600 dark:text-red-400" role="alert">
            {smallError}
          </p>
        )}
      </section>
    </div>
  );
}
