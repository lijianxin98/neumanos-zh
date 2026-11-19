import React from 'react';
import { Modal } from './Modal';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Keyboard Shortcuts Help Modal
 * Shows all available keyboard shortcuts organized by category
 */
export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  isOpen,
  onClose,
}) => {
  const shortcuts = [
    {
      category: '全局',
      items: [
        { keys: ['Ctrl+K'], description: '打开命令面板（Synapse）' },
        { keys: ['F1'], description: '打开帮助与支持' },
        { keys: ['Ctrl+/'], description: '打开帮助' },
        { keys: ['Ctrl+B'], description: '切换侧边栏' },
        { keys: ['Ctrl+Shift+A'], description: '切换 AI 终端' },
        { keys: ['Ctrl+Shift+P'], description: '切换项目上下文' },
        { keys: ['Esc'], description: '关闭对话框 / 清除选择' },
      ],
    },
    {
      category: '导航（Ctrl+数字）',
      items: [
        { keys: ['Ctrl+1'], description: '仪表盘' },
        { keys: ['Ctrl+2'], description: '今日' },
        { keys: ['Ctrl+3'], description: '笔记' },
        { keys: ['Ctrl+4'], description: '任务' },
        { keys: ['Ctrl+5'], description: '日程' },
        { keys: ['Ctrl+6'], description: '创作（文档）' },
        { keys: ['Ctrl+7'], description: '链接库' },
        { keys: ['Ctrl+8'], description: '设置' },
      ],
    },
    {
      category: '快捷跳转（先按 G 再按字母）',
      items: [
        { keys: ['G', 'D'], description: '前往仪表盘' },
        { keys: ['G', 'T'], description: '前往任务' },
        { keys: ['G', 'N'], description: '前往笔记' },
        { keys: ['G', 'H'], description: '前往习惯' },
        { keys: ['G', 'C'], description: '前往日历' },
        { keys: ['G', 'S'], description: '前往设置' },
        { keys: ['G', 'O'], description: '回到今天' },
        { keys: ['G', 'L'], description: '前往链接' },
        { keys: ['G', 'F'], description: '前往专注' },
      ],
    },
    {
      category: '快速创建',
      items: [
        { keys: ['C'], description: '快速添加任务' },
        { keys: ['Ctrl+N'], description: '新建笔记' },
        { keys: ['Ctrl+T'], description: '新建任务' },
        { keys: ['Ctrl+E'], description: '新建事件（前往日历）' },
        { keys: ['Ctrl+Shift+T'], description: '智能模板' },
      ],
    },
    {
      category: '看板',
      items: [
        { keys: ['J'], description: '移到下一项任务' },
        { keys: ['K'], description: '移到上一项任务' },
        { keys: ['H'], description: '移到上一列' },
        { keys: ['L'], description: '移到下一列' },
        { keys: ['N'], description: '在当前列新建任务' },
        { keys: ['E'], description: '编辑所选任务' },
        { keys: ['D'], description: '删除所选任务' },
      ],
    },
    {
      category: '笔记编辑器',
      items: [
        { keys: ['Ctrl+D'], description: 'Create daily note' },
        { keys: ['Ctrl+Shift+E'], description: 'Export notes' },
        { keys: ['Ctrl+B'], description: 'Bold text' },
        { keys: ['Ctrl+I'], description: 'Italic text' },
        { keys: ['Ctrl+U'], description: 'Underline text' },
        { keys: ['/'], description: 'Open slash commands' },
        { keys: ['[['], description: 'Insert wiki link' },
      ],
    },
    {
      category: 'Synapse (Command Palette)',
      items: [
        { keys: ['>'], description: 'Enter command mode' },
        { keys: ['?'], description: 'Enter help mode' },
        { keys: ['/'], description: 'Enter navigation mode' },
        { keys: ['tag:name'], description: 'Filter by tag' },
        { keys: ['date:today'], description: 'Filter by date' },
      ],
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="键盘快捷键">
      <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
        {shortcuts.map((section) => (
          <div key={section.category}>
            <h4 className="text-sm font-semibold text-accent-blue mb-2 uppercase tracking-wide">
              {section.category}
            </h4>
            <div className="space-y-1">
              {section.items.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-1.5 border-b border-border-light dark:border-border-dark last:border-0"
                >
                  <span className="text-sm text-text-light-primary dark:text-text-dark-primary">
                    {shortcut.description}
                  </span>
                  <div className="flex gap-1 flex-shrink-0">
                    {shortcut.keys.map((key, keyIndex) => (
                      <kbd
                        key={keyIndex}
                        className="px-2 py-1 text-xs font-mono font-semibold bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary rounded-button border border-border-light dark:border-border-dark shadow-sm"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-3 border-t border-border-light dark:border-border-dark">
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
            Tip: Single-key shortcuts (C, G, J, K, H, L) only work when not typing in an input field. On Mac, use Cmd instead of Ctrl.
          </p>
        </div>
      </div>
    </Modal>
  );
};
