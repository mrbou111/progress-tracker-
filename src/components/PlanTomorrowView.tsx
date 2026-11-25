import { useState } from 'react';
import { ArrowUpRight, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import type { MustDoTask, SmallTask, TaskCategory } from '../types/productivity';
import {
  getCategoryLabel,
  MAX_MUST_DOS_PER_DAY,
  validateMustDoDraft,
} from '../utils/analytics';
import { formatReadableDate } from '../utils/dateUtils';

interface PlanTomorrowViewProps {
  tomorrowKey: string;
  tomorrowMustDos: MustDoTask[];
  tomorrowSmallTasks: SmallTask[];
  isNightlyPlanConfirmed: boolean;
  onAddTomorrowMustDo: (draft: {
    description: string;
    category: TaskCategory;
    estimatedMinutes: number;
    timeSlot: string;
    confirmedGladIfOnlyThis: boolean;
  }) => void;
  onDeleteMustDo: (id: string) => void;
  onMoveMustDoToToday: (id: string) => void;
  onAddTomorrowSmallTask: (title: string) => void;
  onDeleteSmallTask: (id: string) => void;
  onConfirmNightlyPlan: () => void;
}

export function PlanTomorrowView({
  tomorrowKey,
  tomorrowMustDos,
  tomorrowSmallTasks,
  isNightlyPlanConfirmed,
  onAddTomorrowMustDo,
  onDeleteMustDo,
  onMoveMustDoToToday,
  onAddTomorrowSmallTask,
  onDeleteSmallTask,
  onConfirmNightlyPlan,
}: PlanTomorrowViewProps) {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('study');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(45);
  const [timeSlot, setTimeSlot] = useState('09:00 – 09:45');
  const [confirmedGlad, setConfirmedGlad] = useState(false);
  const [errors, setErrors] = useState<{
    limit?: string;
    description?: string;
    estimatedMinutes?: string;
    timeSlot?: string;
    confirmedGladIfOnlyThis?: string;
  }>({});

  const [smallTitle, setSmallTitle] = useState('');
  const [smallError, setSmallError] = useState<string | null>(null);

  const atLimit = tomorrowMustDos.length >= MAX_MUST_DOS_PER_DAY;

  const handleSubmitMustDo = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateMustDoDraft(
      {
        description,
        category,
        estimatedMinutes,
        timeSlot,
        confirmedGladIfOnlyThis: confirmedGlad,
      },
      tomorrowMustDos.length,
    );

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    onAddTomorrowMustDo({
      description: description.trim(),
      category,
      estimatedMinutes,
      timeSlot: timeSlot.trim(),
      confirmedGladIfOnlyThis: confirmedGlad,
    });
    setDescription('');
    setEstimatedMinutes(45);
    setConfirmedGlad(false);
    setErrors({});
  };

  const handleAddSmall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smallTitle.trim() || smallTitle.trim().length < 2) {
      setSmallError('Enter a short errand or admin task.');
      return;
    }
    onAddTomorrowSmallTask(smallTitle.trim());
    setSmallTitle('');
    setSmallError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Nightly Planning · {formatReadableDate(tomorrowKey)}
            </p>
            <h1 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
              Choose 1–3 Must-Do Tasks for Tomorrow
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Deciding tonight eliminates morning decision fatigue and keeps trivial tasks from stealing your best focus.
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
            <span
              data-testid="tomorrow-mustdo-count"
              className="font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100"
            >
              {tomorrowMustDos.length} / {MAX_MUST_DOS_PER_DAY} must-dos
            </span>
            <button
              type="button"
              disabled={tomorrowMustDos.length === 0}
              onClick={onConfirmNightlyPlan}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                isNightlyPlanConfirmed
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:disabled:bg-slate-700'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {isNightlyPlanConfirmed
                  ? 'Nightly Plan Confirmed'
                  : 'Confirm Nightly Plan'}
              </span>
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 7 columns: Must-Do Builder + List */}
        <div className="lg:col-span-7 space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Add a Must-Do Task
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Be specific: &quot;Solve 15 problems from ch. 4&quot;, not &quot;study chemistry&quot;.
              </p>
            </div>

            {atLimit ? (
              <div
                role="status"
                className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-800/70 dark:text-slate-300"
              >
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  Hard limit of {MAX_MUST_DOS_PER_DAY} must-do tasks reached
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Remove one below if priorities changed, or place extra errands in the Small Tasks batch.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitMustDo} className="space-y-4" noValidate>
                {errors.limit && (
                  <p className="text-xs font-medium text-red-600 dark:text-red-400" role="alert">
                    {errors.limit}
                  </p>
                )}

                <div className="space-y-1.5">
                  <label
                    htmlFor="tomorrow-desc-input"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Concrete description
                  </label>
                  <input
                    id="tomorrow-desc-input"
                    type="text"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (errors.description) {
                        setErrors({ ...errors, description: undefined });
                      }
                    }}
                    placeholder="e.g., Solve 15 problems from ch. 4"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  {errors.description && (
                    <p className="text-xs font-medium text-red-600 dark:text-red-400" role="alert">
                      {errors.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="tomorrow-cat-select"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      Category
                    </label>
                    <select
                      id="tomorrow-cat-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as TaskCategory)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <option value="study">Study</option>
                      <option value="health">Health</option>
                      <option value="project">Project</option>
                      <option value="personal">Personal</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="tomorrow-est-input"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      Estimated min
                    </label>
                    <input
                      id="tomorrow-est-input"
                      type="number"
                      min={5}
                      max={360}
                      value={estimatedMinutes}
                      onChange={(e) => {
                        setEstimatedMinutes(Number(e.target.value));
                        if (errors.estimatedMinutes) {
                          setErrors({ ...errors, estimatedMinutes: undefined });
                        }
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                    {errors.estimatedMinutes && (
                      <p className="text-xs font-medium text-red-600 dark:text-red-400" role="alert">
                        {errors.estimatedMinutes}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="tomorrow-slot-input"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                    >
                      Planned time slot
                    </label>
                    <input
                      id="tomorrow-slot-input"
                      type="text"
                      value={timeSlot}
                      onChange={(e) => {
                        setTimeSlot(e.target.value);
                        if (errors.timeSlot) {
                          setErrors({ ...errors, timeSlot: undefined });
                        }
                      }}
                      placeholder="09:00 – 09:45"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                    {errors.timeSlot && (
                      <p className="text-xs font-medium text-red-600 dark:text-red-400" role="alert">
                        {errors.timeSlot}
                      </p>
                    )}
                  </div>
                </div>

                {/* Mandatory Priority Confirmation Gate */}
                <div className="rounded-lg bg-slate-50 p-3.5 dark:bg-slate-800/70">
                  <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={confirmedGlad}
                      onChange={(e) => {
                        setConfirmedGlad(e.target.checked);
                        if (errors.confirmedGladIfOnlyThis) {
                          setErrors({
                            ...errors,
                            confirmedGladIfOnlyThis: undefined,
                          });
                        }
                      }}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                    />
                    <span>
                      If I only did this one thing tomorrow, would I be glad?
                    </span>
                  </label>
                  {errors.confirmedGladIfOnlyThis && (
                    <p
                      className="mt-1.5 pl-7 text-xs font-medium text-red-600 dark:text-red-400"
                      role="alert"
                    >
                      {errors.confirmedGladIfOnlyThis}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>Confirm Must-Do ({tomorrowMustDos.length}/3)</span>
                </button>
              </form>
            )}

            {/* Tomorrow's Must-Dos List */}
            <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Tomorrow&apos;s Locked Must-Dos
              </h3>
              {tomorrowMustDos.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  No must-dos set for tomorrow yet. Add 1–3 concrete priorities above.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
                  {tomorrowMustDos.map((task, idx) => (
                    <li
                      key={task.id}
                      className="flex items-start justify-between gap-3 py-3.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          <span className="font-mono text-xs text-blue-700 dark:text-blue-400 mr-2">
                            0{idx + 1}.
                          </span>
                          {task.description}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          {getCategoryLabel(task.category)} · {task.estimatedMinutes} min ·{' '}
                          {task.timeSlot}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onMoveMustDoToToday(task.id)}
                          title="Move to Today"
                          aria-label={`Move '${task.description}' to Today`}
                          className="inline-flex h-8 items-center gap-1 rounded px-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Today</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteMustDo(task.id)}
                          aria-label={`Remove tomorrow must-do '${task.description}'`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        {/* Right 5 columns: Separate Small Tasks Batch */}
        <div className="lg:col-span-5">
          <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-6 dark:border-slate-800 dark:bg-slate-900/60 space-y-4">
            <div className="border-b border-slate-200 pb-3 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Tomorrow&apos;s Small Tasks Batch
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Keep emails, errands, and admin separate from your 3 must-dos so they never disguise themselves as priorities.
              </p>
            </div>

            {tomorrowSmallTasks.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No small errands queued for tomorrow.
              </p>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {tomorrowSmallTasks.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-2 py-2.5 text-sm"
                  >
                    <span className="truncate text-slate-700 dark:text-slate-300">
                      {item.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteSmallTask(item.id)}
                      aria-label={`Remove tomorrow small task '${item.title}'`}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={handleAddSmall} className="space-y-2 pt-2" noValidate>
              <label
                htmlFor="tomorrow-small-input"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                Add email, errand, or admin item
              </label>
              <div className="flex gap-2">
                <input
                  id="tomorrow-small-input"
                  type="text"
                  value={smallTitle}
                  onChange={(e) => {
                    setSmallTitle(e.target.value);
                    if (smallError) setSmallError(null);
                  }}
                  placeholder="e.g., Pay dorm utilities or email TA"
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 whitespace-nowrap"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Add</span>
                </button>
              </div>
              {smallError && (
                <p className="text-xs text-red-600 dark:text-red-400" role="alert">
                  {smallError}
                </p>
              )}
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
