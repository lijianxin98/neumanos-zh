/**
 * Support Modal - Help & Support System
 * Provides issue reporting, help resources, and documentation access
 *
 * Features:
 * - Report Issue tab: Mailto integration with diagnostic report
 * - Get Help tab: Keyboard shortcuts, FAQs, system status
 * - Documentation tab: Version info, external links
 */

import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { getDiagnosticReport, formatDiagnosticReport, copyDiagnosticReportToClipboard, downloadDiagnosticReport, type DiagnosticReport } from '../utils/diagnostics';
import { logger } from '../services/logger';
import { Mail, HelpCircle, Book, Copy, Download, ChevronDown, ChevronRight, ExternalLink, Keyboard } from 'lucide-react';
import { BUILD_HASH, formatBuildTimestamp } from '../utils/buildInfo';
import { useShortcutsStore } from '../stores/useShortcutsStore';
import { formatShortcut } from '../services/shortcuts';

const log = logger.module('SupportModal');

type TabType = 'report' | 'help' | 'docs';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Which tab to show when modal opens. Defaults to 'report'. */
  initialTab?: TabType;
}

interface FAQ {
  question: string;
  answer: string;
}

const SUPPORT_EMAIL = 'os@neuman.dev';

const FAQS: FAQ[] = [
  // Getting Started
  {
    question: '我的数据存储在哪里？',
    answer: '所有数据都保存在本浏览器的 IndexedDB 中。除非你主动导出，否则不会离开设备。笔记、任务和设置都是私密的，并且可以离线使用。',
  },
  {
    question: '如何备份数据？',
    answer: '前往 设置 → 备份与恢复，点击「导出大脑数据包」下载 .brain 文件。可在任意浏览器通过「导入大脑数据包」恢复。若需自动备份，请将自动保存设置到 Dropbox 或 Google 云端硬盘等云文件夹。',
  },
  {
    question: '如果清除浏览器数据会怎样？',
    answer: '清除浏览器数据会删除本地存储的信息。清除数据或更换浏览器前请先导出备份。随时可以从 .brain 文件恢复。',
  },
  // Notes
  {
    question: '如何将笔记导出为 Markdown？',
    answer: '打开笔记页面，点击标题栏的导出按钮（或按 Cmd/Ctrl+Shift+E），选择导出范围后点击导出。笔记将以 .md 文件打包为 ZIP 下载。',
  },
  {
    question: '什么是维基链接，如何使用？',
    answer: '维基链接用 [[笔记标题]] 语法连接笔记。在编辑器中输入 [[ 即可看到全部笔记列表。点击维基链接会跳转到对应笔记。使用知识图谱可可视化全部关联。',
  },
  {
    question: '可以把笔记放进文件夹吗？',
    answer: '可以！笔记可放入文件夹。点击笔记侧边栏的文件夹图标即可创建。也可以用标签做跨文件夹整理——给笔记加标签并按标签筛选。',
  },
  // Tasks
  {
    question: '如何创建重复任务？',
    answer: '创建或编辑任务，滚动到「重复」部分。选择重复模式（每天、每周、每月、每年或自定义），设置间隔，可选设置结束日期。',
  },
  {
    question: '看板是什么？',
    answer: '看板以列展示任务（待办、进行中、完成）。在列之间拖动任务即可更新状态。也可以创建自定义列，并按项目、优先级或标签筛选。',
  },
  {
    question: '任务依赖如何工作？',
    answer: '编辑任务时可添加依赖——必须先完成的前置任务。关键路径功能（在任务视图中切换）会高亮阻塞其他任务的项目。',
  },
  // Dashboard & Widgets
  {
    question: '如何自定义仪表盘小组件？',
    answer: '点击侧边栏的仪表盘，再点齿轮图标（⚙）打开小组件管理。可开关小组件、拖拽排序，并点击单个小组件的设置图标进行配置。',
  },
  {
    question: '有哪些小组件？',
    answer: '超过 44 个小组件，包括：天气、资讯、计算器、世界时钟、番茄钟、快速笔记、日历、任务摘要、工时统计、书签等。还会持续增加。',
  },
  // Time Tracking & Calendar
  {
    question: '工时跟踪如何使用？',
    answer: '从侧边栏进入工时跟踪。开始工作时启动计时器、关联项目，结束后停止。可查看日/周统计、生成报表，并导出 CSV 用于开票。',
  },
  {
    question: '可以导入日历事件吗？',
    answer: '可以！日历页支持导入 ICS 文件。点击导入并选择 .ics 文件即可。也可以把事件导出为 ICS，方便在其他日历应用中使用。',
  },
  // Shortcuts & Tips
  {
    question: '有哪些键盘快捷键？',
    answer: '按 F1 或 Ctrl+/ 打开帮助。在笔记页，Ctrl+K 聚焦搜索。编辑器中 Ctrl+B 加粗、Ctrl+I 斜体、Ctrl+Shift+E 导出，输入 / 使用斜杠命令。Ctrl+B 切换侧边栏，Ctrl+D 创建每日笔记。',
  },
  {
    question: '如何在笔记中使用斜杠命令？',
    answer: '在笔记编辑器中输入「/」查看命令：/heading、/bullet、/checkbox、/code、/quote、/divider 等。这是最快的格式化方式。',
  },
];

/**
 * Keyboard Shortcuts Section - displays all registered shortcuts from the shortcuts store
 */
function KeyboardShortcutsSection() {
  const shortcuts = useShortcutsStore((s) => s.getAllShortcuts());

  // Group shortcuts by context
  const groupedShortcuts = shortcuts.reduce(
    (acc, shortcut) => {
      const context = shortcut.context || 'global';
      if (!acc[context]) acc[context] = [];
      acc[context].push(shortcut);
      return acc;
    },
    {} as Record<string, typeof shortcuts>
  );

  const contextLabels: Record<string, string> = {
    global: '全局',
    kanban: '任务/看板',
    notes: '笔记',
    calendar: '日历',
    diagram: '图表',
    modal: '弹窗',
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Keyboard className="w-4 h-4 text-accent-blue" />
        <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
          键盘快捷键
        </h3>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedShortcuts).map(([context, contextShortcuts]) => (
          <div key={context}>
            <h4 className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2 uppercase tracking-wide">
              {contextLabels[context] || context}
            </h4>
            <div className="bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
              {contextShortcuts.map((shortcut, index) => (
                <div
                  key={shortcut.id}
                  className={`flex items-center justify-between px-3 py-2 ${
                    index !== contextShortcuts.length - 1
                      ? 'border-b border-border-light dark:border-border-dark'
                      : ''
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm text-text-light-primary dark:text-text-dark-primary">
                      {shortcut.label}
                    </span>
                    {shortcut.description && (
                      <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                        {shortcut.description}
                      </span>
                    )}
                  </div>
                  <kbd className="px-2 py-1 text-xs font-mono bg-surface-light-elevated dark:bg-surface-dark-elevated rounded border border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary">
                    {formatShortcut(shortcut.keys)}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}

        {shortcuts.length === 0 && (
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary italic">
            还没有注册快捷键。使用应用后会在这里显示。
          </p>
        )}
      </div>

      {/* Editor shortcuts (hardcoded since they're from Lexical) */}
      <div className="mt-4">
        <h4 className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2 uppercase tracking-wide">
          笔记编辑器
        </h4>
        <div className="bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
          {[
            { keys: ['mod', 'b'], label: '加粗' },
            { keys: ['mod', 'i'], label: '斜体' },
            { keys: ['mod', 'u'], label: '下划线' },
            { keys: ['mod', 'shift', 'e'], label: '导出笔记' },
            { keys: ['/'], label: '斜杠命令菜单' },
            { keys: ['[['], label: '维基链接自动补全' },
          ].map((shortcut, index, arr) => (
            <div
              key={shortcut.label}
              className={`flex items-center justify-between px-3 py-2 ${
                index !== arr.length - 1 ? 'border-b border-border-light dark:border-border-dark' : ''
              }`}
            >
              <span className="text-sm text-text-light-primary dark:text-text-dark-primary">
                {shortcut.label}
              </span>
              <kbd className="px-2 py-1 text-xs font-mono bg-surface-light-elevated dark:bg-surface-dark-elevated rounded border border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary">
                {formatShortcut(shortcut.keys)}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SupportModal({ isOpen, onClose, initialTab = 'report' }: SupportModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [issueType, setIssueType] = useState<string>('bug');
  const [description, setDescription] = useState<string>('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState<boolean>(true);
  const [diagnosticReport, setDiagnosticReport] = useState<DiagnosticReport | null>(null);
  const [showDiagnosticPreview, setShowDiagnosticPreview] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);

  // Generate diagnostic report when modal opens or when tab changes to report
  useEffect(() => {
    if (isOpen && activeTab === 'report' && !diagnosticReport) {
      generateDiagnosticReport();
    }
  }, [isOpen, activeTab]);

  const generateDiagnosticReport = async () => {
    try {
      setIsGeneratingReport(true);
      const report = await getDiagnosticReport();
      setDiagnosticReport(report);
      log.info('Diagnostic report generated for support modal');
    } catch (error) {
      log.error('无法生成诊断报告', { error });
      setMessage({ type: 'error', text: '无法生成诊断报告' });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleSendEmail = () => {
    if (!description.trim()) {
      setMessage({ type: 'error', text: '请填写问题描述' });
      return;
    }

    try {
      const subject = encodeURIComponent(`[${issueType}] - NeumanOS 支持请求`);

      let bodyText = `问题类型：${issueType}\n`;
      bodyText += `构建：${BUILD_HASH} (${formatBuildTimestamp()})\n\n`;
      bodyText += `描述：\n${description}\n\n`;

      if (includeDiagnostics && diagnosticReport) {
        bodyText += '---\n诊断报告：\n\n';
        bodyText += formatDiagnosticReport(diagnosticReport);
      }

      const body = encodeURIComponent(bodyText);

      window.open(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
      setMessage({ type: 'success', text: '已打开邮件客户端。请发送邮件以完成反馈。' });
      log.info('Mailto link opened for support request', { issueType, includeDiagnostics });
    } catch (error) {
      log.error('Failed to open email client', { error });
      setMessage({ type: 'error', text: '无法打开邮件客户端。请手动复制诊断报告。' });
    }
  };

  const handleCopyDiagnosticReport = async () => {
    if (!diagnosticReport) {
      setMessage({ type: 'error', text: '暂无诊断报告' });
      return;
    }

    try {
      await copyDiagnosticReportToClipboard(diagnosticReport);
      setMessage({ type: 'success', text: '诊断报告已复制到剪贴板' });
    } catch (error) {
      log.error('Failed to copy diagnostic report', { error });
      setMessage({ type: 'error', text: '复制到剪贴板失败' });
    }
  };

  const handleDownloadDiagnosticReport = () => {
    if (!diagnosticReport) {
      setMessage({ type: 'error', text: '暂无诊断报告' });
      return;
    }

    try {
      downloadDiagnosticReport(diagnosticReport);
      setMessage({ type: 'success', text: '诊断报告已下载' });
    } catch (error) {
      log.error('Failed to download diagnostic report', { error });
      setMessage({ type: 'error', text: '下载报告失败' });
    }
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  // Reset state when modal closes, set initial tab when it opens
  useEffect(() => {
    if (!isOpen) {
      setMessage(null);
      setDescription('');
      setIssueType('bug');
      setIncludeDiagnostics(true);
      setExpandedFaq(null);
    } else {
      // Set the active tab to initialTab when modal opens
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Auto-dismiss success messages
  useEffect(() => {
    if (message?.type === 'success') {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="帮助与支持" maxWidth="2xl">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border-light dark:border-border-dark">
        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'report'
              ? 'text-accent-primary border-b-2 border-accent-primary'
              : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span>反馈问题</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('help')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'help'
              ? 'text-accent-primary border-b-2 border-accent-primary'
              : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            <span>获取帮助</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'docs'
              ? 'text-accent-blue border-b-2 border-accent-blue'
              : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            <Book className="w-4 h-4" />
            <span>文档</span>
          </div>
        </button>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-status-success-bg dark:bg-status-success-bg-dark text-status-success-text dark:text-status-success-text-dark border border-status-success-border dark:border-status-success-border-dark'
              : message.type === 'error'
              ? 'bg-status-error-bg dark:bg-status-error-bg-dark text-status-error-text dark:text-status-error-text-dark border border-status-error-border dark:border-status-error-border-dark'
              : 'bg-status-info-bg dark:bg-status-info-bg-dark text-status-info-text dark:text-status-info-text-dark border border-status-info-border dark:border-status-info-border-dark'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'report' && (
        <div className="space-y-4">
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            遇到问题了？发给我们一份诊断报告，方便排查。
          </p>

          {/* Issue Type */}
          <div>
            <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
              问题类型
            </label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              <option value="bug">缺陷报告</option>
              <option value="feature">功能请求</option>
              <option value="performance">性能问题</option>
              <option value="data-loss">数据丢失/损坏</option>
              <option value="ui-feedback">界面与体验反馈</option>
              <option value="other">其他</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
              问题描述 <span className="text-status-error">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请描述你遇到的问题…"
              rows={6}
              className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
            />
          </div>

          {/* Include Diagnostic Report */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="include-diagnostics"
              checked={includeDiagnostics}
              onChange={(e) => setIncludeDiagnostics(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-border-light dark:border-border-dark"
            />
            <div className="flex-1">
              <label htmlFor="include-diagnostics" className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary cursor-pointer">
                附带诊断报告（推荐）
              </label>
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                包含系统信息、存储统计和错误日志，方便排查。不含个人内容。
              </p>
            </div>
          </div>

          {/* Diagnostic Preview */}
          {includeDiagnostics && diagnosticReport && (
            <div>
              <button
                onClick={() => setShowDiagnosticPreview(!showDiagnosticPreview)}
                className="flex items-center gap-2 text-sm font-medium text-accent-primary hover:text-accent-primary-hover transition-colors"
              >
                {showDiagnosticPreview ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span>预览诊断报告</span>
              </button>

              {showDiagnosticPreview && (
                <div className="mt-2 p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark">
                  <pre className="text-xs font-mono text-text-light-secondary dark:text-text-dark-secondary whitespace-pre-wrap overflow-auto max-h-64">
                    {formatDiagnosticReport(diagnosticReport)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border-light dark:border-border-dark">
            <button
              onClick={handleSendEmail}
              disabled={isGeneratingReport}
              className="flex-1 px-4 py-2 bg-accent-primary hover:bg-accent-primary-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                <span>打开邮件客户端</span>
              </div>
            </button>

            <button
              onClick={handleCopyDiagnosticReport}
              disabled={!diagnosticReport || isGeneratingReport}
              className="px-4 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark text-text-light-primary dark:text-text-dark-primary rounded-lg font-medium transition-colors border border-border-light dark:border-border-dark disabled:opacity-50 disabled:cursor-not-allowed"
              title="复制诊断报告到剪贴板"
              aria-label="复制诊断报告到剪贴板"
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              onClick={handleDownloadDiagnosticReport}
              disabled={!diagnosticReport || isGeneratingReport}
              className="px-4 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark text-text-light-primary dark:text-text-dark-primary rounded-lg font-medium transition-colors border border-border-light dark:border-border-dark disabled:opacity-50 disabled:cursor-not-allowed"
              title="下载诊断报告"
              aria-label="下载诊断报告"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'help' && (
        <div className="space-y-6">
          {/* Keyboard Shortcuts */}
          <KeyboardShortcutsSection />

          {/* FAQs */}
          <div>
            <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
              常见问题
            </h3>
            <div className="space-y-2">
              {FAQS.map((faq, index) => (
                <div
                  key={index}
                  className="border border-border-light dark:border-border-dark rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-4 py-3 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark text-left flex items-center justify-between gap-2 transition-colors"
                  >
                    <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                      {faq.question}
                    </span>
                    {expandedFaq === index ? (
                      <ChevronDown className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary shrink-0" />
                    )}
                  </button>

                  {expandedFaq === index && (
                    <div className="px-4 py-3 bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark">
                      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'docs' && (
        <div className="space-y-6">
          {/* Build Info */}
          <div>
            <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
              构建信息
            </h3>
            <div className="p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-light-secondary dark:text-text-dark-secondary">当前构建：</span>
                  <span className="font-mono text-text-light-primary dark:text-text-dark-primary">{BUILD_HASH}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-light-secondary dark:text-text-dark-secondary">构建日期：</span>
                  <span className="text-text-light-primary dark:text-text-dark-primary">{formatBuildTimestamp()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* External Links */}
          <div>
            <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
              外部文档
            </h3>
            <div className="space-y-2">
              <a
                href="https://github.com/travisjneuman/neumanos"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark rounded-lg border border-border-light dark:border-border-dark transition-colors group"
              >
                <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  GitHub 仓库
                </span>
                <ExternalLink className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary group-hover:text-text-light-primary dark:group-hover:text-text-dark-primary transition-colors" />
              </a>

              <a
                href="https://github.com/travisjneuman/neumanos/blob/main/README.md"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark rounded-lg border border-border-light dark:border-border-dark transition-colors group"
              >
                <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  用户手册（README）
                </span>
                <ExternalLink className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary group-hover:text-text-light-primary dark:group-hover:text-text-dark-primary transition-colors" />
              </a>

              <a
                href="https://github.com/travisjneuman/neumanos/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark rounded-lg border border-border-light dark:border-border-dark transition-colors group"
              >
                <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  问题跟踪
                </span>
                <ExternalLink className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary group-hover:text-text-light-primary dark:group-hover:text-text-dark-primary transition-colors" />
              </a>
            </div>
          </div>

          {/* Privacy & License */}
          <div>
            <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
              隐私与许可
            </h3>
            <div className="p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark">
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
                    隐私政策
                  </div>
                  <p className="text-text-light-secondary dark:text-text-dark-secondary">
                    所有数据保存在本浏览器本地。没有遥测、没有分析、没有第三方服务。
                  </p>
                </div>
                <div>
                  <div className="font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
                    许可证
                  </div>
                  <p className="text-text-light-secondary dark:text-text-dark-secondary">
                    MIT 许可证 — 免费开源软件
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
