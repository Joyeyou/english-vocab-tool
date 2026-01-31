// 单词数据类型定义

export interface WordTranslation {
  partOfSpeech: string; // 词性
  chineseDefinition: string; // 中文释义
  englishDefinition: string; // 英文释义
}

export interface WordPhrase {
  phrase: string; // 短语
  translation: string; // 翻译
}

export interface WordExample {
  sentence: string; // 例句
  translation: string; // 翻译
}

export interface DerivedWord {
  word: string; // 派生词
  partOfSpeech: string; // 词性
  definition: string; // 中文解释
}

export interface WordData {
  word: string; // 单词
  phonetic?: string; // 音标
  translations: WordTranslation[]; // 翻译列表
  phrases: WordPhrase[]; // 常见短语
  examples: WordExample[]; // 例句
  synonyms?: string[]; // 同义词
  derivedWords?: DerivedWord[]; // 派生词
}

export interface SavedWord extends WordData {
  savedAt: number; // 保存时间戳
  isFavorite: boolean; // 是否收藏
}

// 有道API响应类型
export interface YoudaoApiResponse {
  errorCode: string;
  query: string;
  translation?: string[];
  basic?: {
    phonetic?: string;
    explains?: string[];
    'us-phonetic'?: string;
    'uk-phonetic'?: string;
  };
  web?: Array<{
    key: string;
    value: string[];
  }>;
  l?: string;
  source?: string;
}

// Free Dictionary API响应类型
export interface FreeDictionaryResponse {
  word: string;
  phonetic?: string;
  phonetics?: Array<{
    text?: string;
    audio?: string;
  }>;
  meanings?: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
      synonyms?: string[];
      antonyms?: string[];
    }>;
  }>;
  chineseTranslation?: string;
  source?: string;
}

// Merriam-Webster API响应类型
export interface MerriamWebsterResponse {
  mwData: Array<{
    meta?: {
      id: string;
      stems: string[];
    };
    hwi?: {
      hw: string;
      prs?: Array<{
        mw?: string;
        sound?: any;
      }>;
    };
    fl?: string; // 词性
    def?: Array<{
      sseq: any[][][]; // 定义序列
    }>;
    shortdef?: string[]; // 简短定义
    syns?: Array<{
      pt: Array<Array<string | any>>;
    }>; // 同义词
  }>;
  chineseTranslation?: string;
  source: string;
}
