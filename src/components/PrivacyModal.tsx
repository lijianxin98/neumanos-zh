import React, { useState } from 'react';
import { Modal } from './Modal';
import { useThemeStore } from '../stores/useThemeStore';

interface PrivacyModalProps {
  onClose: () => void;
}

const PLATFORM_NAME = 'NeumanOS';
const PLATFORM_URL = 'https://os.neuman.dev';

const LINK_CLASS = 'text-accent-blue hover:text-accent-blue-hover hover:underline transition-all duration-standard ease-smooth';

/**
 * Renders content with platform name as a clickable link
 */
function renderContentWithLinks(text: string): React.ReactNode {
  const regex = new RegExp(`(${PLATFORM_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'g');
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part === PLATFORM_NAME) {
      return (
        <a
          key={index}
          href={PLATFORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={LINK_CLASS}
        >
          {PLATFORM_NAME}
        </a>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

/**
 * Privacy & Terms Modal
 * Displays Privacy Policy and Terms & Conditions in a modal format.
 * Matches the layout and styling of the About modal for consistency.
 */
export const PrivacyModal: React.FC<PrivacyModalProps> = ({ onClose }) => {
  const [selectedTab, setSelectedTab] = useState<'privacy' | 'terms'>('privacy');
  const mode = useThemeStore((s) => s.mode);
  const logoSrc = mode === 'dark' ? '/images/logos/logo_white.png' : '/images/logos/logo_black.png';

  return (
    <Modal
      isOpen={true}
      title="隐私与条款"
      onClose={onClose}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Logo Header */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-3/5 overflow-hidden">
            <img
              src={logoSrc}
              alt="NeumanOS 超级工作台"
              className="w-full h-auto object-contain"
            />
          </div>
          <a
            href={PLATFORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`${LINK_CLASS} text-sm font-medium`}
          >
            {PLATFORM_NAME}
          </a>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setSelectedTab('privacy')}
            className={`px-2 sm:px-3 py-1.5 rounded-button text-xs sm:text-sm font-medium transition-all duration-standard ease-smooth ${
              selectedTab === 'privacy'
                ? 'bg-accent-blue text-white'
                : 'bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
            }`}
          >
            <span className="hidden sm:inline">隐私政策</span>
            <span className="sm:hidden">隐私</span>
          </button>
          <button
            onClick={() => setSelectedTab('terms')}
            className={`px-2 sm:px-3 py-1.5 rounded-button text-xs sm:text-sm font-medium transition-all duration-standard ease-smooth ${
              selectedTab === 'terms'
                ? 'bg-accent-primary text-white'
                : 'bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
            }`}
          >
            <span className="hidden sm:inline">条款与条件</span>
            <span className="sm:hidden">条款</span>
          </button>
        </div>

        {/* Content Title */}
        <div className="text-center">
          <h3 className="text-base sm:text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
            {selectedTab === 'privacy' ? '隐私政策' : '条款与条件'}
          </h3>
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-0.5">
            {selectedTab === 'privacy' ? '最近更新：2025 年 11 月 16 日' : '即将推出'}
          </p>
        </div>

        {/* Content Area */}
        <div className="prose prose-sm max-w-none dark:prose-invert max-h-[35vh] sm:max-h-[45vh] overflow-y-auto pr-2">
          {selectedTab === 'privacy' ? (
            <PrivacyContent />
          ) : (
            <TermsContent />
          )}
        </div>

        {/* Footer Links */}
        <div className="border-t border-border-light dark:border-border-dark pt-3 mt-4">
          <div className="flex flex-wrap gap-3 justify-center text-xs">
            <a
              href={PLATFORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={LINK_CLASS}
            >
              官方网站
            </a>
            <a
              href="mailto:os@neuman.dev"
              className={LINK_CLASS}
            >
              联系我们
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
};

/**
 * Privacy Policy Content Component
 */
const PrivacyContent: React.FC = () => (
  <div className="space-y-4 text-text-light-primary dark:text-text-dark-primary text-xs sm:text-sm">
    {/* TL;DR Section */}
    <section>
      <h4 className="text-sm font-semibold mb-1">TL;DR</h4>
      <div className="bg-accent-blue/10 border-l-4 border-accent-blue rounded-r p-2">
        <p className="text-xs">
          <strong>我们尊重你的隐私。</strong>我们使用 Cloudflare Web Analytics（注重隐私、无 Cookie、无追踪）
          了解基本访问情况。你的个人数据始终留在你自己的设备上。我们从不出售或分享任何内容。
        </p>
      </div>
    </section>

    {/* Local-First Philosophy */}
    <section>
      <h4 className="text-sm font-semibold mb-1">🔒 本地优先理念</h4>
      <p className="mb-1 text-xs">
        <strong>你的数据属于你。</strong>你在 {renderContentWithLinks('NeumanOS')} 中创建的一切都留在本机：
      </p>
      <ul className="list-disc ml-4 space-y-0.5 text-text-light-secondary dark:text-text-dark-secondary text-[10px]">
        <li>笔记、任务、日历事件、看板——全部保存在本地 IndexedDB</li>
        <li>没有云存储、没有我们控制的服务器或数据库</li>
        <li>备份保存在你自己的电脑上（可选自动保存到你指定的文件夹）</li>
        <li>随时导出数据（.brain 格式）——完全归你所有</li>
      </ul>
    </section>

    {/* Analytics Section */}
    <section>
      <h4 className="text-sm font-semibold mb-1">📊 统计（Cloudflare Web Analytics）</h4>
      <p className="mb-2 text-xs">
        我们使用 <strong>Cloudflare Web Analytics</strong> 了解网站的基本使用情况。
        这能帮助我们把体验做得更好。
      </p>

      <div className="space-y-2">
        <div className="bg-accent-green/10 border border-accent-green/30 rounded-lg p-2">
          <h5 className="font-semibold text-accent-green mb-1 text-xs">
            ✅ 我们收集什么（仅汇总数据）：
          </h5>
          <ul className="list-disc ml-4 space-y-0.5 text-text-light-secondary dark:text-text-dark-secondary text-[10px]">
            <li>页面浏览量和会话时长</li>
            <li>来源信息</li>
            <li>浏览器类型和设备类别</li>
            <li>国家级地理数据（不含城市、不含 IP）</li>
            <li>页面加载性能指标</li>
          </ul>
        </div>

        <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-2">
          <h5 className="font-semibold text-accent-red mb-1 text-xs">
            ❌ 我们不收集：
          </h5>
          <ul className="list-disc ml-4 space-y-0.5 text-text-light-secondary dark:text-text-dark-secondary text-[10px]">
            <li>没有 Cookie 或追踪标识</li>
            <li>没有个人信息（邮箱、姓名等）</li>
            <li>没有跨站追踪</li>
            <li>没有单用户追踪或指纹识别</li>
            <li>没有 IP 地址（由 Cloudflare 匿名化）</li>
          </ul>
        </div>

        <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-lg p-2">
          <h5 className="font-semibold text-accent-blue mb-1 text-xs">
            为什么用 Cloudflare Analytics？
          </h5>
          <ul className="list-disc ml-4 space-y-0.5 text-text-light-secondary dark:text-text-dark-secondary text-[10px]">
            <li>注重隐私（无 Cookie、无指纹识别）</li>
            <li>GDPR/CCPA compliant</li>
            <li>尽量少收集数据（仅汇总指标）</li>
            <li>帮助我们了解哪些内容有价值</li>
          </ul>
        </div>
      </div>
    </section>

    {/* Data Processing */}
    <section>
      <h4 className="text-sm font-semibold mb-1">🔐 How Your Data is Processed</h4>
      <p className="mb-1 text-xs">All analytics data collected is:</p>
      <ul className="list-disc ml-4 space-y-0.5 text-text-light-secondary dark:text-text-dark-secondary text-[10px]">
        <li><strong>Anonymized</strong> at collection time (IP addresses never stored)</li>
        <li><strong>Aggregated</strong> (no individual user profiles)</li>
        <li><strong>Used solely for improving this site</strong></li>
        <li><strong>Never sold or shared</strong> with third parties</li>
        <li>
          <strong>Processed by Cloudflare</strong> (
          <a
            href="https://www.cloudflare.com/privacypolicy/"
            target="_blank"
            rel="noopener noreferrer"
            className={LINK_CLASS}
          >
            privacy policy
          </a>
          )
        </li>
      </ul>
    </section>

    {/* Your Rights */}
    <section>
      <h4 className="text-sm font-semibold mb-1">⚖️ 你的隐私权利</h4>
      <p className="mb-1 text-xs">你拥有完全控制权：</p>
      <ul className="list-disc ml-4 space-y-0.5 text-text-light-secondary dark:text-text-dark-secondary text-[10px]">
        <li><strong>屏蔽统计：</strong>可使用 uBlock Origin 或 Privacy Badger 等浏览器扩展</li>
        <li><strong>增强跟踪保护：</strong>Firefox 默认的 ETP 会拦截 Cloudflare Analytics</li>
        <li><strong>无需选择退出：</strong>没有 Cookie，也就不需要同意横幅</li>
        <li><strong>导出数据：</strong>随时下载你的全部个人数据（设置 → 导出备份）</li>
        <li><strong>删除数据：</strong>清除浏览器存储（设置 → 清除全部数据）</li>
      </ul>
    </section>

    {/* No Third Parties */}
    <section>
      <h4 className="text-sm font-semibold mb-1">🚫 没有第三方追踪器</h4>
      <p className="mb-1 text-xs">我们<strong>不会</strong>使用：</p>
      <ul className="list-disc ml-4 space-y-0.5 text-text-light-secondary dark:text-text-dark-secondary text-[10px]">
        <li>Google Analytics</li>
        <li>Facebook Pixel</li>
        <li>广告网络（完全没有广告）</li>
        <li>会话录制工具</li>
        <li>营销自动化</li>
      </ul>
      <p className="mt-1 text-text-light-secondary dark:text-text-dark-secondary text-[10px]">
        只用 Cloudflare Web Analytics 做基础、匿名的访问统计。仅此而已。
      </p>
    </section>

    {/* Changes to Policy */}
    <section>
      <h4 className="text-sm font-semibold mb-1">📝 政策变更</h4>
      <p className="text-text-light-secondary dark:text-text-dark-secondary text-[10px]">
        如果我们对本隐私政策做出重大变更，会更新「最近更新」日期。
        任何违背隐私优先理念的变更，我们都会醒目地通知你。
      </p>
    </section>

    {/* Contact */}
    <section>
      <h4 className="text-sm font-semibold mb-1">📧 有疑问？</h4>
      <p className="text-text-light-secondary dark:text-text-dark-secondary text-[10px]">
        对隐私有疑问？请发邮件至{' '}
        <a href="mailto:os@neuman.dev" className={LINK_CLASS}>
          os@neuman.dev
        </a>{' '}
        或到设置页查看数据导出/备份选项。
      </p>
    </section>

    {/* Philosophy Footer */}
    <section className="border-t border-border-light dark:border-border-dark pt-3 mt-3">
      <div className="bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 rounded-lg p-3">
        <h5 className="font-semibold mb-1 text-xs">💡 我们的隐私理念</h5>
        <p className="italic text-text-light-secondary dark:text-text-dark-secondary text-[10px]">
          “你的数据就是你的。我们做尊重这一点的工具。如果有一天在隐私上妥协，
          我们就走偏了。”
        </p>
        <p className="mt-1 text-[10px] text-text-light-secondary dark:text-text-dark-secondary">
          — Travis Neuman，{renderContentWithLinks('NeumanOS')} 的作者
        </p>
      </div>
    </section>
  </div>
);

/**
 * Terms & Conditions Content Component (Placeholder)
 */
const TermsContent: React.FC = () => (
  <div className="space-y-4 text-text-light-primary dark:text-text-dark-primary text-xs sm:text-sm">
    {/* Coming Soon Notice */}
    <section>
      <div className="bg-accent-primary/10 border-l-4 border-accent-primary rounded-r p-3">
        <h4 className="text-sm font-semibold mb-1">条款与条件</h4>
        <p className="text-text-light-secondary dark:text-text-dark-secondary text-xs">
          完整的条款与许可信息正在撰写中。
          本部分很快会补充完整说明，涵盖：
        </p>
      </div>
    </section>

    {/* Upcoming Content */}
    <section>
      <h4 className="text-sm font-semibold mb-2">📋 即将包含</h4>
      <ul className="list-disc ml-4 space-y-1 text-text-light-secondary dark:text-text-dark-secondary text-[10px]">
        <li><strong>服务条款：</strong>使用 {renderContentWithLinks('NeumanOS')} 的说明</li>
        <li><strong>许可：</strong>软件许可条款与开源致谢</li>
        <li><strong>用户责任：</strong>你作为用户的权利与义务</li>
        <li><strong>免责声明：</strong>保修与责任说明</li>
        <li><strong>数据所有权：</strong>再次确认你的数据属于你</li>
      </ul>
    </section>

    {/* Core Principles Preview */}
    <section>
      <h4 className="text-sm font-semibold mb-2">🎯 指导原则</h4>
      <p className="mb-2 text-text-light-secondary dark:text-text-dark-secondary text-xs">
        完整条款定稿前，以下原则会始终适用：
      </p>
      <div className="space-y-2">
        <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-2 border border-border-light dark:border-border-dark">
          <p className="text-xs font-medium">🔒 Your Data, Your Control</p>
          <p className="text-[10px] text-text-light-secondary dark:text-text-dark-secondary mt-0.5">
            All data stays on your device. We cannot access, view, or sell your information.
          </p>
        </div>
        <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-2 border border-border-light dark:border-border-dark">
          <p className="text-xs font-medium">📤 Full Portability</p>
          <p className="text-[10px] text-text-light-secondary dark:text-text-dark-secondary mt-0.5">
            Export your data anytime in standard formats. No lock-in, ever.
          </p>
        </div>
        <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-2 border border-border-light dark:border-border-dark">
          <p className="text-xs font-medium">🚫 No Hidden Agendas</p>
          <p className="text-[10px] text-text-light-secondary dark:text-text-dark-secondary mt-0.5">
            No ads, no tracking, no selling your attention to the highest bidder.
          </p>
        </div>
      </div>
    </section>

    {/* Contact for Questions */}
    <section>
      <h4 className="text-sm font-semibold mb-1">📧 有疑问？</h4>
      <p className="text-text-light-secondary dark:text-text-dark-secondary text-[10px]">
        Have questions about our terms or licensing? Email us at{' '}
        <a href="mailto:os@neuman.dev" className={LINK_CLASS}>
          os@neuman.dev
        </a>
      </p>
    </section>
  </div>
);
