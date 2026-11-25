export type TabId =
  | 'today'
  | 'plan'
  | 'focus'
  | 'phone'
  | 'review'
  | 'dashboard';

export type TaskCategory = 'study' | 'health' | 'project' | 'personal';

export interface MustDoTask {
  id: string;
  dateKey: string; // YYYY-MM-DD
  description: string;
  category: TaskCategory;
  estimatedMinutes: number;
  timeSlot: string;
  confirmedGladIfOnlyThis: boolean;
  completed: boolean;
  createdAt: string;
}

export interface SmallTask {
  id: string;
  dateKey: string; // YYYY-MM-DD
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface FocusSession {
  id: string;
  dateKey: string; // YYYY-MM-DD
  taskId: string;
  taskTitle: string;
  focusMinutes: number;
  breakMinutes: number;
  presetLabel: string;
  phoneChecklistConfirmed: boolean;
  completedAt: string; // ISO string or readable time
}

export interface PhoneHabits {
  phoneOutOfReachFirstBlock: boolean;
  noPhoneFirst30Min: boolean;
  noPhoneBeforeSleep: boolean;
}

export interface PhoneDayLog {
  dateKey: string; // YYYY-MM-DD
  screenTimeMinutes: number;
  topDrainApps: string[];
  habits: PhoneHabits;
}

export interface DailyReview {
  dateKey: string; // YYYY-MM-DD
  finishedSummary: string;
  distractions: string;
  energyLevel: 1 | 2 | 3 | 4 | 5;
  oneWin: string;
  savedAt: string;
}

export interface WeeklyReview {
  id: string;
  weekOfDateKey: string; // YYYY-MM-DD (Monday or start of 7-day window)
  matteredMost: string;
  wastedTime: string;
  oneChangeNextWeek: string;
  savedAt: string;
}

export interface WorkspaceData {
  theme: 'light' | 'dark';
  dailyPhoneLimitMinutes: number;
  mustDos: MustDoTask[];
  smallTasks: SmallTask[];
  focusSessions: FocusSession[];
  phoneLogs: Record<string, PhoneDayLog>;
  replacementActivities: string[];
  dailyReviews: Record<string, DailyReview>;
  weeklyReviews: WeeklyReview[];
  plannedNightBeforeDates: string[]; // dateKeys for which tomorrow's plan was confirmed the night before
}
