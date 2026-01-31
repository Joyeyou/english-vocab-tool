import { NextRequest, NextResponse } from 'next/server';

// 有道API - 获取中文释义
async function getYoudaoData(word: string) {
  try {
    const response = await fetch(
      `http://fanyi.youdao.com/openapi.do?keyfrom=english-vocab&key=123456&type=data&doctype=json&version=1.1&q=${encodeURIComponent(word)}`
    );
    if (!response.ok) return null;

    const data = await response.json();
    if (data.errorCode !== 0) return null;

    const translations: Array<{ partOfSpeech: string; chineseDefinition: string; englishDefinition: string }> = [];
    const examples: Array<{ sentence: string; translation: string }> = [];

    // 处理基本释义
    if (data.basic?.explains) {
      for (const explain of data.basic.explains) {
        // 解析 "n. 解释" 这种格式
        const match = explain.match(/^([a-z\.]+)\s+(.+)$/);
        if (match) {
          translations.push({
            partOfSpeech: match[1],
            chineseDefinition: match[2],
            englishDefinition: '',
          });
        } else {
          translations.push({
            partOfSpeech: '',
            chineseDefinition: explain,
            englishDefinition: '',
          });
        }
      }
    }

    // 处理网络释义（更多例句）
    if (data.web) {
      for (const webItem of data.web) {
        if (webItem.value) {
          for (const example of webItem.value.slice(0, 2)) {
            examples.push({ sentence: example, translation: '' });
          }
        }
      }
    }

    return {
      word: data.query,
      phonetic: data.basic?.phonetic || data.basic?.['us-phonetic'] || '',
      translations,
      examples: examples.slice(0, 3),
      synonyms: [],
    };
  } catch (error) {
    console.error('Youdao API error:', error);
    return null;
  }
}

// Free Dictionary API - 获取英文释义和例句
async function getFreeDictionaryData(word: string) {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!response.ok) return null;

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const entry = data[0];
    const meanings = entry.meanings || [];

    // 解析释义
    const translations: Array<{ partOfSpeech: string; chineseDefinition: string; englishDefinition: string }> = [];
    const examples: Array<{ sentence: string; translation: string }> = [];
    const synonyms: string[] = [];

    for (const meaning of meanings) {
      const partOfSpeech = meaning.partOfSpeech || '';

      for (const def of meaning.definitions || []) {
        translations.push({
          partOfSpeech,
          chineseDefinition: def.definition || '',
          englishDefinition: def.example || '',
        });

        if (def.example) {
          examples.push({ sentence: def.example, translation: '' });
        }

        if (def.synonyms && def.synonyms.length > 0) {
          synonyms.push(...def.synonyms.slice(0, 5));
        }
      }
    }

    // 获取音标
    const phonetic = entry.phonetic ||
      (entry.phonetics && entry.phonetics[0]?.text) ||
      (entry.phonetics?.find((p: any) => p.text)?.text) || '';

    return {
      word: entry.word,
      phonetic,
      translations: translations.slice(0, 6),
      examples: examples.slice(0, 3),
      synonyms: [...new Set(synonyms)].slice(0, 6),
    };
  } catch (error) {
    console.error('Free Dictionary API error:', error);
    return null;
  }
}

// Datamuse API - 获取短语搭配
async function getPhrases(word: string) {
  try {
    const response = await fetch(
      `https://api.datamuse.com/words?ml=${encodeURIComponent(word)}&max=6`
    );
    if (!response.ok) return [];

    const data = await response.json();
    return data.slice(0, 6).map((item: any) => ({
      phrase: item.word,
      translation: '',
    }));
  } catch (error) {
    console.error('Datamuse phrases API error:', error);
    return [];
  }
}

// 生成派生词（基于词缀规则）
function generateDerivedWords(word: string) {
  const lowerWord = word.toLowerCase();
  const derived: Array<{ word: string; partOfSpeech: string; definition: string }> = [];

  // 常见后缀规则
  const suffixRules: Record<string, { pos: string; suffix: string }> = {
    'tion': { pos: 'n.', suffix: 'ation' },
    'sion': { pos: 'n.', suffix: 'sion' },
    'ment': { pos: 'n.', suffix: 'ment' },
    'ness': { pos: 'n.', suffix: 'ness' },
    'ity': { pos: 'n.', suffix: 'ity' },
    'er': { pos: 'n.', suffix: 'er' },
    'or': { pos: 'n.', suffix: 'or' },
    'able': { pos: 'adj.', suffix: 'able' },
    'ible': { pos: 'adj.', suffix: 'ible' },
    'ful': { pos: 'adj.', suffix: 'ful' },
    'less': { pos: 'adj.', suffix: 'less' },
    'ous': { pos: 'adj.', suffix: 'ous' },
    'ive': { pos: 'adj./v.', suffix: 'ive' },
    'ing': { pos: 'v./adj.', suffix: 'ing' },
    'ed': { pos: 'v./adj.', suffix: 'ed' },
    'ly': { pos: 'adv.', suffix: 'ly' },
    'al': { pos: 'adj.', suffix: 'al' },
    'y': { pos: 'adj./n.', suffix: 'y' },
    'ize': { pos: 'v.', suffix: 'ize' },
    'ise': { pos: 'v.', suffix: 'ise' },
    'en': { pos: 'v.', suffix: 'en' },
  };

  // 检查常见后缀并生成派生词
  for (const [suffix, rule] of Object.entries(suffixRules)) {
    if (lowerWord.endsWith(suffix)) {
      const baseWord = lowerWord.slice(0, -suffix.length);
      if (baseWord.length >= 2) {
        const derivedWord = baseWord + rule.suffix;
        derived.push({
          word: derivedWord,
          partOfSpeech: rule.pos,
          definition: '',
        });
      }
    }
  }

  // 反向派生（从原词派生更短的形式）
  if (lowerWord.length > 4) {
    // -ly -> adj.
    if (lowerWord.endsWith('ly')) {
      derived.push({
        word: lowerWord.slice(0, -3),
        partOfSpeech: 'adj.',
        definition: '',
      });
    }
    // -ness -> adj.
    if (lowerWord.endsWith('ness')) {
      derived.push({
        word: lowerWord.slice(0, -4),
        partOfSpeech: 'adj.',
        definition: '',
      });
    }
    // -tion -> v.
    if (lowerWord.endsWith('tion')) {
      derived.push({
        word: lowerWord.slice(0, -4) + 'e',
        partOfSpeech: 'v.',
        definition: '',
      });
    }
    // -ment -> v.
    if (lowerWord.endsWith('ment')) {
      derived.push({
        word: lowerWord.slice(0, -4),
        partOfSpeech: 'v.',
        definition: '',
      });
    }
  }

  return derived.slice(0, 4);
}

// POST /api/translate
export async function POST(request: NextRequest) {
  try {
    const { word, skipTranslation } = await request.json();

    if (!word || typeof word !== 'string') {
      return NextResponse.json({ error: 'Invalid word' }, { status: 400 });
    }

    const cleanWord = word.trim().split(/\s+/)[0];

    // 获取字典数据 - 优先使用有道（中文释义）
    let dictionaryData = null;
    if (!skipTranslation) {
      // 先尝试有道API（中文释义）
      dictionaryData = await getYoudaoData(cleanWord);

      // 如果有道没有数据，尝试Free Dictionary API
      if (!dictionaryData) {
        dictionaryData = await getFreeDictionaryData(cleanWord);
      }
    }

    // 如果找到字典数据，补充其他信息
    if (dictionaryData) {
      // 获取短语搭配
      const phrases = await getPhrases(cleanWord);

      // 生成派生词
      const derivedWords = generateDerivedWords(cleanWord);

      return NextResponse.json({
        ...dictionaryData,
        phrases,
        derivedWords,
      });
    }

    // 如果没有找到数据，返回基本信息
    return NextResponse.json({
      word: cleanWord,
      phonetic: '',
      translations: [{ partOfSpeech: '', chineseDefinition: '未找到释义', englishDefinition: '' }],
      phrases: [],
      examples: [],
      synonyms: [],
      derivedWords: generateDerivedWords(cleanWord),
    });

  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}
