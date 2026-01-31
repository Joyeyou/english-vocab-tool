import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import initSqlJs from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';

// SQLite数据库路径
const DB_PATH = path.join(process.cwd(), 'data', 'stardict.db');

// Merriam-Webster API Key
const MW_API_KEY = process.env.MW_API_KEY || '404c1f4b-1979-450a-be12-d570204f1862';

// 百度翻译API配置
const BAIDU_APPID = process.env.BAIDU_APPID || '';
const BAIDU_SECRET = process.env.BAIDU_SECRET || '';

// 有道翻译API配置
const YOUDAO_APPKEY = process.env.YOUDAO_APPKEY || '';
const YOUDAO_SECRET = process.env.YOUDAO_SECRET || '';

// 缓存数据库实例
let db: any = null;

// 初始化数据库
async function initDatabase() {
  if (db) return db;

  const SQL = await initSqlJs({
    locateFile: (file: string) => {
      return path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file);
    },
  });
  const buffer = fs.readFileSync(DB_PATH);
  db = new SQL.Database(buffer);
  return db;
}

// 解析词性和翻译
function parseTranslation(translation: string) {
  if (!translation) return [];

  // 按行分割，每行格式：n. 翻译1, 翻译2
  const lines = translation.split('\n').filter(line => line.trim());
  const results = [];

  for (const line of lines) {
    // 匹配词性（如 n. v. adj. 等）
    const match = line.match(/^([a-z]+\.)\s+(.+)$/);
    if (match) {
      const [, pos, definitions] = match;
      results.push({
        partOfSpeech: pos,
        chineseDefinition: definitions.trim(),
        englishDefinition: '',
      });
    } else if (line.trim()) {
      // 如果没有词性标记，作为通用翻译
      results.push({
        partOfSpeech: '',
        chineseDefinition: line.trim(),
        englishDefinition: '',
      });
    }
  }

  return results;
}

// 解析词形变化
function parseExchange(exchange: string) {
  if (!exchange) return {};

  const result: any = {};
  const pairs = exchange.split('/').filter(p => p.trim());

  for (const pair of pairs) {
    const [key, value] = pair.split(':');
    if (key && value) {
      result[key.trim()] = value.trim();
    }
  }

  return result;
}

// 从ECDICT查询单词的中文释义（用于同义词翻译）
async function getChineseDefinition(word: string, database: any): Promise<string> {
  try {
    const stmt = database.prepare(
      'SELECT translation FROM stardict WHERE word = ? COLLATE NOCASE LIMIT 1'
    );
    stmt.bind([word.toLowerCase()]);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();

      const translation = row.translation as string;
      if (!translation) return '';

      // 提取第一个释义（去除词性标记）
      const lines = translation.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        const firstLine = lines[0];
        // 去除词性标记，只保留中文释义
        const match = firstLine.match(/^[a-z]+\.\s+(.+)$/);
        if (match) {
          // 只取第一个释义（用逗号分隔）
          const definitions = match[1].split(',');
          return definitions[0].trim();
        }
        return firstLine.trim();
      }
    } else {
      stmt.free();
    }
    return '';
  } catch (error) {
    return '';
  }
}

// 获取同义词及其中文释义（Datamuse API + ECDICT）
async function getSynonymsWithTranslation(
  word: string,
  database: any
): Promise<Array<{ word: string; translation: string }>> {
  try {
    const response = await fetch(
      `https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}&max=8`
    );
    if (!response.ok) return [];

    const data = await response.json();
    const synonymWords = data.slice(0, 8).map((item: any) => item.word);

    // 并行查询每个同义词的中文释义
    const synonymsWithTranslation = await Promise.all(
      synonymWords.map(async (synWord: string) => {
        const translation = await getChineseDefinition(synWord, database);
        return {
          word: synWord,
          translation: translation || '',
        };
      })
    );

    return synonymsWithTranslation;
  } catch (error) {
    console.error('Datamuse同义词API错误:', error);
    return [];
  }
}

// 翻译文本（使用百度翻译API，带重试）
async function translateText(text: string, retries = 2): Promise<string> {
  if (!text || !BAIDU_APPID || !BAIDU_SECRET) return '';

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const salt = Date.now().toString() + Math.random().toString().substring(2, 8);
      const sign = crypto
        .createHash('md5')
        .update(BAIDU_APPID + text + salt + BAIDU_SECRET)
        .digest('hex');

      const params = new URLSearchParams({
        q: text,
        from: 'en',
        to: 'zh',
        appid: BAIDU_APPID,
        salt: salt,
        sign: sign,
      });

      const response = await fetch(
        `https://fanyi-api.baidu.com/api/trans/vip/translate?${params.toString()}`,
        { signal: AbortSignal.timeout(8000) } // 8秒超时（增加容错）
      );

      if (!response.ok) {
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 增加到1秒
          continue;
        }
        return '';
      }

      const data = await response.json();

      // 检查错误码
      if (data.error_code) {
        console.error(`百度翻译错误码 ${data.error_code}:`, data.error_msg);
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 增加到1秒
          continue;
        }
        return '';
      }

      if (data.trans_result && data.trans_result.length > 0) {
        return data.trans_result[0].dst;
      }

      return '';
    } catch (error) {
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 增加到1秒
        continue;
      }
      console.error('百度翻译错误:', error);
      return '';
    }
  }

  return '';
}

// 翻译文本（使用有道翻译API，带重试）
async function translateTextYoudao(text: string, retries = 2): Promise<string> {
  if (!text || !YOUDAO_APPKEY || !YOUDAO_SECRET) return '';

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const salt = Date.now().toString();
      const curtime = Math.floor(Date.now() / 1000).toString();

      // 有道API的input算法：如果q长度<=20则input=q，否则input=q前10个字符+q长度+q后10个字符
      let input = text;
      if (text.length > 20) {
        input = text.substring(0, 10) + text.length + text.substring(text.length - 10);
      }

      // 有道签名算法：SHA256(appKey + input + salt + curtime + appSecret)
      const sign = crypto
        .createHash('sha256')
        .update(YOUDAO_APPKEY + input + salt + curtime + YOUDAO_SECRET)
        .digest('hex');

      const params = new URLSearchParams({
        q: text,
        from: 'en',
        to: 'zh-CHS',
        appKey: YOUDAO_APPKEY,
        salt: salt,
        sign: sign,
        signType: 'v3',
        curtime: curtime,
      });

      const response = await fetch(
        `https://openapi.youdao.com/api?${params.toString()}`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(8000),
        }
      );

      if (!response.ok) {
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        return '';
      }

      const data = await response.json();

      // 检查错误码
      if (data.errorCode && data.errorCode !== '0') {
        console.error(`有道翻译错误码 ${data.errorCode}`);
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        return '';
      }

      if (data.translation && data.translation.length > 0) {
        return data.translation[0];
      }

      return '';
    } catch (error) {
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      console.error('有道翻译错误:', error);
      return '';
    }
  }

  return '';
}

// 批量翻译文本 - 百度API（带延迟避免频率限制）
async function translateBatchBaidu(texts: string[]): Promise<string[]> {
  const results: string[] = [];

  for (let i = 0; i < texts.length; i++) {
    const translation = await translateText(texts[i]);
    results.push(translation);

    // 添加延迟避免频率限制（百度API标准版: 10次/秒）
    // 使用1秒延迟确保每秒不超过1次，最安全（考虑并发请求）
    if (i < texts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

// 批量翻译文本 - 有道API（带延迟避免频率限制）
async function translateBatchYoudao(texts: string[]): Promise<string[]> {
  const results: string[] = [];

  for (let i = 0; i < texts.length; i++) {
    const translation = await translateTextYoudao(texts[i]);
    results.push(translation);

    // 添加延迟避免频率限制
    // 有道API免费版：1000次/小时，所以可以稍快一些
    if (i < texts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}

// 使用 Datamuse API 获取真正的常见搭配
async function getCommonCollocations(word: string, pos: string): Promise<Array<{ phrase: string; translation: string }>> {
  try {
    const phrases: Array<{ phrase: string; translation: string; score?: number }> = [];

    // 检查词性，决定返回哪种搭配
    const isNoun = pos.includes('n.');
    const isTransitiveVerb = pos.includes('vt.');
    const isIntransitiveVerb = pos.includes('vi.');
    const isAdjective = pos.includes('adj.');

    // 及物动词：不返回短语
    if (isTransitiveVerb && !isIntransitiveVerb && !isNoun) {
      console.log(`${word} 是及物动词，跳过短语获取`);
      return [];
    }

    // 名词：获取形容词+名词短语
    if (isNoun) {
      console.log(`${word} 是名词，获取形容词+名词短语`);
      const adjectivesRes = await fetch(
        `https://api.datamuse.com/words?rel_jjb=${encodeURIComponent(word)}&max=8`
      );

      if (adjectivesRes.ok) {
        const adjData = await adjectivesRes.json();
        for (const item of adjData) {
          if (item.score && item.score > 100) {
            phrases.push({
              phrase: `${item.word} ${word}`,
              translation: '',
              score: item.score,
            });
          }
        }
      }

      // 名词短语：名词+名词（如：project manager）
      const followersRes = await fetch(
        `https://api.datamuse.com/words?rc=${encodeURIComponent(word)}&max=10`
      );

      if (followersRes.ok) {
        const follData = await followersRes.json();
        for (const item of follData) {
          const phrase = `${word} ${item.word}`;
          const badWords = ['a', 'an', 'the', 'is', 'are', 'was', 'were', 'be'];
          if (!badWords.includes(item.word.toLowerCase()) && item.score && item.score > 80) {
            phrases.push({
              phrase,
              translation: '',
              score: item.score * 0.9,
            });
          }
        }
      }
    }

    // 非及物动词或形容词：获取常用介词搭配
    if (isIntransitiveVerb || isAdjective) {
      console.log(`${word} 是非及物动词/形容词，获取介词搭配`);

      // 获取经常跟在该词后面的介词
      const followersRes = await fetch(
        `https://api.datamuse.com/words?rc=${encodeURIComponent(word)}&max=15`
      );

      if (followersRes.ok) {
        const follData = await followersRes.json();
        // 常见介词列表
        const prepositions = ['to', 'of', 'in', 'on', 'at', 'for', 'with', 'from', 'by', 'about', 'into', 'through', 'over', 'after', 'before', 'under', 'between', 'among', 'around', 'without'];

        for (const item of follData) {
          if (prepositions.includes(item.word.toLowerCase()) && item.score && item.score > 30) {
            phrases.push({
              phrase: `${word} ${item.word}`,
              translation: '',
              score: item.score,
            });
          }
        }
      }
    }

    // 按score排序，去重，取前3个最常见的搭配
    const uniquePhrases = Array.from(
      new Map(phrases.map(p => [p.phrase, p])).values()
    )
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 3)
      .map(p => ({ phrase: p.phrase, translation: p.translation }));

    console.log(`${word} 返回 ${uniquePhrases.length} 个搭配`);
    return uniquePhrases;
  } catch (error) {
    console.error('Datamuse搭配API错误:', error);
    return [];
  }
}

// 获取例句（Merriam-Webster API）
async function getExamples(word: string): Promise<Array<{ sentence: string; translation: string }>> {
  try {
    const response = await fetch(
      `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${encodeURIComponent(word)}?key=${MW_API_KEY}`
    );

    if (!response.ok) return [];

    const data = await response.json();
    const examples: Array<{ sentence: string; translation: string }> = [];

    // 遍历所有词条
    for (const entry of data) {
      if (!entry.def) continue;

      // 遍历所有定义
      for (const def of entry.def) {
        if (!def.sseq) continue;

        // 遍历所有义项
        for (const senseSeq of def.sseq) {
          for (const sense of senseSeq) {
            if (!sense[1] || !sense[1].dt) continue;

            // 查找例句
            for (const dt of sense[1].dt) {
              if (dt[0] === 'vis' && Array.isArray(dt[1])) {
                for (const vis of dt[1]) {
                  if (vis.t) {
                    // 清理例句中的标记，保留内容
                    let sentence = vis.t
                      .replace(/\{wi\}([^}]+)\{\/wi\}/g, '$1') // 保留加粗词
                      .replace(/\{bc\}/g, '') // 删除分隔符
                      .replace(/\{it\}([^}]+)\{\/it\}/g, '$1') // 保留斜体词（重要！）
                      .replace(/\{phrase\}([^}]+)\{\/phrase\}/g, '$1') // 保留短语
                      .replace(/\{ldquo\}/g, '"').replace(/\{rdquo\}/g, '"') // 引号
                      .replace(/\{inf\}([^}]+)\{\/inf\}/g, '$1') // 保留下标内容
                      .replace(/\{[^}]+\}/g, '') // 删除其他未知标记
                      .trim();

                    // 句子完整性检查
                    const isValidSentence = (s: string): boolean => {
                      // 必须以大写字母开头
                      if (!/^[A-Z]/.test(s)) return false;

                      // 必须以句号、问号或感叹号结尾
                      if (!/[.!?]$/.test(s)) return false;

                      // 长度限制：不超过150个字符（避免过长例句）
                      if (s.length > 150) return false;

                      // 必须至少有3个单词，但不超过25个单词
                      const words = s.split(/\s+/);
                      if (words.length < 3 || words.length > 25) return false;

                      // 必须包含动词（简单检查：查找常见动词模式）
                      const hasVerb = /\b(is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|could|should|can|may|might|must|shall)\b/i.test(s) ||
                                     /\b\w+(s|ed|ing)\b/.test(s);
                      if (!hasVerb) return false;

                      // 不能以介词、连词开头的不完整句子
                      if (/^(and|or|but|so|because|if|when|while|although|though|since|unless|until|hopes|wants|needs|says|thinks)\b/i.test(s)) {
                        return false;
                      }

                      return true;
                    };

                    if (sentence && isValidSentence(sentence)) {
                      examples.push({
                        sentence,
                        translation: '', // MW不提供中文翻译
                      });

                      // 限制例句数量（减少到2个，降低翻译API调用频率）
                      if (examples.length >= 2) {
                        return examples;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return examples;
  } catch (error) {
    console.error('Merriam-Webster例句API错误:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const { word, skipTranslation } = await request.json();

    if (!word) {
      return NextResponse.json({ error: '请输入单词' }, { status: 400 });
    }

    console.log(`查询单词: ${word}${skipTranslation ? ' (跳过翻译)' : ''}`);

    // 初始化数据库
    const database = await initDatabase();

    // 查询单词
    const stmt = database.prepare(
      'SELECT word, phonetic, translation, pos, collins, oxford, tag, exchange, detail FROM stardict WHERE word = ? COLLATE NOCASE'
    );
    stmt.bind([word.toLowerCase()]);

    if (!stmt.step()) {
      // 单词未找到
      return NextResponse.json(
        { error: '未找到该单词', word },
        { status: 404 }
      );
    }

    const row = stmt.getAsObject();
    stmt.free();

    console.log('找到单词:', row.word);

    // 解析翻译
    const translations = parseTranslation(row.translation as string);

    // 解析词形变化
    const exchange = parseExchange(row.exchange as string);

    let synonyms: string[] = [];
    let translatedExamples: Array<{ sentence: string; translation: string }> = [];
    let phrases: Array<{ phrase: string; translation: string }> = [];

    // 如果跳过翻译，只返回本地数据库数据，不调用外部API
    if (skipTranslation) {
      console.log('快速返回：仅本地数据库数据');

      // 从本地数据库获取例句（可能有）
      const examples = await getExamples(word.toLowerCase());
      translatedExamples = examples;

      // 尝试从本地获取常用搭配（简化版）
      const translationText = (row.translation as string) || '';
      const simplePhrases = await getCommonCollocations(word.toLowerCase(), translationText);
      phrases = simplePhrases.map(p => ({ phrase: p.phrase, translation: '' }));

      // 不调用外部API获取同义词，直接使用空数组
      synonyms = [];
    } else {
      // 完整翻译流程
      // 获取例句
      const examples = await getExamples(word.toLowerCase());

      // 使用 Datamuse API 获取真正的常见搭配
      const translationText = (row.translation as string) || '';
      const rawPhrases = await getCommonCollocations(word.toLowerCase(), translationText);

      // 同义词不需要翻译，直接获取英文同义词
      const synResponse = await fetch(
        `https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word.toLowerCase())}&max=8`
      );
      const synData = await synResponse.json();
      synonyms = synData.slice(0, 8).map((item: any) => item.word);

      // 翻译短语和例句（并行处理）
      console.log('开始翻译短语和例句...');

      const [phraseTexts, exampleTexts] = await Promise.all([
        translateBatchBaidu(rawPhrases.map(p => p.phrase)),
        translateBatchYoudao(examples.map(e => e.sentence)),
      ]);

      phrases = rawPhrases.map((phrase, index) => ({
        phrase: phrase.phrase,
        translation: phraseTexts[index] || '',
      }));

      translatedExamples = examples.map((example, index) => ({
        sentence: example.sentence,
        translation: exampleTexts[index] || '',
      }));

      console.log(`获取到: ${synonyms.length}个同义词, ${phrases.length}个短语, ${translatedExamples.length}个例句`);
    }

    // 获取派生词（通过词根词缀分析生成可能的派生词，然后验证）
    let derivedWords: Array<{ word: string; partOfSpeech: string; definition: string }> = [];

    try {
      const wordLower = word.toLowerCase();

      // 定义派生词后缀及其对应的词性
      const suffixRules: Record<string, string> = {
        'al': 'adj.',
        'ally': 'adv.',
        'ist': 'n.',
        'ness': 'n.',
        'tion': 'n.',
        'sion': 'n.',
        'able': 'adj.',
        'ible': 'adj.',
        'ful': 'adj.',
        'less': 'adj.',
        'ity': 'n.',
        'ive': 'adj./n.',
        'ous': 'adj.',
        'ian': 'n./adj.',
        'ize': 'v.',
        'ise': 'v.',
        'age': 'n.',
        'ure': 'n.',
        'ery': 'n.',
        'ry': 'n.',
        'ant': 'n./adj.',
        'ent': 'n./adj.',
        'dom': 'n.',
        'ship': 'n.',
        'ment': 'n.',
        'ing': 'n./v.',
        'ed': 'adj./v.',
      };

      // 生成可能的派生词
      const candidateWords: string[] = [];

      for (const [suffix, pos] of Object.entries(suffixRules)) {
        if (wordLower.endsWith('e')) {
          // 以 e 结尾的词：去掉 e 加后缀
          const stem = wordLower.slice(0, -1);
          candidateWords.push(stem + suffix);
        } else if (wordLower.endsWith('y')) {
          // 以 y 结尾的词：变 y 为 i 加后缀
          const stem = wordLower.slice(0, -1) + 'i';
          candidateWords.push(stem + suffix);
        } else if (wordLower.length > 4) {
          // 其他情况：直接加后缀
          candidateWords.push(wordLower + suffix);
        }
      }

      // 限制候选词数量
      const limitedCandidates = candidateWords.slice(0, 8);

      // 验证候选词是否真的存在（查询 Datamuse）
      const validDerivedWords: Array<{ word: string; partOfSpeech: string; definition: string }> = [];

      for (const candidate of limitedCandidates) {
        try {
          const checkResponse = await fetch(
            `https://api.datamuse.com/words?sp=${encodeURIComponent(candidate)}&max=1`
          );
          const checkData = await checkResponse.json();

          if (checkData.length > 0 && checkData[0].word === candidate) {
            // 确定后缀和词性
            for (const [suffix, pos] of Object.entries(suffixRules)) {
              if (candidate.endsWith(suffix)) {
                validDerivedWords.push({ word: candidate, partOfSpeech: pos, definition: '' });
                break;
              }
            }
          }
        } catch (e) {
          // 忽略单个词的查询错误
        }

        // 限制最多4个派生词
        if (validDerivedWords.length >= 4) break;
      }

      derivedWords = validDerivedWords;

      // 如果获取到派生词，翻译它们
      if (derivedWords.length > 0 && !skipTranslation) {
        const derivedEnglish = derivedWords.map(d => d.word);
        const translated = await translateBatchBaidu(derivedEnglish);

        derivedWords = derivedWords.map((d, index) => ({
          ...d,
          definition: translated[index] || ''
        }));
      }
    } catch (error) {
      console.error('获取派生词失败:', error);
    }

    // 构建返回数据
    const wordData = {
      word: row.word as string,
      phonetic: row.phonetic as string || '',
      translations,
      phrases,
      examples: translatedExamples,
      synonyms,
      derivedWords,
      exchange,
      collins: row.collins as number || 0,
      oxford: row.oxford as number || 0,
      tag: row.tag as string || '',
      source: 'ecdict+datamuse+mw+baidu',
    };

    return NextResponse.json(wordData);
  } catch (error) {
    console.error('API错误:', error);
    return NextResponse.json(
      { error: '服务器错误', details: String(error) },
      { status: 500 }
    );
  }
}
