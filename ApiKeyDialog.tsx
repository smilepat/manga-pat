
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface ApiKeyDialogProps {
  onContinue: (key?: string) => void;
}

const TUTORIAL_STEPS = [
  {
    emoji: "🌐",
    title: "1. Google AI Studio 접속",
    desc: "아래 링크를 클릭하여 Google AI Studio에 접속하세요.",
    detail: "Google 계정으로 로그인이 필요합니다.",
    link: "https://aistudio.google.com/apikey",
    linkText: "AI Studio 열기 →",
  },
  {
    emoji: "🔑",
    title: "2. API 키 생성",
    desc: "\"Create API Key\" 버튼을 클릭합니다.",
    detail: "새 프로젝트를 만들거나 기존 프로젝트를 선택할 수 있습니다. 무료 사용량만으로도 만화 여러 편을 만들 수 있어요!",
    link: null,
    linkText: null,
  },
  {
    emoji: "📋",
    title: "3. 키 복사 & 붙여넣기",
    desc: "생성된 API 키를 복사하여 아래에 붙여넣으세요.",
    detail: "API 키는 \"AIzaSy...\" 형태입니다. 키는 브라우저에만 저장되며 외부로 전송되지 않습니다.",
    link: null,
    linkText: null,
  },
];

export const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({ onContinue }) => {
  const [step, setStep] = useState(0);
  const [inputKey, setInputKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!inputKey.trim()) {
      setError('API 키를 입력해주세요.');
      return;
    }
    if (inputKey.trim().length < 10) {
      setError('유효한 API 키를 입력해주세요.');
      return;
    }
    setIsValidating(true);
    setError('');
    
    // Quick validation — try a simple API call
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: inputKey.trim() });
      await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Say "OK" in one word.',
      });
      onContinue(inputKey.trim());
    } catch (e: any) {
      const msg = String(e);
      if (msg.includes('API_KEY_INVALID') || msg.includes('not found')) {
        setError('❌ 유효하지 않은 API 키입니다. 다시 확인해주세요.');
      } else if (msg.includes('permission') || msg.includes('denied')) {
        setError('❌ API 키에 권한이 없습니다. Gemini API가 활성화된 프로젝트의 키를 사용해주세요.');
      } else {
        // Might be a network issue or rate limit — accept the key anyway
        onContinue(inputKey.trim());
      }
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="relative max-w-lg w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Top Gradient Bar */}
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-3xl shadow-inner animate-bounce">
              🔑
            </div>
            <h2 className="font-title text-3xl text-gray-900 mb-2">
              API 키 설정
            </h2>
            <p className="text-gray-500 text-sm">
              Gemini API로 만화를 생성하려면 API 키가 필요합니다
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {TUTORIAL_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === step 
                    ? 'w-8 h-2 bg-blue-600' 
                    : i < step 
                      ? 'w-2 h-2 bg-blue-300' 
                      : 'w-2 h-2 bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Tutorial Step Content */}
          <div key={step} className="tutorial-step-content mb-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center text-2xl border border-blue-100 shadow-sm animate-pulse">
                {TUTORIAL_STEPS[step].emoji}
              </div>
              <div>
                <h3 className="font-title text-lg text-gray-900 mb-1">
                  {TUTORIAL_STEPS[step].title}
                </h3>
                <p className="text-gray-700 text-sm font-bold">
                  {TUTORIAL_STEPS[step].desc}
                </p>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                  {TUTORIAL_STEPS[step].detail}
                </p>
              </div>
            </div>

            {TUTORIAL_STEPS[step].link && (
              <a
                href={TUTORIAL_STEPS[step].link!}
                target="_blank"
                rel="noreferrer"
                className="studio-btn w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 text-sm hover:from-blue-700 hover:to-blue-800 shadow-lg mb-2 transition-transform hover:scale-105 active:scale-95"
              >
                <span className="animate-spin-slow">🔗</span>
                <span>{TUTORIAL_STEPS[step].linkText}</span>
              </a>
            )}
          </div>

          {/* API Key Input (always visible) */}
          <div className="space-y-3">
            <div className="relative">
              <input
                type="password"
                value={inputKey}
                onChange={(e) => { setInputKey(e.target.value); setError(''); }}
                placeholder="AIzaSy... (API 키를 붙여넣으세요)"
                className="studio-input text-base py-4 pr-12 font-mono tracking-wider"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
              {inputKey && (
                <button
                  onClick={() => setInputKey('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-sm"
                >
                  ✕
                </button>
              )}
            </div>

            {error && (
              <p className="text-red-500 text-xs font-bold px-1">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!inputKey.trim() || isValidating}
              className="studio-btn w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg py-4 hover:from-blue-700 hover:to-purple-700 shadow-lg disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none transition-transform hover:scale-[1.02] active:scale-95"
            >
              {isValidating ? (
                <>
                  <span className="inline-block animate-spin">⚙️</span>
                  <span>키 확인 중...</span>
                </>
              ) : (
                <>
                  <span>✅</span>
                  <span>API 키 저장하고 시작하기</span>
                </>
              )}
            </button>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="text-sm text-gray-400 hover:text-gray-600 font-bold disabled:opacity-30"
            >
              ← 이전
            </button>
            <button
              onClick={() => setStep(Math.min(TUTORIAL_STEPS.length - 1, step + 1))}
              disabled={step === TUTORIAL_STEPS.length - 1}
              className="text-sm text-blue-500 hover:text-blue-700 font-bold disabled:opacity-30"
            >
              다음 →
            </button>
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-green-700 leading-relaxed">
              🔒 <strong>보안 안내:</strong> API 키는 브라우저의 localStorage에만 저장되며, 
              서버로 전송되지 않습니다. 언제든 브라우저 데이터를 삭제하면 키가 제거됩니다.
            </p>
          </div>

          {/* Supported Models Info */}
          <div className="mt-4 text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
              ✨ Powered by Multi-Model AI Engine (Gemini 2.5 ~ 3.1) ✨
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
