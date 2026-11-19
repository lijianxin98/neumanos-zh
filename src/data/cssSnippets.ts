export interface CSSSnippet {
  name: string;
  description: string;
  css: string;
}

export const cssSnippets: CSSSnippet[] = [
  {
    name: '紧凑模式',
    description: '缩小整个界面的内边距和外边距',
    css: `/* Compact Mode */
.bento-card { padding: 0.75rem !important; }
.space-y-6 > * + * { margin-top: 0.75rem !important; }
.space-y-4 > * + * { margin-top: 0.5rem !important; }
.gap-6 { gap: 0.75rem !important; }
.gap-4 { gap: 0.5rem !important; }
.p-6 { padding: 0.75rem !important; }
.p-4 { padding: 0.5rem !important; }`,
  },
  {
    name: '更大文字',
    description: '增大基础字号，提升可读性',
    css: `/* Larger Text */
html { font-size: 18px !important; }
.text-sm { font-size: 0.95rem !important; }
.text-xs { font-size: 0.85rem !important; }`,
  },
  {
    name: '隐藏动画',
    description: '关闭所有过渡和动画',
    css: `/* Hide Animations */
*, *::before, *::after {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  transition-duration: 0s !important;
  transition-delay: 0s !important;
}`,
  },
  {
    name: '自定义强调色',
    description: '将强调色改为自定义颜色',
    css: `/* Custom Accent Color — change the hex to your preferred color */
:root {
  --accent-primary: #e11d48 !important;
}`,
  },
  {
    name: '全面圆角',
    description: '为所有元素应用最大圆角',
    css: `/* Rounded Everything */
.bento-card,
[class*="rounded"] {
  border-radius: 1.5rem !important;
}
button, input, select, textarea {
  border-radius: 1rem !important;
}`,
  },
  {
    name: '扁平设计',
    description: '去掉所有阴影和渐变，呈现扁平风格',
    css: `/* Flat Design */
* {
  box-shadow: none !important;
  text-shadow: none !important;
}
[class*="shadow"] {
  box-shadow: none !important;
}
[style*="gradient"] {
  background-image: none !important;
}`,
  },
  {
    name: '专注模式排版',
    description: '使用更大的衬线字体，适合阅读笔记',
    css: `/* Focus Mode Typography */
.ProseMirror,
[class*="editor"],
[class*="note-content"] {
  font-family: Georgia, 'Times New Roman', serif !important;
  font-size: 1.15rem !important;
  line-height: 1.8 !important;
  max-width: 65ch !important;
  margin-left: auto !important;
  margin-right: auto !important;
}`,
  },
  {
    name: '高对比度',
    description: '提高对比度，改善无障碍体验',
    css: `/* High Contrast */
:root {
  --text-light-primary: #000000 !important;
  --text-dark-primary: #ffffff !important;
  --text-light-secondary: #1a1a1a !important;
  --text-dark-secondary: #e5e5e5 !important;
  --border-light: #333333 !important;
  --border-dark: #cccccc !important;
}`,
  },
];
