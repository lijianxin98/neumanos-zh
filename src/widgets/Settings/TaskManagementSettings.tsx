/**
 * Task Management Settings Component
 *
 * Settings for task behavior and dependencies:
 * - Auto-shift dependent tasks
 * - WIP (Work In Progress) limits enforcement
 */

import React from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';

export const TaskManagementSettings: React.FC = () => {
  // Task Management Settings
  const autoShiftDependentTasks = useSettingsStore((state) => state.autoShiftDependentTasks);
  const setAutoShiftDependentTasks = useSettingsStore((state) => state.setAutoShiftDependentTasks);
  const enforceWipLimits = useSettingsStore((state) => state.enforceWipLimits);
  const setEnforceWipLimits = useSettingsStore((state) => state.setEnforceWipLimits);

  return (
    <div className="bento-card p-6">
      <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-4">
        任务管理
      </h2>
      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
        配置项目中任务与依赖关系的行为。
      </p>

      <div className="space-y-4">
        {/* Auto-shift dependent tasks */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="auto-shift-tasks"
            checked={autoShiftDependentTasks}
            onChange={(e) => setAutoShiftDependentTasks(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-accent-primary focus:ring-2 focus:ring-accent-primary cursor-pointer"
          />
          <div className="flex-1">
            <label
              htmlFor="auto-shift-tasks"
              className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary cursor-pointer"
            >
              日期变更时自动顺延依赖任务
            </label>
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
              调整任务日期时，依赖任务会按依赖类型（完成-开始、开始-开始等）自动顺延。应用前会弹出确认。
            </p>
          </div>
        </div>

        {/* Enforce WIP Limits */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="enforce-wip-limits"
            checked={enforceWipLimits}
            onChange={(e) => setEnforceWipLimits(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-accent-primary focus:ring-2 focus:ring-accent-primary cursor-pointer"
          />
          <div className="flex-1">
            <label
              htmlFor="enforce-wip-limits"
              className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary cursor-pointer"
            >
              严格执行 WIP 上限（禁止移入已满列）
            </label>
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
              开启后，无法将任务拖入已达 WIP（在制品）上限的列。关闭时（默认）仍会显示警告但允许移动。可在看板列设置中配置 WIP 上限。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
