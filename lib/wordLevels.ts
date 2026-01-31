// 词汇等级判断工具

export interface WordLevel {
  level: string; // 等级名称
  color: string; // 显示颜色
  bgColor: string; // 背景颜色
  priority: number; // 优先级（用于排序）
}

// 词汇等级配置
export const WORD_LEVELS: Record<string, WordLevel> = {
  '高考': { level: '高考', color: 'text-red-700', bgColor: 'bg-red-100', priority: 1 },
  '四级': { level: '四级', color: 'text-blue-700', bgColor: 'bg-blue-100', priority: 2 },
  '六级': { level: '六级', color: 'text-purple-700', bgColor: 'bg-purple-100', priority: 3 },
  '考研': { level: '考研', color: 'text-orange-700', bgColor: 'bg-orange-100', priority: 4 },
  '托福': { level: '托福', color: 'text-green-700', bgColor: 'bg-green-100', priority: 5 },
  '雅思': { level: '雅思', color: 'text-teal-700', bgColor: 'bg-teal-100', priority: 6 },
  'GRE': { level: 'GRE', color: 'text-indigo-700', bgColor: 'bg-indigo-100', priority: 7 },
};

// 高考词汇（3500个核心词）
const gaokaoWords = new Set([
  'abandon', 'ability', 'able', 'about', 'above', 'abroad', 'absence', 'absent', 'absolute',
  'absorb', 'abstract', 'abundant', 'abuse', 'academic', 'accept', 'access', 'accident',
  'accompany', 'accomplish', 'according', 'account', 'accumulate', 'accurate', 'accuse',
  'accustom', 'ache', 'achieve', 'achievement', 'acid', 'acknowledge', 'acquire', 'across',
  'act', 'action', 'active', 'activity', 'actual', 'acute', 'adapt', 'add', 'addition',
  'additional', 'address', 'adequate', 'adjust', 'administration', 'admire', 'admission',
  'admit', 'adopt', 'adult', 'advance', 'advanced', 'advantage', 'adventure', 'advertise',
  'advice', 'advise', 'advocate', 'affair', 'affect', 'affection', 'afford', 'afraid',
  'after', 'afternoon', 'afterward', 'again', 'against', 'age', 'agency', 'agenda',
  'agent', 'aggressive', 'ago', 'agree', 'agreement', 'agriculture', 'ahead', 'aid',
  'aim', 'air', 'aircraft', 'airline', 'airport', 'alarm', 'album', 'alcohol',
  'alert', 'alike', 'alive', 'all', 'allow', 'almost', 'alone', 'along',
  'aloud', 'already', 'also', 'alter', 'alternative', 'although', 'altogether', 'always',
  'amazing', 'ambition', 'among', 'amount', 'amuse', 'analyse', 'ancient', 'and',
  'anger', 'angle', 'angry', 'animal', 'announce', 'annoy', 'annual', 'another',
  'answer', 'anticipate', 'anxious', 'any', 'anybody', 'anyhow', 'anyone', 'anything',
  'anyway', 'anywhere', 'apart', 'apologize', 'apparent', 'appeal', 'appear', 'appearance',
  'appetite', 'applaud', 'apple', 'application', 'apply', 'appoint', 'appreciate', 'approach',
  'appropriate', 'approve', 'approximate', 'architect', 'area', 'argue', 'arise', 'arm',
  'army', 'around', 'arouse', 'arrange', 'arrest', 'arrival', 'arrive', 'art',
  'article', 'artificial', 'artist', 'as', 'ashamed', 'aside', 'ask', 'asleep',
  'aspect', 'assess', 'assign', 'assist', 'associate', 'assume', 'assure', 'astonish',
  'astronaut', 'athlete', 'atmosphere', 'attach', 'attack', 'attain', 'attempt', 'attend',
  'attention', 'attitude', 'attract', 'attractive', 'attribute', 'audience', 'author', 'authority',
  'automatic', 'available', 'average', 'avoid', 'awake', 'award', 'aware', 'away',
  'awful', 'awkward', 'baby', 'back', 'background', 'backward', 'bacteria', 'bad',
  'badly', 'bag', 'balance', 'ball', 'ban', 'band', 'bank', 'bar',
  'barely', 'bargain', 'barrier', 'base', 'basic', 'basis', 'basket', 'bathroom',
  'battery', 'battle', 'be', 'beach', 'bear', 'beard', 'beast', 'beat',
  'beautiful', 'beauty', 'because', 'become', 'bed', 'bedroom', 'bee', 'beef',
  'beer', 'before', 'beg', 'begin', 'beginning', 'behave', 'behavior', 'behind',
  'being', 'belief', 'believe', 'bell', 'belong', 'below', 'belt', 'bench',
  'bend', 'beneath', 'beneficial', 'benefit', 'beside', 'besides', 'best', 'bet',
  'betray', 'better', 'between', 'beyond', 'bicycle', 'bid', 'big', 'bike',
  'bill', 'billion', 'bind', 'biology', 'bird', 'birth', 'birthday', 'bit',
  'bite', 'bitter', 'black', 'blame', 'blank', 'blanket', 'bleed', 'bless',
  'blind', 'block', 'blood', 'blow', 'blue', 'board', 'boat', 'body',
  'boil', 'bold', 'bomb', 'bond', 'bone', 'book', 'boom', 'boost',
  'boot', 'border', 'bore', 'born', 'borrow', 'boss', 'both', 'bother',
  'bottle', 'bottom', 'boundary', 'bow', 'bowl', 'box', 'boy', 'brain',
  'brake', 'branch', 'brand', 'brave', 'bread', 'break', 'breakfast', 'breast',
  'breath', 'breathe', 'breed', 'breeze', 'brick', 'bride', 'bridge', 'brief',
  'bright', 'brilliant', 'bring', 'broad', 'broadcast', 'brother', 'brown', 'brush',
  'budget', 'build', 'building', 'burden', 'burn', 'burst', 'bury', 'bus',
  'business', 'busy', 'but', 'butter', 'button', 'buy', 'by', 'cab',
  'cabin', 'cabinet', 'cafe', 'cage', 'cake', 'calculate', 'call', 'calm',
  'camera', 'camp', 'campaign', 'campus', 'can', 'canal', 'cancel', 'cancer',
  'candidate', 'candle', 'capable', 'capacity', 'capital', 'captain', 'capture', 'car',
  'card', 'care', 'career', 'careful', 'careless', 'cargo', 'carry', 'cart',
  'case', 'cash', 'cast', 'castle', 'casual', 'cat', 'catalog', 'catch',
  'category', 'cater', 'cause', 'caution', 'cease', 'ceiling', 'celebrate', 'cell',
  'cent', 'center', 'central', 'century', 'ceremony', 'certain', 'certainly', 'certificate',
  'chain', 'chair', 'chairman', 'challenge', 'chamber', 'champion', 'chance', 'change',
  'channel', 'chapter', 'character', 'characteristic', 'charge', 'charity', 'charm', 'chart',
  'chase', 'cheap', 'cheat', 'check', 'cheek', 'cheer', 'cheerful', 'cheese',
  'chemical', 'chemistry', 'chest', 'chew', 'chicken', 'chief', 'child', 'childhood',
  'chill', 'chimney', 'china', 'chip', 'chocolate', 'choice', 'choose', 'chop',
  'Christmas', 'church', 'cigarette', 'cinema', 'circle', 'circuit', 'circumstance', 'cite',
  'citizen', 'city', 'civil', 'claim', 'clarify', 'class', 'classic', 'classical',
  'classify', 'classroom', 'clean', 'clear', 'clerk', 'clever', 'click', 'client',
  'cliff', 'climate', 'climb', 'clock', 'close', 'cloth', 'clothes', 'clothing',
  'cloud', 'cloudy', 'club', 'clue', 'clumsy', 'coach', 'coal', 'coast',
  'coat', 'code', 'coffee', 'coin', 'cold', 'collapse', 'collar', 'colleague',
  'collect', 'collection', 'collective', 'college', 'colony', 'color', 'column', 'combine',
  'come', 'comedy', 'comfort', 'comfortable', 'command', 'comment', 'commerce', 'commercial',
  'commission', 'commit', 'commitment', 'committee', 'common', 'communicate', 'community', 'company',
  // ... 为了不让代码太长，这里只列出部分，实际应该包含完整3500词
  'hello', 'world', 'study', 'learn', 'knowledge', 'information', 'education', 'school',
  'student', 'teacher', 'beautiful', 'important', 'understand', 'develop', 'practice',
]);

// 四级词汇（4500个）- 包含高考词汇
const cet4Words = new Set([
  ...Array.from(gaokaoWords),
  'abound', 'abridge', 'absorb', 'abstract', 'absurd', 'abundant', 'abuse', 'academic',
  'accelerate', 'accent', 'acceptance', 'accident', 'accommodate', 'accommodation', 'accompany',
  'accomplish', 'accord', 'accordance', 'accordingly', 'account', 'accountant', 'accumulate',
  'accuracy', 'accurate', 'accuse', 'accustomed', 'ache', 'achieve', 'achievement', 'acid',
  'acknowledge', 'acquaint', 'acquaintance', 'acquire', 'acquisition', 'acre', 'across', 'act',
  // ... 四级特有词汇
  'abandon', 'complex', 'comprehensive', 'comprise', 'compromise', 'compulsory', 'compute',
  'conceive', 'concentrate', 'concentration', 'concept', 'concern', 'concert', 'conclude',
]);

// 六级词汇（6000个）- 包含四级词汇
const cet6Words = new Set([
  ...Array.from(cet4Words),
  'abbreviate', 'abdomen', 'abide', 'abolish', 'abort', 'abrupt', 'absorb', 'abstain',
  'abstract', 'absurd', 'abundance', 'abuse', 'academy', 'accelerate', 'accent', 'accentuate',
  // ... 六级特有词汇
  'consolidate', 'conspiracy', 'constituent', 'constitute', 'constitution', 'constraint',
]);

// 托福词汇（8000个）
const toeflWords = new Set([
  ...Array.from(cet6Words),
  'abdicate', 'aberrant', 'abeyance', 'abhor', 'abject', 'abjure', 'abnegate', 'abolish',
  'abominable', 'aboriginal', 'abortive', 'abrasive', 'abridge', 'abrogate', 'abscond',
  // ... 托福特有词汇
]);

// 雅思词汇（8000个）
const ieltsWords = new Set([
  ...Array.from(cet6Words),
  'accommodate', 'accumulate', 'accurate', 'achieve', 'acknowledge', 'acquire', 'adapt',
  // ... 雅思特有词汇
]);

// GRE词汇（12000个）
const greWords = new Set([
  ...Array.from(toeflWords),
  'abase', 'abash', 'abate', 'abbreviate', 'abdicate', 'aberrant', 'abet', 'abeyance',
  // ... GRE特有词汇
]);

/**
 * 判断单词属于哪些词汇等级
 * @param word 单词
 * @returns 词汇等级数组，按优先级排序
 */
export function getWordLevels(word: string): WordLevel[] {
  const levels: WordLevel[] = [];
  const lowerWord = word.toLowerCase();

  // 按优先级检查（从高考到GRE）
  if (gaokaoWords.has(lowerWord)) {
    levels.push(WORD_LEVELS['高考']);
  }
  if (cet4Words.has(lowerWord)) {
    levels.push(WORD_LEVELS['四级']);
  }
  if (cet6Words.has(lowerWord)) {
    levels.push(WORD_LEVELS['六级']);
  }
  if (toeflWords.has(lowerWord)) {
    levels.push(WORD_LEVELS['托福']);
  }
  if (ieltsWords.has(lowerWord)) {
    levels.push(WORD_LEVELS['雅思']);
  }
  if (greWords.has(lowerWord)) {
    levels.push(WORD_LEVELS['GRE']);
  }

  return levels;
}

/**
 * 获取单词的最高等级
 */
export function getHighestLevel(word: string): WordLevel | null {
  const levels = getWordLevels(word);
  return levels.length > 0 ? levels[0] : null;
}
