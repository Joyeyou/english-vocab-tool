'use client';

import { WordData } from '@/types/word';
import { Star, Volume2 } from 'lucide-react';
import { storageUtils } from '@/lib/utils';
import { getWordLevels } from '@/lib/wordLevels';
import { useState, useEffect } from 'react';

interface WordCardProps {
  wordData: WordData;
  onFavoriteChange?: () => void;
}

export default function WordCard({ wordData, onFavoriteChange }: WordCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const wordLevels = getWordLevels(wordData.word);

  useEffect(() => {
    setIsFavorite(storageUtils.isFavorite(wordData.word));
  }, [wordData.word]);

  const handleToggleFavorite = () => {
    const newState = storageUtils.toggleFavorite(wordData);
    setIsFavorite(newState);
    onFavoriteChange?.();
  };

  // 发音功能
  const handlePronounce = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(wordData.word);
      utterance.lang = 'en-US';
      utterance.rate = 0.8; // 语速稍慢一点
      window.speechSynthesis.cancel(); // 取消之前的发音
      window.speechSynthesis.speak(utterance);
    } else {
      alert('您的浏览器不支持语音功能');
    }
  };

  return (
    <div className="word-card bg-white rounded-xl shadow-lg mb-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <div className="word-card-inner flex flex-col md:flex-row">
        {/* 左侧：单词和音标 */}
        <div className="word-card-left md:w-1/3 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex flex-col justify-center items-center border-r border-gray-100">
          <div className="text-center w-full">
            {/* 词汇等级标签 */}
            {wordLevels.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {wordLevels.map((level, index) => (
                  <span
                    key={index}
                    className={`px-2 py-1 rounded-md text-xs font-bold ${level.bgColor} ${level.color}`}
                  >
                    {level.level}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 mb-3">
              <h2 className="text-4xl font-bold text-gray-900">{wordData.word}</h2>
              <button
                onClick={handleToggleFavorite}
                className="p-2 hover:bg-white/50 rounded-full transition-colors"
                title={isFavorite ? '取消收藏' : '添加到生词本'}
              >
                <Star
                  className={`w-6 h-6 ${
                    isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
                  }`}
                />
              </button>
            </div>

            {wordData.phonetic && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <p className="text-gray-600 text-lg">/ {wordData.phonetic} /</p>
                <button
                  onClick={handlePronounce}
                  className="p-2 hover:bg-blue-100 rounded-full transition-colors group"
                  title="点击发音"
                >
                  <Volume2 className="w-5 h-5 text-blue-600 group-hover:text-blue-700" />
                </button>
              </div>
            )}

            <button
              onClick={handlePronounce}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              🔊 听发音
            </button>
          </div>
        </div>

        {/* 右侧：释义、短语、例句 */}
        <div className="word-card-right md:w-2/3 p-6">
          {/* 词性和释义 */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center">
              <span className="w-1 h-4 bg-blue-600 mr-2"></span>
              释义
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              {wordData.translations?.map((trans, index) => (
                <div key={index} className="flex gap-3">
                  {trans.partOfSpeech && (
                    <span className="text-blue-600 font-semibold min-w-[3rem] text-base">
                      {trans.partOfSpeech}
                    </span>
                  )}
                  <p className="text-gray-800 text-base leading-relaxed flex-1">
                    {trans.chineseDefinition}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 常用搭配 */}
          {wordData.phrases && wordData.phrases.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center">
                <span className="w-1 h-4 bg-green-600 mr-2"></span>
                常用搭配
              </h3>
              <div className="bg-green-50 rounded-lg p-3 border-l-4 border-green-500">
                <p className="text-green-900 text-base leading-relaxed">
                  {wordData.phrases?.map((phrase, index) => (
                    <span key={index}>
                      {index > 0 && '; '}
                      <span className="font-medium">{phrase.phrase}</span>
                      {' '}
                      {phrase.translation ? (
                        <span className="text-green-700">({phrase.translation})</span>
                      ) : (
                        <span className="text-gray-400 text-xs">(翻译中...)</span>
                      )}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          )}

          {/* 同义词 */}
          {wordData.synonyms && wordData.synonyms.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center">
                <span className="w-1 h-4 bg-orange-600 mr-2"></span>
                同义词
              </h3>
              <div className="bg-orange-50 rounded-lg p-3 border-l-4 border-orange-500">
                <p className="text-orange-900 text-base">
                  {wordData.synonyms?.map((syn, index) => (
                    <span key={index}>
                      {index > 0 && ', '}
                      <span className="font-medium">{syn}</span>
                    </span>
                  ))}
                </p>
              </div>
            </div>
          )}

          {/* 例句 */}
          {wordData.examples && wordData.examples.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center">
                <span className="w-1 h-4 bg-purple-600 mr-2"></span>
                例句
              </h3>
              <div className="space-y-3">
                {wordData.examples?.map((example, index) => (
                  <div key={index} className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                    <p className="text-gray-800 text-base mb-2">{example.sentence}</p>
                    {example.translation ? (
                      <p className="text-gray-600 text-sm">{example.translation}</p>
                    ) : (
                      <p className="text-gray-400 text-xs italic">翻译加载中...</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 派生词 */}
          {wordData.derivedWords && wordData.derivedWords.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center">
                <span className="w-1 h-4 bg-cyan-600 mr-2"></span>
                派生词
              </h3>
              <div className="flex flex-wrap gap-2">
                {wordData.derivedWords?.map((derived, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 text-cyan-800 rounded-full text-sm border border-cyan-200"
                  >
                    <span className="font-medium">{derived.word}</span>
                    {derived.partOfSpeech && (
                      <span className="text-xs text-cyan-600">({derived.partOfSpeech})</span>
                    )}
                    {derived.definition && (
                      <span className="text-xs text-cyan-500">·{derived.definition}</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
