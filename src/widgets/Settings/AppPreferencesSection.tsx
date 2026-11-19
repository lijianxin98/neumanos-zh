/**
 * App-Level Preferences Settings Section
 *
 * Date format, week start day configuration.
 * Time format and temperature are in SiteWideSettings.
 */

import React from 'react';
import { Calendar } from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import type { DateFormat, WeekStartDay } from '../../stores/useSettingsStore';

const TIME_ZONES: { value: string; label: string }[] = [
  { value: 'Asia/Shanghai', label: '中国标准时间（北京）' },
  { value: 'Asia/Hong_Kong', label: '香港' },
  { value: 'Asia/Taipei', label: '台北' },
  { value: 'Asia/Tokyo', label: '东京' },
  { value: 'Asia/Seoul', label: '首尔' },
  { value: 'Asia/Singapore', label: '新加坡' },
  { value: 'Asia/Kolkata', label: '加尔各答' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/London', label: '伦敦' },
  { value: 'Europe/Paris', label: '巴黎' },
  { value: 'Europe/Berlin', label: '柏林' },
  { value: 'America/New_York', label: '纽约' },
  { value: 'America/Chicago', label: '芝加哥' },
  { value: 'America/Denver', label: '丹佛' },
  { value: 'America/Los_Angeles', label: '洛杉矶' },
  { value: 'America/Sao_Paulo', label: '圣保罗' },
  { value: 'Australia/Sydney', label: '悉尼' },
  { value: 'Pacific/Auckland', label: '奥克兰' },
];

const DATE_FORMATS: { value: DateFormat; label: string; example: string }[] = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '02/22/2026' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '22/02/2026' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2026-02-22' },
];

const WEEK_START_DAYS: { value: WeekStartDay; label: string }[] = [
  { value: 0, label: '星期日' },
  { value: 1, label: '星期一' },
];

export const AppPreferencesSection: React.FC = () => {
  const dateFormat = useSettingsStore((s) => s.dateFormat);
  const weekStartDay = useSettingsStore((s) => s.weekStartDay);
  const timeZone = useSettingsStore((s) => s.timeZone);
  const setDateFormat = useSettingsStore((s) => s.setDateFormat);
  const setWeekStartDay = useSettingsStore((s) => s.setWeekStartDay);
  const setTimeZone = useSettingsStore((s) => s.setTimeZone);

  return (
    <div className="bento-card p-6">
      <div className="flex items-center gap-3 mb-1">
        <Calendar className="w-5 h-5 text-accent-primary" />
        <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
          日期与地区
        </h2>
      </div>
      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-6">
        配置整个应用中日期的显示方式。
      </p>

      <div className="space-y-4">
        {/* Date Format */}
        <div>
          <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
            日期格式
          </label>
          <select
            value={dateFormat ?? 'MM/DD/YYYY'}
            onChange={(e) => setDateFormat(e.target.value as DateFormat)}
            className="w-full sm:w-64 px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            {DATE_FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label} ({f.example})
              </option>
            ))}
          </select>
          <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-1">
            用于任务、日历和工时跟踪中的日期
          </p>
        </div>

        {/* Week Start Day */}
        <div>
          <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
            每周起始日
          </label>
          <div className="flex gap-2">
            {WEEK_START_DAYS.map((d) => (
              <button
                key={d.value}
                onClick={() => setWeekStartDay(d.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  (weekStartDay ?? 0) === d.value
                    ? 'bg-accent-primary text-white'
                    : 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary hover:bg-border-light dark:hover:bg-border-dark'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-1">
            影响日历视图和周次计算
          </p>
        </div>

        {/* Time Zone */}
        <div>
          <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
            时区
          </label>
          <select
            value={timeZone ?? 'Asia/Shanghai'}
            onChange={(e) => setTimeZone(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            {TIME_ZONES.map((z) => (
              <option key={z.value} value={z.value}>
                {z.label}（{z.value}）
              </option>
            ))}
          </select>
          <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-1">
            用于顶部时钟和日程时间显示
          </p>
        </div>
      </div>
    </div>
  );
};
