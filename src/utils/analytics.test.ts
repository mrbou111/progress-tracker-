import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildStandaloneHtmlBackup,
  computeAllStreaks,
  computeDashboardSeries,
  computeWeeklySummary,
  getMustDoProgress,
  getPhoneLimitStatus,
  getSupportiveMessage,
  MAX_MUST_DOS_PER_DAY,
  validateCustomTimer,
  validateMustDoDraft,
} from './analytics';
import { addDaysToDateKey, formatCountdown, formatMinutesAsHm } from './dateUtils';
import { buildStandaloneAppHtml } from './standaloneHtmlApp';
import { parseImportedWorkspaceJson } from './storagePersistence';
import type { WorkspaceData } from '../types/productivity';

function makeEmptyWorkspace(): WorkspaceData {
  return {
    theme: 'light',
    dailyPhoneLimitMinutes: 90,
    mustDos: [],
    smallTasks: [],
    focusSessions: [],
    phoneLogs: {},
    replacementActivities: ['Walk', 'Stretch'],
    dailyReviews: {},
    weeklyReviews: [],
    plannedNightBeforeDates: [],
  };
}

test('validateMustDoDraft enforces hard limit of 3 must-dos and glad confirmation', () => {
  const missingConfirm = validateMustDoDraft(
    {
      description: 'Solve 15 problems from ch. 4',
      category: 'study',
      estimatedMinutes: 45,
      timeSlot: '09:00 - 09:45',
      confirmedGladIfOnlyThis: false,
    },
    1,
  );
  assert.equal(missingConfirm.valid, false);
  assert.ok(missingConfirm.errors.confirmedGladIfOnlyThis);

  const atLimit = validateMustDoDraft(
    {
      description: 'Solve 15 problems from ch. 4',
      category: 'study',
      estimatedMinutes: 45,
      timeSlot: '09:00 - 09:45',
      confirmedGladIfOnlyThis: true,
    },
    MAX_MUST_DOS_PER_DAY,
  );
  assert.equal(atLimit.valid, false);
  assert.ok(atLimit.errors.limit);

  const ok = validateMustDoDraft(
    {
      description: 'Solve 15 problems from ch. 4',
      category: 'study',
      estimatedMinutes: 45,
      timeSlot: '09:00 - 09:45',
      confirmedGladIfOnlyThis: true,
    },
    2,
  );
  assert.equal(ok.valid, true);
});

test('getMustDoProgress computes completion counts and percentages cleanly', () => {
  const progress = getMustDoProgress([
    {
      id: '1',
      dateKey: '2026-11-24',
      description: 'Task A',
      category: 'study',
      estimatedMinutes: 45,
      timeSlot: '09:00',
      confirmedGladIfOnlyThis: true,
      completed: true,
      createdAt: '2026-11-24T08:00:00Z',
    },
    {
      id: '2',
      dateKey: '2026-11-24',
      description: 'Task B',
      category: 'project',
      estimatedMinutes: 60,
      timeSlot: '11:00',
      confirmedGladIfOnlyThis: true,
      completed: true,
      createdAt: '2026-11-24T08:00:00Z',
    },
    {
      id: '3',
      dateKey: '2026-11-24',
      description: 'Task C',
      category: 'health',
      estimatedMinutes: 30,
      timeSlot: '17:00',
      confirmedGladIfOnlyThis: true,
      completed: false,
      createdAt: '2026-11-24T08:00:00Z',
    },
  ]);

  assert.equal(progress.completedCount, 2);
  assert.equal(progress.totalCount, 3);
  assert.equal(progress.ratePercent, 67);
  assert.equal(progress.label, '2/3 must-dos done');
});

test('computeAllStreaks tracks consecutive days across planning, phone-free blocks, and must-dos', () => {
  const today = '2026-11-24';
  const d1 = addDaysToDateKey(today, -1);
  const d2 = addDaysToDateKey(today, -2);
  const d3 = addDaysToDateKey(today, -3);

  const data = makeEmptyWorkspace();
  data.plannedNightBeforeDates = [d2, d1, today];
  data.phoneLogs = {
    [d3]: {
      dateKey: d3,
      screenTimeMinutes: 100,
      topDrainApps: ['Instagram'],
      habits: {
        phoneOutOfReachFirstBlock: false,
        noPhoneFirst30Min: false,
        noPhoneBeforeSleep: false,
      },
    },
    [d2]: {
      dateKey: d2,
      screenTimeMinutes: 80,
      topDrainApps: ['YouTube'],
      habits: {
        phoneOutOfReachFirstBlock: true,
        noPhoneFirst30Min: true,
        noPhoneBeforeSleep: false,
      },
    },
    [d1]: {
      dateKey: d1,
      screenTimeMinutes: 70,
      topDrainApps: ['YouTube'],
      habits: {
        phoneOutOfReachFirstBlock: true,
        noPhoneFirst30Min: true,
        noPhoneBeforeSleep: true,
      },
    },
  };
  data.mustDos = [
    {
      id: 'm1',
      dateKey: d1,
      description: 'Finished yesterday',
      category: 'study',
      estimatedMinutes: 45,
      timeSlot: '09:00',
      confirmedGladIfOnlyThis: true,
      completed: true,
      createdAt: '2026-11-23T08:00:00Z',
    },
    {
      id: 'm2',
      dateKey: today,
      description: 'Not done yet today',
      category: 'study',
      estimatedMinutes: 45,
      timeSlot: '09:00',
      confirmedGladIfOnlyThis: true,
      completed: false,
      createdAt: '2026-11-24T08:00:00Z',
    },
  ];

  const streaks = computeAllStreaks(data, today);
  assert.equal(streaks.plannedNightBeforeStreak, 3);
  assert.equal(streaks.phoneFreeFirstBlockStreak, 2);
  assert.equal(streaks.mustDosCompletedStreak, 1);
});

test('computeWeeklySummary and computeDashboardSeries aggregate 7-day metrics', () => {
  const today = '2026-11-24';
  const yesterday = addDaysToDateKey(today, -1);
  const data = makeEmptyWorkspace();

  data.mustDos = [
    {
      id: 'a',
      dateKey: yesterday,
      description: 'Read ch 2',
      category: 'study',
      estimatedMinutes: 30,
      timeSlot: '09:00',
      confirmedGladIfOnlyThis: true,
      completed: true,
      createdAt: '2026-11-23T08:00:00Z',
    },
    {
      id: 'b',
      dateKey: today,
      description: 'Write essay intro',
      category: 'study',
      estimatedMinutes: 45,
      timeSlot: '10:00',
      confirmedGladIfOnlyThis: true,
      completed: false,
      createdAt: '2026-11-24T08:00:00Z',
    },
  ];

  data.focusSessions = [
    {
      id: 'f1',
      dateKey: yesterday,
      taskId: 'a',
      taskTitle: 'Read ch 2',
      focusMinutes: 45,
      breakMinutes: 10,
      presetLabel: '45/10',
      phoneChecklistConfirmed: true,
      completedAt: '2026-11-23T09:50:00Z',
    },
    {
      id: 'f2',
      dateKey: today,
      taskId: 'b',
      taskTitle: 'Write essay intro',
      focusMinutes: 45,
      breakMinutes: 10,
      presetLabel: '45/10',
      phoneChecklistConfirmed: true,
      completedAt: '2026-11-24T10:50:00Z',
    },
  ];

  data.phoneLogs = {
    [yesterday]: {
      dateKey: yesterday,
      screenTimeMinutes: 80,
      topDrainApps: ['Instagram'],
      habits: {
        phoneOutOfReachFirstBlock: true,
        noPhoneFirst30Min: true,
        noPhoneBeforeSleep: true,
      },
    },
    [today]: {
      dateKey: today,
      screenTimeMinutes: 120,
      topDrainApps: ['TikTok'],
      habits: {
        phoneOutOfReachFirstBlock: true,
        noPhoneFirst30Min: false,
        noPhoneBeforeSleep: false,
      },
    },
  };

  data.dailyReviews = {
    [yesterday]: {
      dateKey: yesterday,
      finishedSummary: 'Read ch 2',
      distractions: 'None',
      energyLevel: 4,
      oneWin: 'Stayed under phone cap',
      savedAt: '2026-11-23T21:00:00Z',
    },
  };

  const weekly = computeWeeklySummary(data, today);
  assert.equal(weekly.totalMustDosPlanned, 2);
  assert.equal(weekly.totalMustDosCompleted, 1);
  assert.equal(weekly.completionRatePercent, 50);
  assert.equal(weekly.totalFocusMinutes, 90);
  assert.equal(weekly.totalFocusHours, 1.5);
  assert.equal(weekly.avgPhoneMinutes, 100);
  assert.equal(weekly.daysUnderPhoneLimit, 1);

  const series = computeDashboardSeries(data, today);
  assert.equal(series.length, 7);
  assert.equal(series[5].energyLevel, 4);
  assert.equal(series[6].phoneMinutes, 120);
  assert.equal(getPhoneLimitStatus(data.phoneLogs[yesterday], 90), 'under');
  assert.equal(getPhoneLimitStatus(data.phoneLogs[today], 90), 'over');
});

test('validateCustomTimer, formatting, supportive message, and HTML backup work cleanly', () => {
  assert.equal(validateCustomTimer(3, 5).valid, false);
  assert.equal(validateCustomTimer(50, 10).valid, true);
  assert.equal(formatMinutesAsHm(135), '2h 15m');
  assert.equal(formatCountdown(90), '01:30');

  const data = makeEmptyWorkspace();
  const msg = getSupportiveMessage(data, '2026-11-24');
  assert.ok(msg.headline.length > 0);

  const html = buildStandaloneHtmlBackup(data, '2026-11-24');
  assert.ok(html.includes('<!doctype html>'));
  assert.ok(html.includes('anchordesk-backup-json'));
});

test('parseImportedWorkspaceJson validates and normalizes backup payloads', () => {
  const badJson = parseImportedWorkspaceJson('{not json');
  assert.equal(badJson.ok, false);

  const wrongShape = parseImportedWorkspaceJson(JSON.stringify({ hello: 'world' }));
  assert.equal(wrongShape.ok, false);

  const seed = makeEmptyWorkspace();
  seed.theme = 'dark';
  seed.dailyPhoneLimitMinutes = 75;
  const ok = parseImportedWorkspaceJson(JSON.stringify(seed));
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.data.theme, 'dark');
    assert.equal(ok.data.dailyPhoneLimitMinutes, 75);
    assert.deepEqual(ok.data.mustDos, []);
  }
});

test('buildStandaloneAppHtml generates self-contained offline HTML without external dependencies', () => {
  const data = makeEmptyWorkspace();
  data.mustDos.push({
    id: 'm-xss',
    dateKey: '2026-11-24',
    description: 'Review notes </SCRIPT> safely',
    category: 'study',
    estimatedMinutes: 30,
    timeSlot: '09:00',
    confirmedGladIfOnlyThis: true,
    completed: false,
    createdAt: '2026-11-24T08:00:00Z',
  });

  const html = buildStandaloneAppHtml(data);
  assert.ok(html.startsWith('<!doctype html>'));
  assert.ok(html.includes('id="anchordesk-embedded-data"'));
  assert.ok(html.includes('save-html-copy-btn'));
  assert.ok(!html.includes('http://'));
  assert.ok(!html.includes('https://'));

  // Embedded JSON must not contain an unescaped closing </script> tag
  const embeddedMatch = html.match(
    /<script id="anchordesk-embedded-data" type="application\/json">([\s\S]*?)<\/script>/,
  );
  assert.ok(embeddedMatch && embeddedMatch[1].includes('<\\/script>'));
});
