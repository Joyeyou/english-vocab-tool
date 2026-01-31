// 智能中文翻译映射系统
// 根据英文定义自动生成准确的中文翻译

/**
 * 根据英文释义智能提取中文翻译
 */
export function getChineseTranslation(
  englishDefinition: string,
  partOfSpeech: string,
  baseTranslation: string
): string {
  const def = englishDefinition.toLowerCase();

  // 名词翻译规则
  if (partOfSpeech === 'n.' || partOfSpeech === 'noun') {
    if (def.includes('person') && def.includes('partner')) return '伙伴；合伙人';
    if (def.includes('coworker') || def.includes('colleague')) return '同事；同僚';
    if (def.includes('companion') || def.includes('comrade')) return '伙伴；同伴';
    if (def.includes('member')) return '会员；成员';
  }

  // 动词翻译规则
  if (partOfSpeech === 'v.' || partOfSpeech === 'verb') {
    if (def.includes('join') && def.includes('league')) return '联合；结合';
    if (def.includes('spend time') || def.includes('keep company')) return '交往；来往';
    if (def.includes('combine') || def.includes('connect')) return '联系；联合';
    if (def.includes('join as') && def.includes('partner')) return '与…合伙；与…联合';
    if (def.includes('devise') && def.includes('mind')) return '设计；规划';
    if (def.includes('plan') && def.includes('estimate')) return '预测；估计';
    if (def.includes('throw') || def.includes('cast forward')) return '投射；投掷';
  }

  // 形容词翻译规则
  if (partOfSpeech === 'adj.' || partOfSpeech === 'adjective') {
    if (def.includes('lower status')) return '副的；准的';
    if (def.includes('partial') && def.includes('privileges')) return '非正式的；准的';
    if (def.includes('following') || def.includes('accompanying')) return '伴随的；联合的';
  }

  // 如果没有匹配规则，返回基础翻译
  return baseTranslation;
}

/**
 * 常见单词的完整翻译数据库（高频词）
 */
export const WORD_TRANSLATIONS: Record<string, {
  word: string;
  phonetics?: string[];
  meanings: Array<{
    pos: string; // 词性
    translations: string[]; // 中文释义（多个）
  }>;
  synonyms?: string[]; // 同义词
}> = {
  'associate': {
    word: 'associate',
    phonetics: ['/əˈsəʊʃieɪt/', '/əˈsəʊʃiət/'],
    meanings: [
      {
        pos: 'v.',
        translations: ['使联合', '使有联系', '交往']
      },
      {
        pos: 'n.',
        translations: ['伙伴', '同事', '合伙人']
      },
      {
        pos: 'adj.',
        translations: ['副的', '联合的', '合伙的']
      }
    ],
    synonyms: ['combine', 'join', 'unite', 'connect']
  },
  'abandon': {
    word: 'abandon',
    phonetics: ['/əˈbændən/'],
    meanings: [
      {
        pos: 'v.',
        translations: ['放弃', '抛弃', '遗弃', '离弃']
      },
      {
        pos: 'n.',
        translations: ['放纵', '放任']
      }
    ],
    synonyms: ['desert', 'forsake', 'give up', 'quit']
  },
  'study': {
    word: 'study',
    phonetics: ['/ˈstʌdi/'],
    meanings: [
      {
        pos: 'v.',
        translations: ['学习', '研究', '细察', '端详']
      },
      {
        pos: 'n.',
        translations: ['学习', '研究', '学科', '书房', '课题']
      }
    ],
    synonyms: ['learn', 'research', 'examine', 'investigate']
  },
  'learn': {
    word: 'learn',
    phonetics: ['/lɜːn/'],
    meanings: [
      {
        pos: 'v.',
        translations: ['学习', '学会', '得知', '认识到', '记住']
      }
    ],
    synonyms: ['study', 'acquire', 'master', 'grasp']
  },
  'make': {
    word: 'make',
    phonetics: ['/meɪk/'],
    meanings: [
      {
        pos: 'v.',
        translations: ['制作', '做', '使得', '进行', '造成']
      },
      {
        pos: 'n.',
        translations: ['制造', '品牌', '性格']
      }
    ],
    synonyms: ['create', 'produce', 'build', 'construct']
  },
  'take': {
    word: 'take',
    phonetics: ['/teɪk/'],
    meanings: [
      {
        pos: 'v.',
        translations: ['拿', '取', '采取', '接受', '需要', '花费']
      },
      {
        pos: 'n.',
        translations: ['镜头', '收入']
      }
    ],
    synonyms: ['get', 'grab', 'seize', 'accept']
  },
  'beautiful': {
    word: 'beautiful',
    phonetics: ['/ˈbjuːtɪfl/'],
    meanings: [
      {
        pos: 'adj.',
        translations: ['美丽的', '漂亮的', '优美的', '极好的']
      }
    ],
    synonyms: ['pretty', 'lovely', 'gorgeous', 'attractive']
  },
  'optimum': {
    word: 'optimum',
    phonetics: ['/ˈɒptɪməm/'],
    meanings: [
      {
        pos: 'n.',
        translations: ['最佳状态', '最适条件', '最优值']
      },
      {
        pos: 'adj.',
        translations: ['最优的', '最佳的', '最适宜的']
      }
    ],
    synonyms: ['best', 'ideal', 'optimal', 'perfect']
  },
  'optimal': {
    word: 'optimal',
    phonetics: ['/ˈɒptɪməl/'],
    meanings: [
      {
        pos: 'adj.',
        translations: ['最优的', '最佳的', '最理想的']
      }
    ],
    synonyms: ['optimum', 'best', 'ideal', 'perfect']
  },
  'information': {
    word: 'information',
    phonetics: ['/ˌɪnfəˈmeɪʃn/'],
    meanings: [
      {
        pos: 'n.',
        translations: ['信息', '资料', '情报', '通知']
      }
    ],
    synonyms: ['data', 'facts', 'knowledge', 'intelligence']
  },
  'project': {
    word: 'project',
    phonetics: ['/ˈprɑːdʒekt/', '/prəˈdʒekt/'],
    meanings: [
      {
        pos: 'n.',
        translations: ['项目', '工程', '计划', '课题']
      },
      {
        pos: 'v.',
        translations: ['投射', '预测', '设计', '突出']
      }
    ],
    synonyms: ['plan', 'scheme', 'design', 'venture']
  }
};

/**
 * 获取单词的完整翻译数据
 */
export function getWordTranslationData(word: string) {
  return WORD_TRANSLATIONS[word.toLowerCase()];
}

/**
 * 常见例句翻译映射
 */
export const EXAMPLE_TRANSLATIONS: Record<string, string> = {
  // associate 例句
  'she associates with her coworkers on weekends': '她在周末与同事交往。',
  'he associated his name with many environmental causes': '他将自己的名字与许多环保事业联系在一起。',
  'particles of gold associated with other substances': '与其他物质结合的金粒子',

  // optimum 例句
  'we need to find the optimum solution': '我们需要找到最优解决方案。',
  'this is the optimum temperature for growth': '这是生长的最适温度。',
  'the plant grows best at optimum conditions': '该植物在最佳条件下生长最好。',

  // project 例句
  'a nation is an entity on which one can project': '一个国家是可以投射的实体',
  'he tried to project himself as a strong leader': '他试图将自己塑造成一个强有力的领导者。',
  'project many of the worst': '投射出许多最坏的',
  'project himself as': '将自己塑造为；展现自己为',

  // 通用句型
  'people always associate': '人们总是把...联系在一起',
  'many baby girls have been abandoned': '许多女婴被遗弃',

  // 其他常见例句可以继续添加
};

/**
 * 智能翻译例句
 */
export function translateExampleSentence(sentence: string, word: string, wordMeaning: string): string {
  const lowerSentence = sentence.toLowerCase();

  // 精确匹配
  if (EXAMPLE_TRANSLATIONS[lowerSentence]) {
    return EXAMPLE_TRANSLATIONS[lowerSentence];
  }

  // 部分匹配
  for (const [pattern, translation] of Object.entries(EXAMPLE_TRANSLATIONS)) {
    if (lowerSentence.includes(pattern)) {
      return translation;
    }
  }

  // 默认返回简单说明
  return `（例句展示"${word}"作为"${wordMeaning}"的用法）`;
}
