import { useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileCode2,
  Save,
  Upload,
  X,
} from 'lucide-react';
import type { WorkspaceData } from '../types/productivity';
import { buildStandaloneAppHtml } from '../utils/standaloneHtmlApp';
import { parseImportedWorkspaceJson } from '../utils/storagePersistence';

interface SaveModalProps {
  open: boolean;
  onClose: () => void;
  todayKey: string;
  data: WorkspaceData;
  storageAvailable: boolean;
  lastSavedLabel: string | null;
  onSaveNow: () => Promise<void>;
  onImportData: (nextData: WorkspaceData) => void;
}

export function SaveModal({
  open,
  onClose,
  todayKey,
  data,
  storageAvailable,
  lastSavedLabel,
  onSaveNow,
  onImportData,
}: SaveModalProps) {
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  if (!open) return null;

  const handleDownloadJson = () => {
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

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = parseImportedWorkspaceJson(String(reader.result ?? ''));
      if (!result.ok) {
        setImportError(result.error);
        setImportSuccess(null);
        return;
      }
      onImportData(result.data);
      setImportError(null);
      setImportSuccess('Restored saved progress from backup file.');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-modal-heading"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2
            id="save-modal-heading"
            className="text-base font-semibold text-slate-900 dark:text-slate-100"
          >
            Save &amp; Offline App
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close save dialog"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div
            role="status"
            className={`rounded-lg px-4 py-3 text-xs font-medium ${
              storageAvailable
                ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
                : 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {storageAvailable
                  ? lastSavedLabel
                    ? `Saved in this browser (${lastSavedLabel}).`
                    : 'Auto-save is active in this browser.'
                  : 'Browser storage is restricted when closing this tab. Download a backup file or offline HTML copy below to keep your progress.'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={onSaveNow}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              <span>Save Progress Now</span>
            </button>

            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/50 space-y-2.5">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Use Offline as a Single HTML File (No Setup Needed)
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Download <strong>AnchorDesk.html</strong> and double-click it on your computer to run the full interactive app offline, with all your current tasks and a built-in Save button inside.
              </p>
              <button
                type="button"
                onClick={handleDownloadStandaloneHtml}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 transition-colors"
              >
                <FileCode2 className="h-4 w-4" aria-hidden="true" />
                <span>Download Working App (AnchorDesk.html)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleDownloadJson}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Save Backup (.json)</span>
              </button>

              <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Load Backup (.json)</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportFile}
                  className="sr-only"
                />
              </label>
            </div>

            {importError && (
              <p className="text-xs font-medium text-red-600 dark:text-red-400" role="alert">
                {importError}
              </p>
            )}
            {importSuccess && (
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400" role="status">
                {importSuccess}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
