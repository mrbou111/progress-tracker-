import { useEffect, useState } from 'react';
import { DashboardView } from './components/DashboardView';
import { FocusTimerView } from './components/FocusTimerView';
import { PhoneTrackerView } from './components/PhoneTrackerView';
import { PlanTomorrowView } from './components/PlanTomorrowView';
import { ReviewView } from './components/ReviewView';
import { SaveModal } from './components/SaveModal';
import { TodayView } from './components/TodayView';
import { TopNav } from './components/TopNav';
import { createSeedWorkspace } from './data/seedWorkspace';
import type {
  DailyReview,
  FocusSession,
  PhoneDayLog,
  PhoneHabits,
  TabId,
  TaskCategory,
  WeeklyReview,
  WorkspaceData,
} from './types/productivity';
import { getMustDosForDate, getSmallTasksForDate } from './utils/analytics';
import { getTodayKey, getTomorrowKey } from './utils/dateUtils';
import {
  loadFromIndexedDb,
  loadFromLocalStorage,
  saveToIndexedDb,
  saveToLocalStorage,
} from './utils/storagePersistence';

function loadInitialWorkspace(): WorkspaceData {
  return loadFromLocalStorage() ?? createSeedWorkspace();
}

export default function App() {
  const [data, setData] = useState<WorkspaceData>(() => loadInitialWorkspace());
  const [activeTab, setActiveTab] = useState<TabId>('today');
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);
  const [storageAvailable, setStorageAvailable] = useState<boolean>(true);
  const [lastSavedLabel, setLastSavedLabel] = useState<string | null>(null);
  const [savedJustNow, setSavedJustNow] = useState<boolean>(false);

  const todayKey = getTodayKey();
  const tomorrowKey = getTomorrowKey();

  // If localStorage was empty on startup, check IndexedDB mirror for prior saved progress
  useEffect(() => {
    if (loadFromLocalStorage() !== null) return;
    let active = true;
    loadFromIndexedDb().then((idbData) => {
      if (active && idbData) {
        setData(idbData);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Persist workspace to both localStorage and IndexedDB
  useEffect(() => {
    const lsOk = saveToLocalStorage(data);
    saveToIndexedDb(data).then((idbOk) => {
      setStorageAvailable(lsOk || idbOk);
      if (lsOk || idbOk) {
        setLastSavedLabel(
          new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        );
      }
    });
  }, [data]);

  // Sync Tailwind .dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (data.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [data.theme]);

  const todayMustDos = getMustDosForDate(data.mustDos, todayKey);
  const todaySmallTasks = getSmallTasksForDate(data.smallTasks, todayKey);
  const tomorrowMustDos = getMustDosForDate(data.mustDos, tomorrowKey);
  const tomorrowSmallTasks = getSmallTasksForDate(data.smallTasks, tomorrowKey);

  const handleToggleTheme = () => {
    setData((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  const handleToggleMustDo = (id: string) => {
    setData((prev) => ({
      ...prev,
      mustDos: prev.mustDos.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t,
      ),
    }));
  };

  const handleDeleteMustDo = (id: string) => {
    setData((prev) => ({
      ...prev,
      mustDos: prev.mustDos.filter((t) => t.id !== id),
    }));
  };

  const handleMoveMustDoToToday = (id: string) => {
    setData((prev) => ({
      ...prev,
      mustDos: prev.mustDos.map((t) =>
        t.id === id ? { ...t, dateKey: todayKey } : t,
      ),
    }));
  };

  const handleAddTomorrowMustDo = (draft: {
    description: string;
    category: TaskCategory;
    estimatedMinutes: number;
    timeSlot: string;
    confirmedGladIfOnlyThis: boolean;
  }) => {
    setData((prev) => ({
      ...prev,
      mustDos: [
        ...prev.mustDos,
        {
          id: `md-${Date.now()}`,
          dateKey: tomorrowKey,
          description: draft.description,
          category: draft.category,
          estimatedMinutes: draft.estimatedMinutes,
          timeSlot: draft.timeSlot,
          confirmedGladIfOnlyThis: draft.confirmedGladIfOnlyThis,
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
      plannedNightBeforeDates: prev.plannedNightBeforeDates.includes(todayKey)
        ? prev.plannedNightBeforeDates
        : [...prev.plannedNightBeforeDates, todayKey],
    }));
  };

  const handleConfirmNightlyPlan = () => {
    setData((prev) => ({
      ...prev,
      plannedNightBeforeDates: prev.plannedNightBeforeDates.includes(todayKey)
        ? prev.plannedNightBeforeDates
        : [...prev.plannedNightBeforeDates, todayKey],
    }));
  };

  const handleToggleSmallTask = (id: string) => {
    setData((prev) => ({
      ...prev,
      smallTasks: prev.smallTasks.map((s) =>
        s.id === id ? { ...s, completed: !s.completed } : s,
      ),
    }));
  };

  const handleAddSmallTask = (dateKey: string, title: string) => {
    setData((prev) => ({
      ...prev,
      smallTasks: [
        ...prev.smallTasks,
        {
          id: `st-${Date.now()}`,
          dateKey,
          title,
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  };

  const handleDeleteSmallTask = (id: string) => {
    setData((prev) => ({
      ...prev,
      smallTasks: prev.smallTasks.filter((s) => s.id !== id),
    }));
  };

  const handleStartFocusFromTask = (taskId: string) => {
    setFocusTaskId(taskId);
    setActiveTab('focus');
  };

  const handleLogFocusSession = (
    session: Omit<FocusSession, 'id' | 'completedAt'>,
  ) => {
    setData((prev) => ({
      ...prev,
      focusSessions: [
        {
          ...session,
          id: `fs-${Date.now()}`,
          completedAt: new Date().toISOString(),
        },
        ...prev.focusSessions,
      ],
    }));
  };

  const handleSaveTodayPhoneLog = (log: PhoneDayLog) => {
    setData((prev) => ({
      ...prev,
      phoneLogs: {
        ...prev.phoneLogs,
        [todayKey]: log,
      },
    }));
  };

  const handleToggleHabit = (habitKey: keyof PhoneHabits) => {
    setData((prev) => {
      const existing = prev.phoneLogs[todayKey] ?? {
        dateKey: todayKey,
        screenTimeMinutes: 0,
        topDrainApps: [],
        habits: {
          phoneOutOfReachFirstBlock: false,
          noPhoneFirst30Min: false,
          noPhoneBeforeSleep: false,
        },
      };
      return {
        ...prev,
        phoneLogs: {
          ...prev.phoneLogs,
          [todayKey]: {
            ...existing,
            habits: {
              ...existing.habits,
              [habitKey]: !existing.habits[habitKey],
            },
          },
        },
      };
    });
  };

  const handleAddReplacementActivity = (activity: string) => {
    setData((prev) => ({
      ...prev,
      replacementActivities: [...prev.replacementActivities, activity],
    }));
  };

  const handleDeleteReplacementActivity = (index: number) => {
    setData((prev) => ({
      ...prev,
      replacementActivities: prev.replacementActivities.filter(
        (_, i) => i !== index,
      ),
    }));
  };

  const handleSaveDailyReview = (review: DailyReview) => {
    setData((prev) => ({
      ...prev,
      dailyReviews: {
        ...prev.dailyReviews,
        [review.dateKey]: review,
      },
    }));
  };

  const handleSaveWeeklyReview = (
    review: Omit<WeeklyReview, 'id' | 'savedAt'>,
  ) => {
    setData((prev) => ({
      ...prev,
      weeklyReviews: [
        {
          ...review,
          id: `wr-${Date.now()}`,
          savedAt: new Date().toISOString(),
        },
        ...prev.weeklyReviews,
      ],
    }));
  };

  const handleRestoreSampleData = () => {
    setData((prev) => ({
      ...createSeedWorkspace(),
      theme: prev.theme,
    }));
  };

  const handleResetBlankData = () => {
    setData((prev) => ({
      theme: prev.theme,
      dailyPhoneLimitMinutes: 90,
      mustDos: [],
      smallTasks: [],
      focusSessions: [],
      phoneLogs: {},
      replacementActivities: [
        'Walk for 10 minutes without earbuds',
        'Stretch shoulders and neck',
        'Read 10 pages of a book',
        'Text a friend to grab coffee',
      ],
      dailyReviews: {},
      weeklyReviews: [],
      plannedNightBeforeDates: [],
    }));
  };

  const handleSaveNow = async () => {
    const lsOk = saveToLocalStorage(data);
    const idbOk = await saveToIndexedDb(data);
    setStorageAvailable(lsOk || idbOk);
    setLastSavedLabel(
      new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    );
    setSavedJustNow(true);
    window.setTimeout(() => setSavedJustNow(false), 2000);
  };

  const handleOpenSave = () => {
    void handleSaveNow();
    setSaveModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-150">
      <TopNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        theme={data.theme}
        onToggleTheme={handleToggleTheme}
        onOpenSave={handleOpenSave}
        savedJustNow={savedJustNow}
      />

      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {activeTab === 'today' && (
          <TodayView
            todayKey={todayKey}
            mustDos={todayMustDos}
            smallTasks={todaySmallTasks}
            onToggleMustDo={handleToggleMustDo}
            onDeleteMustDo={handleDeleteMustDo}
            onStartFocus={handleStartFocusFromTask}
            onToggleSmallTask={handleToggleSmallTask}
            onAddSmallTask={(title) => handleAddSmallTask(todayKey, title)}
            onDeleteSmallTask={handleDeleteSmallTask}
            onGoToPlanTomorrow={() => setActiveTab('plan')}
          />
        )}

        {activeTab === 'plan' && (
          <PlanTomorrowView
            tomorrowKey={tomorrowKey}
            tomorrowMustDos={tomorrowMustDos}
            tomorrowSmallTasks={tomorrowSmallTasks}
            isNightlyPlanConfirmed={data.plannedNightBeforeDates.includes(todayKey)}
            onAddTomorrowMustDo={handleAddTomorrowMustDo}
            onDeleteMustDo={handleDeleteMustDo}
            onMoveMustDoToToday={handleMoveMustDoToToday}
            onAddTomorrowSmallTask={(title) =>
              handleAddSmallTask(tomorrowKey, title)
            }
            onDeleteSmallTask={handleDeleteSmallTask}
            onConfirmNightlyPlan={handleConfirmNightlyPlan}
          />
        )}

        {activeTab === 'focus' && (
          <FocusTimerView
            todayKey={todayKey}
            todayMustDos={todayMustDos}
            todaySmallTasks={todaySmallTasks}
            selectedTaskId={focusTaskId}
            onSelectTaskId={setFocusTaskId}
            sessions={data.focusSessions}
            onLogSession={handleLogFocusSession}
          />
        )}

        {activeTab === 'phone' && (
          <PhoneTrackerView
            todayKey={todayKey}
            todayLog={data.phoneLogs[todayKey]}
            dailyPhoneLimitMinutes={data.dailyPhoneLimitMinutes}
            replacementActivities={data.replacementActivities}
            onSaveTodayPhoneLog={handleSaveTodayPhoneLog}
            onUpdateDailyLimit={(mins) =>
              setData((prev) => ({ ...prev, dailyPhoneLimitMinutes: mins }))
            }
            onToggleHabit={handleToggleHabit}
            onAddReplacementActivity={handleAddReplacementActivity}
            onDeleteReplacementActivity={handleDeleteReplacementActivity}
          />
        )}

        {activeTab === 'review' && (
          <ReviewView
            todayKey={todayKey}
            data={data}
            todayMustDos={todayMustDos}
            onSaveDailyReview={handleSaveDailyReview}
            onSaveWeeklyReview={handleSaveWeeklyReview}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            todayKey={todayKey}
            data={data}
            onRestoreSampleData={handleRestoreSampleData}
            onResetBlankData={handleResetBlankData}
            onImportData={setData}
          />
        )}
      </main>

      <SaveModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        todayKey={todayKey}
        data={data}
        storageAvailable={storageAvailable}
        lastSavedLabel={lastSavedLabel}
        onSaveNow={handleSaveNow}
        onImportData={setData}
      />
    </div>
  );
}
