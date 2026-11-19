/**
 * About Us Content
 *
 * Centralized content for the About Us modal and related brand messaging.
 * This keeps content separate from component logic for easier maintenance.
 *
 * Structure:
 * - stories: Full narratives for desktop (Story 1 = Platform, Story 2 = Founder)
 * - compact: Shortened versions for mobile display
 * - foundation: 1% status messaging
 * - philosophy: Hero/footer reusable blocks
 * - taglines: Micro tagline options for various contexts
 */

export interface AboutUsContent {
  stories: {
    platform: {
      title: string;
      subtitle: string;
      content: string;
    };
    founder: {
      title: string;
      subtitle: string;
      content: string;
    };
  };
  compact: {
    platform: {
      title: string;
      subtitle: string;
      content: string;
    };
    founder: {
      title: string;
      subtitle: string;
      content: string;
    };
  };
  foundation: string;
  philosophy: {
    full: string;
    short: string;
  };
  taglines: string[];
}

export const aboutUsContent: AboutUsContent = {
  stories: {
    platform: {
      title: '平台与原则',
      subtitle: 'NeumanOS',
      content: `NeumanOS 的出现，是因为那些本该帮我们整理生活的工具，悄悄变成了另一种混乱来源。

很多人如今活在一堆订阅和标签页里：规划一个应用，灵感一个应用，跟踪工作又一个，个人事务再一个，办公室还叠着几块仪表盘。每一个都承诺带来清晰。合在一起，却把注意力撕碎、把事情做重，信息散落在你并不真正掌控的系统里。

更糟的是，许多工具看起来半成品：新功能叠在旧问题上，工作流始终打磨不到位，产品转向比你建立信任还快。结果是：重要而复杂的生活与事业，被一堆对卖家更方便的工具勉强拼着管。

NeumanOS 从相反的起点出发。

我们没有去追逐表面功能，迄今几乎所有精力都花在经得起时间考验的底座上：信息如何存储、如何保护隐私、如何处理风险、系统在扩张之前该怎样表现。目标不是用长长的功能清单取悦人，而是赢得托付真实承诺、笔记与决定的资格。

这个底座由几条核心原则定义：

• 本地优先 —— 你的信息应先活在你这边，而不是锁在别人的订阅或基础设施后面。

• 所有权与尊重 —— 你的想法、计划和记录，不是参与度指标或增长策略的燃料。它们是私人物品，不是产品。

• 诚实沟通 —— 平台按真实状态来描述：仍早、底座为重、远未完成。没有营销虚构。

• 平静设计 —— 没有人造紧迫、注意力陷阱或操控流程。工具应安静地托住你的专注，而不是与它抢。

• 适配多种生活 —— 无论你在经营家庭、团队、事业，还是三者同时进行，同一套核心都应自然好用。

NeumanOS 是一项长期努力：证明一套整理系统可以有原则、稳定，并真正尊重依赖它的人。它不是针对某一个职场或产品，而是针对订阅膨胀、半成品工具却要求信任的普遍模式。

如果你厌倦了在工具之间被摊薄——也厌倦了租用自己的信息——NeumanOS 正被打造成一个重要事物可以按你的方式共处一地的地方。`,
    },
    founder: {
      title: '价值观与背景',
      subtitle: '来自创始人',
      content: `我叫 Travis J. Neuman，NeumanOS 始于我给自己画下的一条底线：工具应当怎样对待我们。

我的职业生涯在信息技术与运维中度过。我曾作为 IT 经理和高级系统管理员，支持过一家多门店的酒店集团。现在我在全球工业技术环境中，担任托管服务的技术项目经理。我照看过服务器、网络、收银系统、云服务、监控平台，以及让企业运转的许多工具。

我真心喜欢这份工作，现在也是。我有幸与我尊重的团队和组织共事。NeumanOS 不是针对任何雇主——过去或现在——的抗议。它回应的是更大的事情：作为个人和职业者，我们越来越被庞大的订阅栈和未完成产品绑住，办公室内外皆是。

这些年我也跑过 homelab、做过个人网站，几乎试过你能想到的每一类「效率」工具。有些在特定领域很出色。极少让人觉得：它被认真工程化、有伦理底线，足以成为人生真正要紧之事的长期归处。

于是我不再找下一个应用，而是从零开始做平台，并选择用企业依赖的基础设施那种认真程度来对待它。

所以 NeumanOS 早期工作聚焦于：

• 定义本地优先的路径，让人不必交出信息控制权。

• 把隐私边界和风险假设写下来，而不是藏起来。

• 为「平台怎么被描述」与「它实际能做什么」设立诚实标准。

• 让代码和产品达到可以托付真实责任的程度，而不只是适合业余项目。

我自己也在用这个平台。我的项目、日常和规划，都活在 NeumanOS 同一套底座上。这意味着我最先碰到毛边，也像其他用户一样受益于改进。这也让我踏实：如果某个决定对我自己的生活都不可接受，它就不该出现在产品里。

我对 NeumanOS 的坚持很简单：

• 托住我们生活的工具，应当按尊重来设计，而不是操控。

• 我们的信息不该成为订阅和摇摆商业模式的人质。

• 底座要仔细打，哪怕从外面看起来进展更慢。

NeumanOS 就是这些信念在代码、设计和实践里的持续表达。`,
    },
  },
  compact: {
    platform: {
      title: '平台',
      subtitle: 'NeumanOS',
      content: `NeumanOS 回应两个安静的问题：工具过载，以及浅薄的手艺。

我们同时在多个应用和订阅之间周旋，只为让正常的生活与事业继续。每一个都试图解决拼图的一小块，合在一起却把注意力打散，信息落在我们并不真正掌控的系统里。

这个平台从底座往上建，而不是当功能清单。迄今的工作围绕本地优先、清晰的隐私边界、诚实沟通与平静设计——好让人们把工作与生活托付给它时，这份信任是挣来的。

NeumanOS 给所有想要一个有原则的地方来整理世界、又不想租用自己数据的人。`,
    },
    founder: {
      title: '来自创始人',
      subtitle: '',
      content: `我是 Travis J. Neuman，一名 IT 从业者，多年来支持真实的企业、真实的基础设施、真实的人。

我见过我们有多么依赖软件把责任托住，也见过那些软件多么零碎、订阅沉重、半成品。我也享受过与做重要工作的组织共事，所以这个项目并不针对某一个雇主。它针对的是把我们所有人困在工具蔓延里的那种模式。

NeumanOS 是我决定做点不一样的东西。我把它当关键基础设施来对待：设计上本地优先，对隐私和风险直言不讳，在描述和使用上坚持更高的诚实标准。

这是我想给自己用的平台——我也在为所有厌倦了在工具如何对待自己这件事上妥协的人而做。`,
    },
  },
  foundation: `NeumanOS 有意停在 1% 的位置——迄今大部分工作都花在打牢底座和伦理护栏上，好让之后每一层都落在你真正信得过的东西上。`,
  philosophy: {
    full: `我们相信，托住生活的工具应当尊重我们。NeumanOS 本地优先、对订阅保持审慎，并对自己能做什么、不能做什么毫不含糊——好让你掌控信息，而不是反过来。`,
    short: `NeumanOS 建立在一个简单想法上：整理生活与工作，绝不该以交出数据所有权或注意力为代价。`,
  },
  taglines: [
    'NeumanOS 是本地优先、以伦理为驱动的平台，帮你整理生活与工作，而不交出数据。',
    '按关键基础设施来建，为真实生活而设计——NeumanOS 把信息和注意力交还给你。',
    '一种平静、有原则的方式，把要紧的事放在同一处——而不是被工具占有。',
  ],

};

/**
 * Get a random tagline from the available options
 */
export function getRandomTagline(): string {
  return aboutUsContent.taglines[Math.floor(Math.random() * aboutUsContent.taglines.length)];
}
