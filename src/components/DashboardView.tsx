import { useState } from 'react';
import { Download, FileCode2, RotateCcw, Trash2, Upload } from 'lucide-react';
import type { WorkspaceData } from '../types/productivity';
import {
  computeAllStreaks,
  computeDashboardSeries,
  getSupportiveMessage,
} from '../utils/analytics';
import { formatMinutesAsHm } from '../utils/dateUtils';
import { buildStandaloneAppHtml } from '../utils/standaloneHtmlApp';
import { parseImportedWorkspaceJson } from '../utils/storagePersistence';

interface DashboardViewProps {
  todayKey: string;
  data: WorkspaceData;
  onRestoreSampleData: () => void;
  onResetBlankData: () => void;
  onImportData: (nextData: WorkspaceData) => void;
}

export function DashboardView({
  todayKey,
  data,
  onRestoreSampleData,
  onResetBlankData,
  onImportData,
}: DashboardViewProps) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  const series = computeDashboardSeries(data, todayKey);
  const streaks = computeAllStreaks(data, todayKey);
  const message = getSupportiveMessage(data, todayKey);

  const maxFocus = Math.max(60, ...series.map((d) => d.focusMinutes));
  const maxPhone = Math.max(
    data.dailyPhoneLimitMinutes + 30,
    ...series.map((d) => d.phoneMinutes ?? 0),
  );

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anchordesk-backup-${todayKey}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadStandaloneHtml = () => {
    const html = buildStandaloneAppHtml(data);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AnchorDesk.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = parseImportedWorkspaceJson(String(reader.result ?? ''));
      if (!res.ok) {
        setImportFeedback(res.error);
        return;
      }
      onImportData(res.data);
      setImportFeedback('Restored backup successfully.');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Helper for SVG line coordinates
  const buildPolylinePoints = (
    values: Array<number | null>,
    maxVal: number,
    width: number,
    height: number,
    padX: number,
    padY: number,
  ): Array<{ x: number; y: number; value: number }> => {
    const usableW = width - padX * 2;
    const usableH = height - padY * 2;
    const stepX = values.length > 1 ? usableW / (values.length - 1) : 0;

    return values
      .map((val, idx) => {
        if (val === null) return null;
        const x = padX + idx * stepX;
        const ratio = Math.max(0, Math.min(1, val / Math.max(1, maxVal)));
        const y = padY + usableH * (1 - ratio);
        return { x, y, value: val };
      })
      .filter((pt): pt is { x: number; y: number; value: number } => pt !== null);
  };

  const phonePoints = buildPolylinePoints(
    series.map((d) => d.phoneMinutes),
    maxPhone,
    360,
    136,
    24,
    24,
  );
  const phoneGoalY =
    24 +
    (136 - 48) *
      (1 - Math.min(1, data.dailyPhoneLimitMinutes / Math.max(1, maxPhone)));

  const energyPoints = buildPolylinePoints(
    series.map((d) => d.energyLevel),
    5,
    360,
    136,
    24,
    24,
  );

  return (
    <div className="space-y-6">
      {/* Motivating, Non-Guilt Message */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
          Progress Check-In
        </p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100 text-balance">
          {message.headline}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          {message.detail}
        </p>
      </section>

      {/* Current Streaks */}
      <section
        aria-label="Current habit streaks"
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Planning Night Before
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {streaks.plannedNightBeforeStreak} day{streaks.plannedNightBeforeStreak === 1 ? '' : 's'}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Consecutive plans confirmed
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Phone-Free First Block
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
            {streaks.phoneFreeFirstBlockStreak} day{streaks.phoneFreeFirstBlockStreak === 1 ? '' : 's'}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Phone kept out of reach
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Must-Dos Completed
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-blue-700 dark:text-blue-400">
            {streaks.mustDosCompletedStreak} day{streaks.mustDosCompletedStreak === 1 ? '' : 's'}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            All daily must-dos checked
          </p>
        </div>
      </section>

      {/* 4 Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 1: Focus Time Per Day */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2 pb-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Focus Time per Day (7 days)
            </h2>
            <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
              min / day
            </span>
          </div>
          <div className="grid grid-cols-7 items-end gap-2 h-40 pt-4">
            {series.map((day) => {
              const barPct = Math.round((day.focusMinutes / maxFocus) * 100);
              return (
                <div
                  key={day.dateKey}
                  className="flex h-full flex-col items-center justify-end gap-1.5"
                >
                  <span className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                    {day.focusMinutes > 0 ? `${day.focusMinutes}m` : '0'}
                  </span>
                  <div className="flex w-full flex-1 items-end justify-center">
                    <div
                      className="w-full max-w-[30px] rounded-t bg-blue-600 dark:bg-blue-500 transition-all duration-200"
                      style={{ height: `${Math.max(4, barPct)}%` }}
                      title={`${day.label}: ${day.focusMinutes}m`}
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {day.label.split(',')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Chart 2: Must-Do Completion Rate */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2 pb-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Must-Do Completion Rate
            </h2>
            <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
              % completed
            </span>
          </div>
          <div className="grid grid-cols-7 items-end gap-2 h-40 pt-4">
            {series.map((day) => (
              <div
                key={day.dateKey}
                className="flex h-full flex-col items-center justify-end gap-1.5"
              >
                <span className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                  {day.mustDosTotal > 0 ? `${day.mustDoRate}%` : '—'}
                </span>
                <div className="flex w-full flex-1 items-end justify-center">
                  <div
                    className="w-full max-w-[30px] rounded-t bg-emerald-600 dark:bg-emerald-500 transition-all duration-200"
                    style={{
                      height: `${day.mustDosTotal > 0 ? Math.max(6, day.mustDoRate) : 4}%`,
                      opacity: day.mustDosTotal > 0 ? 1 : 0.2,
                    }}
                    title={`${day.label}: ${day.mustDosDone}/${day.mustDosTotal}`}
                  />
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {day.label.split(',')[0]}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Chart 3: Phone Time Trend */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2 pb-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Phone Time Trend
            </h2>
            <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
              Goal: {formatMinutesAsHm(data.dailyPhoneLimitMinutes)}
            </span>
          </div>

          <svg
            viewBox="0 0 360 150"
            role="img"
            aria-label="7-day phone screen time trend chart"
            className="w-full h-40 overflow-visible"
          >
            {/* Dashed goal reference line */}
            <line
              x1={16}
              y1={phoneGoalY}
              x2={344}
              y2={phoneGoalY}
              stroke="currentColor"
              className="text-amber-500/70"
              strokeDasharray="4 4"
              strokeWidth="1.5"
            />
            {phonePoints.length >= 2 && (
              <polyline
                fill="none"
                stroke="currentColor"
                className="text-slate-700 dark:text-slate-300"
                strokeWidth="2"
                points={phonePoints.map((p) => `${p.x},${p.y}`).join(' ')}
              />
            )}
            {phonePoints.map((pt, i) => (
              <g key={i}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="4"
                  className={
                    pt.value <= data.dailyPhoneLimitMinutes
                      ? 'fill-emerald-600 dark:fill-emerald-400'
                      : 'fill-amber-600 dark:fill-amber-400'
                  }
                />
                <text
                  x={pt.x}
                  y={pt.y - 8}
                  textAnchor="middle"
                  className="fill-slate-500 dark:fill-slate-400 text-[9px] font-mono"
                >
                  {formatMinutesAsHm(pt.value)}
                </text>
              </g>
            ))}
            {series.map((day, idx) => {
              const x = 24 + (idx * (360 - 48)) / Math.max(1, series.length - 1);
              return (
                <text
                  key={day.dateKey}
                  x={x}
                  y={145}
                  textAnchor="middle"
                  className="fill-slate-500 dark:fill-slate-400 text-[10px]"
                >
                  {day.label.split(',')[0]}
                </text>
              );
            })}
          </svg>
        </section>

        {/* Chart 4: Energy Levels Over Time */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2 pb-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Energy Levels Over Time
            </h2>
            <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
              1–5 scale
            </span>
          </div>

          <svg
            viewBox="0 0 360 150"
            role="img"
            aria-label="7-day energy levels trend chart"
            className="w-full h-40 overflow-visible"
          >
            {[1, 3, 5].map((lvl) => {
              const y = 16 + (130 - 32) * (1 - lvl / 5);
              return (
                <line
                  key={lvl}
                  x1={16}
                  y1={y}
                  x2={344}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeWidth="1"
                />
              );
            })}
            {energyPoints.length >= 2 && (
              <polyline
                fill="none"
                stroke="currentColor"
                className="text-blue-600 dark:text-blue-400"
                strokeWidth="2.2"
                points={energyPoints.map((p) => `${p.x},${p.y}`).join(' ')}
              />
            )}
            {energyPoints.map((pt, i) => (
              <g key={i}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="4"
                  className="fill-blue-600 dark:fill-blue-400"
                />
                <text
                  x={pt.x}
                  y={pt.y - 8}
                  textAnchor="middle"
                  className="fill-slate-600 dark:fill-slate-300 text-[10px] font-mono"
                >
                  {pt.value}/5
                </text>
              </g>
            ))}
            {series.map((day, idx) => {
              const x = 24 + (idx * (360 - 48)) / Math.max(1, series.length - 1);
              return (
                <text
                  key={day.dateKey}
                  x={x}
                  y={145}
                  textAnchor="middle"
                  className="fill-slate-500 dark:fill-slate-400 text-[10px]"
                >
                  {day.label.split(',')[0]}
                </text>
              );
            })}
          </svg>
        </section>
      </div>

      {/* Data Export & Reset Section */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Data Backup &amp; Reset
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Download <strong>AnchorDesk.html</strong> to run the full app offline by double-clicking it, or save/load a JSON backup.
            </p>
            {importFeedback && (
              <p className="mt-1 text-xs font-medium text-blue-700 dark:text-blue-400" role="status">
                {importFeedback}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Export JSON</span>
            </button>

            <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap">
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Import JSON</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleImportJson}
                className="sr-only"
              />
            </label>

            <button
              type="button"
              onClick={handleDownloadStandaloneHtml}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 whitespace-nowrap"
            >
              <FileCode2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Download Working App (.html)</span>
            </button>

            <button
              type="button"
              onClick={onRestoreSampleData}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Restore Sample Week</span>
            </button>

            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-medium text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 whitespace-nowrap"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Reset Data</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onResetBlankData();
                    setConfirmReset(false);
                  }}
                  className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 whitespace-nowrap"
                >
                  Confirm Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 whitespace-nowrap"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
