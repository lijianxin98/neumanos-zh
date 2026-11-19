/**
 * Synapse Types
 *
 * Type definitions for Synapse - NeumanOS's neural search interface.
 * Provides quick access to all platform data via Ctrl+K / Cmd+K.
 */

import type { ReactNode } from 'react';

/**
 * Result types that can appear in search results
 */
export type SearchResultType =
  | 'note'
  | 'task'
  | 'event'
  | 'bookmark'
  | 'page'
  | 'action'
  | 'external'
  | 'diagram'
  | 'form'
  | 'time-entry'
  | 'faq'
  | 'help'
  | 'widget'
  | 'setting'
  | 'automation'
  | 'template'
  | 'project'
  | 'shortcut'
  | 'command'
  | 'recent'
  | 'habit'
  | 'document';

/**
 * Search result item displayed in the command palette
 */
export interface SearchResult {
  /** Unique identifier for this result */
  id: string;
  /** Type of result for categorization and icon selection */
  type: SearchResultType;
  /** Primary display text */
  title: string;
  /** Secondary text (path, description, URL, etc.) */
  subtitle?: string;
  /** Icon to display (emoji, Lucide component, or custom ReactNode) */
  icon?: string | ReactNode;
  /** Relevance score for sorting (higher = more relevant) */
  score: number;
  /** Action to execute when selected */
  action: () => void;
  /** Optional preview content */
  preview?: string;
  /** Additional metadata for filtering/display */
  metadata?: Record<string, unknown>;
  /** Keywords for fuzzy matching (in addition to title/subtitle) */
  keywords?: string[];
}

/**
 * Search source configuration for dynamic data registration
 */
export interface SearchSource {
  /** Unique identifier for this source */
  id: string;
  /** Display name for the source */
  name: string;
  /** Result type produced by this source */
  type: SearchResultType;
  /** Icon for results from this source */
  icon: string | ReactNode;
  /** Function that returns all searchable items */
  getItems: () => SearchResult[];
  /** Priority for ordering sources (higher = shown first) */
  priority?: number;
  /** Whether this source is enabled */
  enabled?: boolean;
}

/**
 * External search engine configuration
 */
export interface SearchEngine {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** URL template with {query} placeholder */
  urlTemplate: string;
  /** Favicon URL for the search engine (light mode or universal) */
  faviconUrl: string;
  /** Optional dark mode favicon URL (for icons that don't show well on dark backgrounds) */
  faviconUrlDark?: string;
  /** Keyboard shortcut hint (optional) */
  shortcut?: string;
}

/**
 * Built-in search engines with real favicons
 */
export const SEARCH_ENGINES: SearchEngine[] = [
  {
    id: 'google',
    name: 'Google',
    urlTemplate: 'https://www.google.com/search?q={query}',
    faviconUrl: 'https://www.google.com/favicon.ico',
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    urlTemplate: 'https://duckduckgo.com/?q={query}',
    faviconUrl: 'https://duckduckgo.com/favicon.ico',
  },
  {
    id: 'bing',
    name: 'Bing',
    urlTemplate: 'https://www.bing.com/search?q={query}',
    faviconUrl: 'https://www.bing.com/favicon.ico',
  },
  {
    id: 'brave',
    name: 'Brave Search',
    urlTemplate: 'https://search.brave.com/search?q={query}',
    faviconUrl: 'https://brave.com/static-assets/images/brave-favicon.png',
  },
  {
    id: 'ecosia',
    name: 'Ecosia',
    urlTemplate: 'https://www.ecosia.org/search?q={query}',
    faviconUrl: 'https://www.ecosia.org/favicon.ico',
  },
  {
    id: 'startpage',
    name: 'Startpage',
    urlTemplate: 'https://www.startpage.com/sp/search?query={query}',
    faviconUrl: 'https://www.startpage.com/favicon.ico',
  },
  {
    id: 'wikipedia',
    name: 'Wikipedia',
    urlTemplate: 'https://en.wikipedia.org/w/index.php?search={query}',
    faviconUrl: 'https://en.wikipedia.org/favicon.ico',
  },
  {
    id: 'github',
    name: 'GitHub',
    urlTemplate: 'https://github.com/search?q={query}',
    faviconUrl: 'https://github.com/favicon.ico',
    faviconUrlDark: 'https://github.githubassets.com/favicons/favicon-dark.svg',
  },
  {
    id: 'stackoverflow',
    name: 'Stack Overflow',
    urlTemplate: 'https://stackoverflow.com/search?q={query}',
    faviconUrl: 'https://cdn.sstatic.net/Sites/stackoverflow/Img/favicon.ico',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    urlTemplate: 'https://www.youtube.com/results?search_query={query}',
    faviconUrl: 'https://www.youtube.com/favicon.ico',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    urlTemplate: 'https://chatgpt.com/?hints=search&q={query}',
    faviconUrl: 'https://cdn.oaistatic.com/assets/favicon-miwirzcw.ico',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    urlTemplate: 'https://www.perplexity.ai/search?q={query}',
    faviconUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/perplexity-ai-icon.png',
  },
];

/**
 * Navigation pages available in the app
 */
export interface NavigationPage {
  id: string;
  name: string;
  path: string;
  icon: string;
  keywords: string[];
  description?: string;
}

/**
 * All navigable pages in the application
 */
export const NAVIGATION_PAGES: NavigationPage[] = [
  {
    id: 'dashboard',
    name: '仪表盘',
    path: '/',
    icon: '🏠',
    keywords: ['home', 'overview', 'widgets', 'main'],
    description: '带小组件的主仪表盘',
  },
  {
    id: 'notes',
    name: '笔记',
    path: '/notes',
    icon: '📝',
    keywords: ['note', 'write', 'document', 'text', 'markdown'],
    description: '创建并管理笔记',
  },
  {
    id: 'graph',
    name: '知识图谱',
    path: '/graph',
    icon: '🕸️',
    keywords: ['graph', 'network', 'links', 'connections', 'knowledge'],
    description: '可视化笔记关联',
  },
  {
    id: 'tasks',
    name: '任务',
    path: '/tasks',
    icon: '✅',
    keywords: ['task', 'todo', 'kanban', 'project', 'board'],
    description: '看板任务管理',
  },
  {
    id: 'schedule',
    name: '日程',
    path: '/schedule',
    icon: '📅',
    keywords: ['calendar', 'schedule', 'time', 'events', 'tracking'],
    description: '日历与工时跟踪',
  },
  {
    id: 'links',
    name: '链接库',
    path: '/links',
    icon: '🔗',
    keywords: ['bookmark', 'link', 'url', 'web', 'save'],
    description: '已保存的书签与链接',
  },
  {
    id: 'diagrams',
    name: '图表',
    path: '/diagrams',
    icon: '📊',
    keywords: ['diagram', 'flowchart', 'chart', 'draw', 'visual'],
    description: '创建图表与流程图',
  },
  {
    id: 'forms',
    name: '表单',
    path: '/forms',
    icon: '📋',
    keywords: ['form', 'survey', 'questionnaire', 'input'],
    description: '创建并管理表单',
  },
  {
    id: 'automations',
    name: '自动化',
    path: '/automations',
    icon: '⚡',
    keywords: ['automation', 'workflow', 'rule', 'trigger', 'action'],
    description: '任务自动化规则',
  },
  {
    id: 'settings',
    name: '设置',
    path: '/settings',
    icon: '⚙️',
    keywords: ['settings', 'preferences', 'config', 'options', 'theme'],
    description: '应用设置与偏好',
  },
  {
    id: 'activity',
    name: '动态流',
    path: '/activity',
    icon: '📊',
    keywords: ['activity', 'feed', 'history', 'log', 'analytics', 'heatmap'],
    description: '动态流与个人分析',
  },
  {
    id: 'portfolio',
    name: '项目组合',
    path: '/portfolio',
    icon: '📂',
    keywords: ['portfolio', 'projects', 'overview', 'health', 'cross-project', 'dashboard'],
    description: '跨项目组合总览',
  },
  {
    id: 'energy',
    name: '精力',
    path: '/energy',
    icon: '⚡',
    keywords: ['energy', 'tracking', 'burnout', 'schedule', 'productivity', 'fatigue'],
    description: '跟踪精力并优化日程',
  },
  {
    id: 'retrospective',
    name: '每周回顾',
    path: '/retrospective',
    icon: '📊',
    keywords: ['retrospective', 'weekly', 'review', 'insights', 'productivity', 'score', 'retro'],
    description: '带 AI 洞察的每周效率回顾',
  },
  {
    id: 'availability',
    name: '空闲时间',
    path: '/availability',
    icon: '📋',
    keywords: ['availability', 'free', 'busy', 'share', 'schedule', 'time', 'slots', 'meeting'],
    description: '与他人分享你的空闲时段',
  },
];

/**
 * Command palette state
 */
export interface CommandPaletteState {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  results: SearchResult[];
  isLoading: boolean;
}

/**
 * Type filter tabs for the command palette
 * Allows users to filter results by category
 */
export type SearchFilterTab = 'all' | 'notes' | 'tasks' | 'events' | 'links' | 'docs' | 'other';

export interface SearchFilterTabConfig {
  id: SearchFilterTab;
  label: string;
  icon: string;
  /** Which SearchResultTypes this tab includes */
  types: SearchResultType[];
}

export const SEARCH_FILTER_TABS: SearchFilterTabConfig[] = [
  { id: 'all', label: '全部', icon: '🔍', types: [] },
  { id: 'notes', label: '笔记', icon: '📝', types: ['note'] },
  { id: 'tasks', label: '任务', icon: '✅', types: ['task', 'project', 'template'] },
  { id: 'events', label: '事件', icon: '📅', types: ['event', 'time-entry'] },
  { id: 'links', label: '链接', icon: '🔗', types: ['bookmark'] },
  { id: 'docs', label: '文档', icon: '📄', types: ['diagram', 'form', 'document'] },
  { id: 'other', label: '其他', icon: '⚡', types: ['page', 'action', 'setting', 'widget', 'automation', 'habit', 'faq', 'help', 'shortcut', 'command'] },
];

/**
 * Command palette input modes
 * Detected from query prefix
 */
export type CommandPaletteMode = 'search' | 'command' | 'help' | 'navigation' | 'create';

/**
 * Executable command for the command palette
 * Commands are executed directly without navigation
 */
export interface Command {
  /** Unique identifier */
  id: string;
  /** Display name (e.g., "Toggle Dark Mode") */
  name: string;
  /** Alternative names for fuzzy matching */
  aliases: string[];
  /** Brief description */
  description: string;
  /** Icon emoji or component */
  icon: string;
  /** Action to execute - returns true if palette should close */
  handler: () => void | boolean | Promise<void | boolean>;
  /** Category for grouping */
  category: 'theme' | 'navigation' | 'create' | 'data' | 'timer' | 'view';
  /** Keywords for fuzzy matching */
  keywords: string[];
}
