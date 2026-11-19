/**
 * Page Metadata Registry
 *
 * Centralized configuration for page headers across the application.
 * This ensures consistency and makes it easy to update headers in one place.
 *
 * Usage:
 * - PageHeader component auto-detects current route and uses this registry
 * - Pages can still override by passing explicit title/subtitle props
 *
 * Future extensions:
 * - Page icons
 * - Breadcrumbs
 * - SEO meta tags
 * - Page-specific actions
 */

export interface PageMetadata {
  title: string;
  subtitle?: string;
  // Future: icon, breadcrumbs, actions, seoTitle, seoDescription
}

/**
 * Registry of page metadata indexed by route path
 *
 * Note: Add new pages here when created. The PageHeader component
 * will automatically pick up the correct title/subtitle.
 */
export const PAGE_METADATA: Record<string, PageMetadata> = {
  '/': {
    title: '仪表盘',
    subtitle: '你的个人管理工作台总览',
  },
  '/today': {
    title: '今日',
    subtitle: '有意识地规划今天',
  },
  '/tasks': {
    title: '任务管理',
    subtitle: '用看板整理并跟踪任务',
  },
  '/notes': {
    title: '笔记',
    subtitle: '存放想法、思考与知识的第二大脑',
  },
  '/schedule': {
    title: '时间与规划',
    subtitle: '跟踪时间、规划日程、管理安排——全部集中在一处。',
  },
  '/settings': {
    title: '设置',
    subtitle: '管理数据、备份与偏好设置',
  },
  '/links': {
    title: '链接库',
    subtitle: '管理书签与收藏',
  },
  '/habits': {
    title: '习惯',
    subtitle: '通过每日打卡养成好习惯',
  },
  '/graph': {
    title: '知识图谱',
    subtitle: '可视化笔记之间的关联',
  },
  '/diagrams': {
    title: '图表',
    subtitle: '创建可视化图表与流程图',
  },
  '/forms': {
    title: '表单',
    subtitle: '创建并管理自定义表单',
  },
  '/focus': {
    title: '专注模式',
    subtitle: '免打扰的专注工作环境',
  },
  '/automations': {
    title: '自动化',
    subtitle: '创建规则，自动完成工作流',
  },
  '/docs': {
    title: '文档',
    subtitle: '专业文档、表格与演示文稿',
  },
  '/create': {
    title: '创作',
    subtitle: '文档、图表与表单',
  },
  '/pm': {
    title: '项目管理',
    subtitle: '跟踪项目、里程碑与团队进度',
  },
  '/portfolio': {
    title: '项目组合',
    subtitle: '跨项目总览与健康度跟踪',
  },
  '/energy': {
    title: '精力',
    subtitle: '跟踪精力水平并优化日程',
  },
  '/availability': {
    title: '空闲时间',
    subtitle: '与他人分享你的空闲时段',
  },
};

/**
 * Get page metadata for a given pathname
 *
 * @param pathname - The current route path (e.g., '/', '/tasks')
 * @returns PageMetadata or null if not found
 */
export function getPageMetadata(pathname: string): PageMetadata | null {
  return PAGE_METADATA[pathname] || null;
}

/**
 * Get page title for a given pathname (convenience function)
 *
 * @param pathname - The current route path
 * @returns Page title or 'NeumanOS' as fallback
 */
export function getPageTitle(pathname: string): string {
  return PAGE_METADATA[pathname]?.title || 'NeumanOS';
}
