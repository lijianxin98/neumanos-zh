/**
 * Dashboard Widget Registry
 *
 * Central registry of all available widgets with metadata, API configuration,
 * and lazy-loaded component references.
 *
 * Adding a new widget:
 * 1. Create the widget component in src/widgets/Dashboard/
 * 2. Add an entry to WIDGET_REGISTRY below
 * 3. That's it! The widget will be available in the Widget Manager
 */

import { lazy, type LazyExoticComponent, type FC } from 'react';
import type { CustomWidgetConfig } from '../../stores/useWidgetStore';

export type WidgetCategory = 'core' | 'productivity' | 'news' | 'fun' | 'finance' | 'visual' | 'dev' | 'utility' | 'custom';

// Props interface for widget components
export interface WidgetComponentProps {
  widgetId?: string;
}

export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji icon
  category: WidgetCategory;
  apiUrl?: string;
  apiKey?: string; // 'DEMO_KEY' for APIs that need keys but offer demo access
  requiresAuth?: boolean; // If user needs to provide API key/username
  defaultEnabled: boolean;
  // Lazy-loaded component (automatically generated from id)
  component?: LazyExoticComponent<FC<WidgetComponentProps>>;
}

/**
 * Maps widget ID to its file name in the Dashboard folder
 * Uses convention: widget ID -> PascalCase + "Widget"
 * e.g., "hackernews" -> "HackerNewsWidget"
 */
const WIDGET_FILE_NAMES: Record<string, string> = {
  myday: 'MyDayWidget',
  taskssummary: 'TasksSummaryWidget',
  tasksquickadd: 'TasksQuickAddWidget',
  upcomingevents: 'UpcomingEventsWidget',
  recentnotes: 'RecentNotesWidget',
  quote: 'QuoteWidget',
  crypto: 'CryptoWidget',
  hackernews: 'HackerNewsWidget',
  facts: 'FactsWidget',
  github: 'GitHubWidget',
  joke: 'JokeWidget',
  unsplash: 'UnsplashWidget',
  pomodoro: 'PomodoroWidget',
  reddit: 'RedditWidget',
  devto: 'DevToWidget',
  wordofday: 'WordOfDayWidget',
  currency: 'CurrencyWidget',
  worldclock: 'WorldClockWidget',
  ipinfo: 'IPInfoWidget',
  qrcode: 'QRCodeWidget',
  colorpalette: 'ColorPaletteWidget',
  weathermap: 'WeatherMapWidget',
  calculator: 'CalculatorWidget',
  unitconverter: 'UnitConverterWidget',
  countdown: 'CountdownWidget',
  shortcuts: 'ShortcutsWidget',
  stockmarket: 'StockMarketWidget',
  wikipedia: 'WikipediaWidget',
  bored: 'BoredWidget',
  dictionary: 'DictionaryWidget',
  ainews: 'AINewsWidget',
  airquality: 'AirQualityWidget',
  packagestats: 'PackageStatsWidget',
  pixelart: 'PixelArtWidget',
  typingtest: 'TypingTestWidget',
  memorygame: 'MemoryGameWidget',
  motivational: 'MotivationalWidget',
  githubtrending: 'GitHubTrendingWidget',
  awesomelists: 'AwesomeListsWidget',
  repostats: 'RepoStatsWidget',
  sports: 'SportsWidget',
  twitch: 'TwitchWidget',
  youtube: 'YouTubeWidget',
  analytics: 'AnalyticsWidget',
  clipboard: 'ClipboardWidget',
  tabmanager: 'TabManagerWidget',
  uptime: 'UptimeWidget',
  forms: 'FormWidget',
  habitsummary: 'HabitSummaryWidget',
  bookmarks: 'BookmarksWidget',
  activityfeed: 'ActivityFeedWidget',
  aibriefing: 'AIBriefingWidget',
  flashcard: 'FlashcardWidget',
  dailyquests: 'DailyQuestsWidget',
  energytracker: 'EnergyTrackerWidget',
  portfolio: 'PortfolioWidget',
  weeklyinsights: 'WeeklyInsightsWidget',
  weatherforecast: 'WeatherForecastWidget',
  quickadd: 'QuickAddWidget',
  productivitykarma: 'ProductivityKarmaWidget',
};

/**
 * Creates a lazy-loaded component for a widget
 * Uses Vite's glob import for reliable dynamic loading in production
 *
 * Note: We use import.meta.glob to pre-discover all widget modules at build time.
 * This avoids the "variable imports cannot import their own directory" warning
 * and ensures proper chunk generation in production.
 */

// Pre-discover all widget modules using Vite's glob import
// This creates a map of module path -> lazy import function
const widgetModules = import.meta.glob<{ [key: string]: FC<WidgetComponentProps> }>(
  './*Widget.tsx'
);

function createLazyWidget(widgetId: string): LazyExoticComponent<FC<WidgetComponentProps>> | undefined {
  const fileName = WIDGET_FILE_NAMES[widgetId];
  if (!fileName) return undefined;

  const modulePath = `./${fileName}.tsx`;
  const moduleLoader = widgetModules[modulePath];

  if (!moduleLoader) {
    return undefined;
  }

  // Dynamic import with named export
  return lazy(() =>
    moduleLoader().then((m) => ({
      default: m[fileName] as FC<WidgetComponentProps>,
    }))
  );
}

export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
  // Core App Widgets (always useful, enabled by default)
  myday: {
    id: 'myday',
    name: '我的一天',
    description: '今日任务与事件的统一视图',
    icon: '☀️',
    category: 'core',
    defaultEnabled: true,
  },

  taskssummary: {
    id: 'taskssummary',
    name: '任务摘要',
    description: '任务数量与总览',
    icon: '📊',
    category: 'core',
    defaultEnabled: true,
  },

  tasksquickadd: {
    id: 'tasksquickadd',
    name: '快速添加任务',
    description: '快速向看板添加任务',
    icon: '➕',
    category: 'core',
    defaultEnabled: true,
  },

  upcomingevents: {
    id: 'upcomingevents',
    name: '即将到来的事件',
    description: '接下来的日历事件',
    icon: '📅',
    category: 'core',
    defaultEnabled: true,
  },

  recentnotes: {
    id: 'recentnotes',
    name: '最近笔记',
    description: '最近更新的笔记',
    icon: '📝',
    category: 'core',
    defaultEnabled: true,
  },

  habitsummary: {
    id: 'habitsummary',
    name: '习惯追踪',
    description: '跟踪每日习惯与连续天数',
    icon: '🎯',
    category: 'core',
    defaultEnabled: true,
  },

  quote: {
    id: 'quote',
    name: '每日一句',
    description: '用一句名言开启新的一天',
    icon: '💭',
    category: 'productivity',
    apiUrl: 'https://api.quotable.io/random',
    defaultEnabled: true,
  },


  crypto: {
    id: 'crypto',
    name: '加密货币',
    description: 'BTC、ETH、SOL 价格及 24 小时涨跌',
    icon: '₿',
    category: 'finance',
    apiUrl: 'https://api.coingecko.com/api/v3/simple/price',
    defaultEnabled: true,
  },

  hackernews: {
    id: 'hackernews',
    name: 'Hacker News',
    description: 'Hacker News 热门科技资讯',
    icon: '📰',
    category: 'news',
    apiUrl: 'https://hacker-news.firebaseio.com/v0',
    defaultEnabled: true,
  },

  facts: {
    id: 'facts',
    name: '冷知识',
    description: '有趣的冷知识与 trivia',
    icon: '🧠',
    category: 'fun',
    apiUrl: 'https://uselessfacts.jsph.pl/random.json',
    defaultEnabled: false,
  },

  github: {
    id: 'github',
    name: 'GitHub 动态',
    description: '你的贡献与热门仓库',
    icon: '🐙',
    category: 'dev',
    apiUrl: 'https://api.github.com',
    requiresAuth: true, // Needs username in settings
    defaultEnabled: false,
  },

  joke: {
    id: 'joke',
    name: '程序员笑话',
    description: '程序员笑话，轻松一笑',
    icon: '😄',
    category: 'fun',
    apiUrl: 'https://v2.jokeapi.dev/joke/Programming',
    defaultEnabled: false,
  },

  unsplash: {
    id: 'unsplash',
    name: '每日一图',
    description: '来自 Unsplash 的精美摄影',
    icon: '📸',
    category: 'visual',
    apiUrl: 'https://source.unsplash.com/random',
    defaultEnabled: false,
  },

  pomodoro: {
    id: 'pomodoro',
    name: '番茄钟',
    description: '提升效率的专注计时器',
    icon: '⏱️',
    category: 'productivity',
    defaultEnabled: false,
  },

  // News & Info Widgets
  reddit: {
    id: 'reddit',
    name: 'Reddit 帖子',
    description: '编程社区热门帖子',
    icon: '📰',
    category: 'news',
    apiUrl: 'https://www.reddit.com/r/programming/hot.json',
    defaultEnabled: false,
  },

  devto: {
    id: 'devto',
    name: 'Dev.to 文章',
    description: 'Dev.to 最新开发文章',
    icon: '📝',
    category: 'news',
    apiUrl: 'https://dev.to/api/articles',
    defaultEnabled: false,
  },

  // Productivity Widgets
  wordofday: {
    id: 'wordofday',
    name: '每日一词',
    description: '扩充你的词汇量',
    icon: '📖',
    category: 'productivity',
    apiUrl: 'https://api.dictionaryapi.dev/api/v2/entries/en',
    defaultEnabled: false,
  },

  currency: {
    id: 'currency',
    name: '汇率换算',
    description: '实时汇率',
    icon: '💱',
    category: 'productivity',
    apiUrl: 'https://api.exchangerate-api.com/v4/latest/USD',
    defaultEnabled: false,
  },

  worldclock: {
    id: 'worldclock',
    name: '世界时钟',
    description: '多个时区的当前时间',
    icon: '🌍',
    category: 'productivity',
    defaultEnabled: false,
  },

  // Utility Widgets
  ipinfo: {
    id: 'ipinfo',
    name: 'IP 信息',
    description: '你的 IP 地址与位置',
    icon: '🌐',
    category: 'utility',
    apiUrl: 'https://ipapi.co/json/',
    defaultEnabled: false,
  },

  qrcode: {
    id: 'qrcode',
    name: '二维码生成器',
    description: '即时生成二维码',
    icon: '📱',
    category: 'utility',
    defaultEnabled: false,
  },

  colorpalette: {
    id: 'colorpalette',
    name: '配色盘',
    description: '随机配色方案',
    icon: '🎨',
    category: 'utility',
    defaultEnabled: false,
  },

  // Visual Widgets
  weathermap: {
    id: 'weathermap',
    name: '天气与地图',
    description: '交互式天气地图，含当前天气与 5 日预报',
    icon: '🗺️',
    category: 'visual',
    apiUrl: 'https://api.open-meteo.com/v1/forecast',
    defaultEnabled: true,
  },

  // Utility Widgets (New)
  calculator: {
    id: 'calculator',
    name: '计算器',
    description: '带记忆功能的基础计算器',
    icon: '🔢',
    category: 'utility',
    defaultEnabled: false,
  },

  unitconverter: {
    id: 'unitconverter',
    name: '单位换算',
    description: '换算温度、长度与重量单位',
    icon: '📏',
    category: 'utility',
    defaultEnabled: false,
  },

  countdown: {
    id: 'countdown',
    name: '倒计时',
    description: '为重要事件设置倒计时',
    icon: '⏳',
    category: 'productivity',
    defaultEnabled: false,
  },

  shortcuts: {
    id: 'shortcuts',
    name: '键盘快捷键',
    description: '应用快捷键速查',
    icon: '⌨️',
    category: 'utility',
    defaultEnabled: false,
  },

  stockmarket: {
    id: 'stockmarket',
    name: '股市',
    description: '实时股价（AAPL、GOOGL、TSLA）',
    icon: '📈',
    category: 'finance',
    apiUrl: 'https://finnhub.io/api/v1/quote',
    defaultEnabled: false,
  },

  wikipedia: {
    id: 'wikipedia',
    name: 'Wikipedia',
    description: '随机维基百科条目，每日学习',
    icon: '📚',
    category: 'news',
    apiUrl: 'https://en.wikipedia.org/api/rest_v1/page/random/summary',
    defaultEnabled: false,
  },

  // Phase 2: Simple API Widgets
  bored: {
    id: 'bored',
    name: '无聊？',
    description: '无聊时的随机活动建议',
    icon: '🎲',
    category: 'fun',
    apiUrl: 'https://www.boredapi.com/api/activity',
    defaultEnabled: false,
  },

  dictionary: {
    id: 'dictionary',
    name: '词典',
    description: '查询词义与同义词',
    icon: '📖',
    category: 'utility',
    apiUrl: 'https://api.dictionaryapi.dev/api/v2/entries/en',
    defaultEnabled: false,
  },

  // REMOVED: Product Hunt (CORS issues with RSS feed, GraphQL API requires authentication)
  // Alternative: dev.to and Hacker News widgets provide similar tech/product content

  ainews: {
    id: 'ainews',
    name: 'AI 研究',
    description: 'arXiv 最新 AI 论文',
    icon: '🤖',
    category: 'news',
    apiUrl: 'https://export.arxiv.org/api/query',
    defaultEnabled: false,
  },

  airquality: {
    id: 'airquality',
    name: '空气质量',
    description: '你所在地的空气质量指数',
    icon: '🌫️',
    category: 'productivity',
    apiUrl: 'https://api.waqi.info',
    defaultEnabled: false,
  },

  packagestats: {
    id: 'packagestats',
    name: 'NPM 统计',
    description: 'NPM 包下载统计',
    icon: '📦',
    category: 'dev',
    apiUrl: 'https://api.npmjs.org/downloads',
    defaultEnabled: false,
  },

  // Phase 3: Creative & Utility Widgets
  pixelart: {
    id: 'pixelart',
    name: '像素画',
    description: '简易像素画工具',
    icon: '🎨',
    category: 'fun',
    defaultEnabled: false,
  },

  typingtest: {
    id: 'typingtest',
    name: '打字测试',
    description: '测试打字速度（WPM）',
    icon: '⌨️',
    category: 'fun',
    defaultEnabled: false,
  },

  memorygame: {
    id: 'memorygame',
    name: '记忆游戏',
    description: '经典记忆翻牌游戏',
    icon: '🧠',
    category: 'fun',
    defaultEnabled: false,
  },

  motivational: {
    id: 'motivational',
    name: '每日激励',
    description: '配图励志名言',
    icon: '✨',
    category: 'productivity',
    defaultEnabled: false,
  },

  // Phase 3: Complex API Widgets
  githubtrending: {
    id: 'githubtrending',
    name: 'GitHub 趋势',
    description: 'GitHub 热门仓库',
    icon: '🔥',
    category: 'dev',
    apiUrl: 'https://api.github.com/search/repositories',
    defaultEnabled: false,
  },

  awesomelists: {
    id: 'awesomelists',
    name: '精选列表',
    description: '精选 Awesome 列表（高星）',
    icon: '📋',
    category: 'dev',
    apiUrl: 'https://api.github.com/search/repositories',
    defaultEnabled: false,
  },

  repostats: {
    id: 'repostats',
    name: '仓库统计',
    description: 'GitHub 仓库统计',
    icon: '📊',
    category: 'dev',
    apiUrl: 'https://api.github.com/repos',
    requiresAuth: true,
    defaultEnabled: false,
  },

  sports: {
    id: 'sports',
    name: 'NBA 比分',
    description: 'NBA 实时比分与赛况',
    icon: '🏀',
    category: 'news',
    apiUrl: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
    defaultEnabled: false,
  },


  twitch: {
    id: 'twitch',
    name: 'Twitch',
    description: '跟踪你喜欢的 Twitch 主播',
    icon: '🎮',
    category: 'fun',
    requiresAuth: true,
    defaultEnabled: false,
  },

  youtube: {
    id: 'youtube',
    name: 'YouTube',
    description: '跟踪 YouTube 频道',
    icon: '📺',
    category: 'fun',
    requiresAuth: true,
    defaultEnabled: false,
  },

  analytics: {
    id: 'analytics',
    name: '分析',
    description: '网站分析追踪',
    icon: '📈',
    category: 'utility',
    requiresAuth: true,
    defaultEnabled: false,
  },

  clipboard: {
    id: 'clipboard',
    name: '剪贴板',
    description: '剪贴板历史管理',
    icon: '📋',
    category: 'utility',
    defaultEnabled: false,
  },

  tabmanager: {
    id: 'tabmanager',
    name: '标签页管理',
    description: '管理浏览器标签与快捷链接',
    icon: '🗂️',
    category: 'utility',
    requiresAuth: true,
    defaultEnabled: false,
  },

  uptime: {
    id: 'uptime',
    name: '可用性监控',
    description: '监控网站可用性',
    icon: '🔔',
    category: 'utility',
    requiresAuth: true,
    defaultEnabled: false,
  },

  forms: {
    id: 'forms',
    name: '表单',
    description: '快速访问表单与回复',
    icon: '📋',
    category: 'core',
    defaultEnabled: true,
  },

  bookmarks: {
    id: 'bookmarks',
    name: '书签',
    description: '保存并整理常用网站链接',
    icon: '🔖',
    category: 'productivity',
    defaultEnabled: false,
  },

  activityfeed: {
    id: 'activityfeed',
    name: '动态流',
    description: '所有模块的最近动态',
    icon: '📊',
    category: 'core',
    defaultEnabled: false,
  },

  aibriefing: {
    id: 'aibriefing',
    name: 'AI 每日简报',
    description: 'AI 生成的晨间摘要：事件、任务与习惯',
    icon: '🌅',
    category: 'productivity',
    defaultEnabled: false,
  },

  flashcard: {
    id: 'flashcard',
    name: '闪卡',
    description: '基于 SM-2 算法的间隔重复闪卡复习',
    icon: '🧠',
    category: 'productivity',
    defaultEnabled: false,
  },

  dailyquests: {
    id: 'dailyquests',
    name: '每日任务',
    description: '游戏化每日习惯挑战，赢取经验值',
    icon: '📜',
    category: 'productivity',
    defaultEnabled: false,
  },

  energytracker: {
    id: 'energytracker',
    name: '精力追踪',
    description: '跟踪精力水平，找到最佳工作时段',
    icon: '⚡',
    category: 'productivity',
    defaultEnabled: false,
  },

  portfolio: {
    id: 'portfolio',
    name: '项目组合',
    description: '跨项目健康度总览与任务计数',
    icon: '📂',
    category: 'productivity',
    defaultEnabled: false,
  },

  weeklyinsights: {
    id: 'weeklyinsights',
    name: '每周洞察',
    description: '来自每周回顾的效率分数、最大收获与改进点',
    icon: '📊',
    category: 'productivity',
    defaultEnabled: false,
  },


  weatherforecast: {
    id: 'weatherforecast',
    name: '天气预报',
    description: '多日天气预报：气温、天气与降水',
    icon: '🌤️',
    category: 'utility',
    defaultEnabled: false,
  },

  quickadd: {
    id: 'quickadd',
    name: '快速添加',
    description: '在一个小组件中快速创建笔记、任务与事件',
    icon: '⚡',
    category: 'core',
    defaultEnabled: false,
  },


  productivitykarma: {
    id: 'productivitykarma',
    name: '效率业力',
    description: '综合任务、习惯、工时与精力的统一效率分数',
    icon: '🔮',
    category: 'productivity',
    defaultEnabled: false,
  },
};

/**
 * Register a custom widget in the registry at runtime.
 * Called when custom widgets are loaded from persisted state.
 */
export function registerCustomWidget(config: CustomWidgetConfig): void {
  WIDGET_REGISTRY[config.id] = {
    id: config.id,
    name: config.name,
    description: config.description,
    icon: config.icon,
    category: 'custom',
    defaultEnabled: false,
  };
}

/**
 * Remove a custom widget from the registry at runtime.
 */
export function unregisterCustomWidget(id: string): void {
  delete WIDGET_REGISTRY[id];
}

// Helper to get widgets by category
export function getWidgetsByCategory(category: WidgetCategory): WidgetDefinition[] {
  return Object.values(WIDGET_REGISTRY).filter((w) => w.category === category);
}

// Helper to get all available widgets
export function getAllWidgets(): WidgetDefinition[] {
  return Object.values(WIDGET_REGISTRY);
}

// Helper to get widget by ID
export function getWidget(id: string): WidgetDefinition | undefined {
  return WIDGET_REGISTRY[id];
}

// Helper to get default enabled widgets
export function getDefaultEnabledWidgets(): string[] {
  return Object.values(WIDGET_REGISTRY)
    .filter((w) => w.defaultEnabled)
    .map((w) => w.id);
}

// Lazy-loaded CustomWidget component for custom widgets
// Uses a separate glob path since CustomWidget is not named *Widget.tsx pattern for registry
const customWidgetModule = import.meta.glob<{ CustomWidget: FC<WidgetComponentProps> }>(
  './CustomWidget.tsx'
);

let _cachedCustomWidgetLazy: LazyExoticComponent<FC<WidgetComponentProps>> | undefined;

function getCustomWidgetLazy(): LazyExoticComponent<FC<WidgetComponentProps>> {
  if (!_cachedCustomWidgetLazy) {
    const loader = customWidgetModule['./CustomWidget.tsx'];
    if (loader) {
      _cachedCustomWidgetLazy = lazy(() =>
        loader().then((m) => ({ default: m.CustomWidget }))
      );
    }
  }
  return _cachedCustomWidgetLazy!;
}

/**
 * Get the lazy-loaded component for a widget
 * Returns undefined if widget not found
 */
export function getWidgetComponent(id: string): LazyExoticComponent<FC<WidgetComponentProps>> | undefined {
  if (id.startsWith('custom-')) {
    return getCustomWidgetLazy();
  }
  return createLazyWidget(id);
}

/**
 * Get all widget components as a map (for backwards compatibility)
 * This is used by Dashboard.tsx to render widgets
 */
export function getWidgetComponentMap(): Record<string, LazyExoticComponent<FC<WidgetComponentProps>>> {
  const map: Record<string, LazyExoticComponent<FC<WidgetComponentProps>>> = {};

  for (const id of Object.keys(WIDGET_REGISTRY)) {
    if (id.startsWith('custom-')) {
      // Custom widgets all use the same component
      map[id] = getCustomWidgetLazy();
    } else {
      const component = createLazyWidget(id);
      if (component) {
        map[id] = component;
      }
    }
  }

  return map;
}
