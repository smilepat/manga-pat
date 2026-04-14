
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import toast from 'react-hot-toast';
import { GENRES, GENRE_GROUPS, TONES, TONE_GROUPS, LANGUAGES, STYLE_PRESETS, HISTORICAL_FIGURE_PRESETS, TEXT_MODELS, IMAGE_MODELS, Persona, PremiseAnalysis } from './types';
import { applyFigurePreset } from './aiEngine';

interface SetupProps {
    show: boolean;
    isTransitioning: boolean;
    hero: Persona | null;
    friend: Persona | null;
    friend2: Persona | null;

    onHeroEditPrompt: (val: string) => void;
    onFriendEditPrompt: (val: string) => void;
    onFriend2EditPrompt: (val: string) => void;

    onHeroOutfit: (val: string) => void;
    onFriendOutfit: (val: string) => void;
    onFriend2Outfit: (val: string) => void;

    onHeroProps: (val: string) => void;
    onFriendProps: (val: string) => void;
    onFriend2Props: (val: string) => void;

    selectedGenre: string;
    selectedLanguage: string;
    storyTone: string;
    customPremise: string;
    richMode: boolean;

    onHeroInput: (base64: string) => void;
    onFriendInput: (base64: string) => void;
    onFriend2Input: (base64: string) => void;

    onHeroRemove: () => void;
    onFriendRemove: () => void;
    onFriend2Remove: () => void;

    onGenreChange: (val: string) => void;
    onLanguageChange: (val: string) => void;
    onToneChange: (val: string) => void;
    onPremiseChange: (val: string) => void;
    onRichModeChange: (val: boolean) => void;

    coverTitle: string;
    coverStyle: string;
    onCoverTitleChange: (val: string) => void;
    onCoverStyleChange: (val: string) => void;

    // --- AI Models ---
    selectedTextModel: string;
    selectedImageModel: string;
    onTextModelChange: (val: string) => void;
    onImageModelChange: (val: string) => void;

    onLaunch: () => void;

    // --- Hybrid One-Touch Props ---
    premiseAnalysis: PremiseAnalysis | null;
    isAnalyzingPremise: boolean;
    onAnalyzePremise: () => void;
    onAcceptAnalysis: () => void;
    showManualSettings: boolean;
    onToggleManualSettings: () => void;
    selectedStylePreset: string;
    onStylePresetChange: (val: string) => void;

    onOpenApiKeyDialog: () => void;
    onResetProjectSettings: () => void;
}

// Loading Skeleton Component
const LoadingSkeleton: React.FC<{ width?: string; height?: string }> = ({ width = '100%', height = '1rem' }) => (
  <div
    className="animate-pulse bg-gray-200 rounded"
    style={{ width, height }}
  />
);

const CharacterSkeleton: React.FC = () => (
  <div className="p-4 flex flex-col gap-3 border rounded-lg bg-gray-50">
    <div className="flex justify-between items-start">
      <div className="flex flex-col gap-2">
        <LoadingSkeleton width="120px" height="24px" />
        <LoadingSkeleton width="80px" height="14px" />
      </div>
    </div>
    <div className="flex gap-4 mt-1">
      <div className="w-20 h-20 rounded-lg bg-gray-200 animate-pulse" />
      <div className="flex-1 flex flex-col gap-2">
        <LoadingSkeleton height="32px" />
        <div className="grid grid-cols-2 gap-2">
          <LoadingSkeleton height="32px" />
          <LoadingSkeleton height="32px" />
        </div>
      </div>
    </div>
  </div>
);

const CharacterCard = ({
    role,
    subtitle,
    persona,
    onInput,
    onRemove,
    onEditPrompt,
    onOutfit,
    onProps
}: {
    role: string,
    subtitle: string,
    persona: Persona | null,
    onInput: (b64: string) => void,
    onRemove?: () => void,
    onEditPrompt: (val: string) => void,
    onOutfit: (val: string) => void,
    onProps: (val: string) => void
}) => {
    
    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const reader = new FileReader();
            // Pass the full data URL so aiEngine can detect MIME type correctly
            reader.onload = () => onInput(reader.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    /** Safely convert stored base64 (data URL or raw bytes) to a displayable src */
    const toImgSrc = (b64: string): string => {
        if (b64.startsWith('data:')) return b64;
        return `data:image/jpeg;base64,${b64}`;
    };

    const isAnalyzing = persona?.desc === "분석 중...";

    return (
        <div className="studio-card p-4 flex flex-col gap-3 relative overflow-hidden group border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-title text-lg text-gray-800">{role}</h3>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">{subtitle}</p>
                </div>
                {persona && (
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${isAnalyzing ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                            {isAnalyzing ? '분석 중...' : '완료'}
                        </span>
                        {onRemove && !isAnalyzing && (
                            <button
                                onClick={onRemove}
                                className="text-xs font-bold px-2 py-1 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                                title="캐릭터 이미지 제거"
                            >
                                ✕ 해제
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="flex gap-4 mt-1">
                <label className={`relative w-24 h-24 shrink-0 rounded-lg overflow-hidden border-2 border-dashed cursor-pointer transition-all ${persona ? 'border-blue-300 bg-gray-100' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'}`}>
                    {persona ? (
                        <img src={toImgSrc(persona.base64)} alt={`${role} 캐릭터 이미지`} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-1">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                            <span className="text-[10px] font-bold">사진 추가</span>
                        </div>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
                    {persona && (
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/30 flex items-center justify-center transition-colors">
                            <span className="opacity-0 hover:opacity-100 text-white text-xs font-bold bg-black/60 px-2 py-1 rounded">변경</span>
                        </div>
                    )}
                </label>

                <div className="flex-1 flex flex-col gap-2">
                    {/* AI Analysis Result */}
                    {persona && !isAnalyzing && persona.desc && (
                        <p className="text-[10px] text-gray-500 bg-gray-50 rounded px-2 py-1 leading-relaxed line-clamp-2" title={persona.desc}>
                            🤖 {persona.desc}
                        </p>
                    )}
                    {!persona && (
                        <p className="text-[10px] text-gray-400 leading-relaxed">
                            역사 인물 사진이나 초상화를 올리면 AI가 분석하여 전기 만화에 반영합니다.
                        </p>
                    )}
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">상세 외형 (선택)</label>
                        <input
                            type="text"
                            className="studio-input text-xs py-1.5"
                            placeholder="예: 관복 착용, 턱수염"
                            value={persona?.editPrompt || ''}
                            onChange={(e) => onEditPrompt(e.target.value)}
                            disabled={!persona}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">고정 의상 (선택)</label>
                            <input
                                type="text"
                                className="studio-input text-xs py-1.5"
                                placeholder="예: 전통 갑옷, 도포"
                                value={persona?.outfit || ''}
                                onChange={(e) => onOutfit(e.target.value)}
                                disabled={!persona}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">핵심 소품 (선택)</label>
                            <input
                                type="text"
                                className="studio-input text-xs py-1.5"
                                placeholder="예: 거북선 모형, 붓과 벼루"
                                value={persona?.props || ''}
                                onChange={(e) => onProps(e.target.value)}
                                disabled={!persona}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Analysis Result Card ---
const AnalysisResultCard: React.FC<{
    analysis: PremiseAnalysis;
    onAccept: () => void;
    onToggleManual: () => void;
}> = ({ analysis, onAccept, onToggleManual }) => {
    return (
        <div className="analysis-result">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">✨</span>
                <h3 className="font-title text-lg text-gray-800">역사 분석 결과</h3>
            </div>
            
            {/* Title */}
            <div className="mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">추천 제목</span>
                <p className="font-title text-2xl text-gray-900 mt-1">{analysis.suggestedTitle}</p>
            </div>
            
            {/* Tags Row */}
            <div className="flex flex-wrap gap-2 mb-4">
                <span className="analysis-tag bg-blue-50 text-blue-700 border-blue-200">
                    📜 {analysis.suggestedGenre}
                </span>
                <span className="analysis-tag bg-purple-50 text-purple-700 border-purple-200">
                    🗣️ {analysis.suggestedTone}
                </span>
            </div>

            {/* Characters */}
            {analysis.characterProfiles?.length > 0 && (
                <div className="mb-4">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">인물 구성</span>
                    <div className="flex flex-col gap-2 mt-2">
                        {analysis.characterProfiles.map((c, i) => (
                            <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                                <span className="text-lg">{c.role === 'hero' ? '⭐' : c.role === 'friend' ? '🤝' : '🎭'}</span>
                                <div>
                                    <span className="font-bold text-sm text-gray-800">{c.name}</span>
                                    <span className="text-xs text-gray-400 ml-2">({c.role === 'hero' ? '위인 (주인공)' : c.role === 'friend' ? '관련 인물 1' : '관련 인물 2'})</span>
                                    <p className="text-xs text-gray-500 mt-0.5">{c.appearance}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Story Arc Preview */}
            {analysis.storyArc?.length > 0 && (
                <div className="mb-5">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">스토리 아크 ({analysis.storyArc.length}장면)</span>
                    <div className="flex gap-1 mt-2 overflow-x-auto pb-1">
                        {analysis.storyArc.map((s, i) => (
                            <div key={i} className="shrink-0 w-16 text-center">
                                <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                    {s.pageNum}
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1 leading-tight line-clamp-2">{s.purpose}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button 
                    onClick={onAccept}
                    className="studio-btn flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                >
                    <span>✅</span>
                    <span>전체 수락</span>
                </button>
                <button 
                    onClick={() => { onAccept(); onToggleManual(); }}
                    className="studio-btn flex-1 bg-white text-gray-700 py-3 hover:bg-gray-50 border border-gray-200 shadow-sm"
                >
                    <span>✏️</span>
                    <span>수동 조정</span>
                </button>
            </div>
        </div>
    );
};


export const Setup: React.FC<SetupProps> = (props) => {
    if (!props.show && !props.isTransitioning) return null;

    const hasAnalysis = !!props.premiseAnalysis;
    const canLaunch = props.hero || (hasAnalysis && (props.premiseAnalysis?.characterProfiles?.length ?? 0) > 0);
    const hasApiKey = !!localStorage.getItem('manga-gongbang-api-key');

    return (
        <div className={`fixed inset-0 z-[200] overflow-y-auto bg-[#f3f4f6] ${props.isTransitioning ? 'pointer-events-none opacity-0' : 'opacity-100'} transition-opacity duration-700`}>
            <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
                
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="flex justify-center items-center gap-3 mb-4">
                        <div className="inline-block px-4 py-1 bg-blue-600 text-white text-xs font-bold tracking-[0.2em] uppercase rounded-full shadow-lg">
                            AI 역사 전기 만화
                        </div>
                        <button 
                            onClick={props.onOpenApiKeyDialog}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-full shadow-lg transition-colors"
                        >
                            🔑 API Key
                        </button>
                    </div>
                    <h1 className="font-title text-5xl md:text-6xl text-gray-900 mb-4 tracking-tight">
                        위인전 공방 <span className="text-blue-600">.</span>
                    </h1>
                    <p className="text-gray-500 font-body max-w-2xl mx-auto">
                        대한민국 위인들의 이야기를 AI로 만드는 전기 만화. 위인을 선택하거나 직접 입력하세요.
                    </p>
                </div>

                {/* API Key Hint Banner */}
                {!hasApiKey && (
                    <div className="mb-6 flex items-center gap-3 px-5 py-3 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer hover:bg-amber-100 transition-colors" onClick={props.onOpenApiKeyDialog}>
                        <span className="text-xl">🔑</span>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-amber-800">API 키가 설정되지 않았습니다</p>
                            <p className="text-xs text-amber-600">전기 만화를 생성하려면 Gemini API 키가 필요합니다. 클릭하여 설정하세요.</p>
                        </div>
                        <span className="text-amber-400 text-sm font-bold">설정 →</span>
                    </div>
                )}

                {/* ========== QUICK START ========== */}
                <section className="quick-start-card mb-8">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-xl shadow-lg">📜</div>
                        <div>
                            <h2 className="text-2xl font-title text-gray-800">위인 선택</h2>
                            <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">위인을 선택하거나 직접 입력하세요</p>
                        </div>
                    </div>

                    {/* Historical Figure Preset Grid */}
                    <div className="mb-5">
                        <label className="block text-sm font-bold text-gray-700 mb-3">한국 역사 위인 프리셋</label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {HISTORICAL_FIGURE_PRESETS.map(preset => (
                                <button
                                    key={preset.name}
                                    onClick={() => applyFigurePreset(preset.name)}
                                    className={`text-left px-3 py-2.5 rounded-lg border transition-all hover:shadow-md ${
                                        props.customPremise === preset.premise
                                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200 shadow-sm'
                                            : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
                                    }`}
                                >
                                    <div className="text-xl mb-1">{preset.emoji}</div>
                                    <div className="font-bold text-sm text-gray-800">{preset.name}</div>
                                    <div className="text-[10px] text-gray-400 leading-tight mt-0.5">{preset.title}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Premise Input */}
                    <div className="mb-5">
                        <textarea
                            value={props.customPremise}
                            onChange={(e) => props.onPremiseChange(e.target.value)}
                            placeholder={"어떤 위인의 이야기를 만들고 싶으신가요?\n\n예: \"세종대왕이 한글을 창제하기까지의 과정과 반대 세력과의 갈등\""}
                            className="studio-input h-32 resize-none leading-relaxed text-base"
                        />
                    </div>

                    {/* Language Selector + Analyze Button (inline) */}
                    <div className="flex gap-3 items-stretch mb-5">
                        <select value={props.selectedLanguage} onChange={(e) => props.onLanguageChange(e.target.value)} className="studio-input cursor-pointer w-48">
                            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                        </select>
                        <button 
                            onClick={props.onAnalyzePremise}
                            disabled={!props.customPremise.trim() || props.isAnalyzingPremise}
                            className="studio-btn flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg py-3 hover:from-blue-700 hover:to-purple-700 shadow-lg disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none"
                        >
                            {props.isAnalyzingPremise ? (
                                <>
                                    <span className="inline-block animate-spin">⚙️</span>
                                    <span>역사 분석 중...</span>
                                </>
                            ) : (
                                <>
                                    <span>🧠</span>
                                    <span>역사 분석하기</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Analysis Result */}
                    {props.premiseAnalysis && (
                        <AnalysisResultCard 
                            analysis={props.premiseAnalysis}
                            onAccept={props.onAcceptAnalysis}
                            onToggleManual={props.onToggleManualSettings}
                        />
                    )}
                </section>

                {/* ========== MANUAL SETTINGS TOGGLE ========== */}
                <div className="mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={props.onToggleManualSettings}
                            className="flex-1 flex items-center justify-between px-6 py-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-lg">🎛️</span>
                                <span className="font-title text-gray-700 text-lg">세부 설정</span>
                                <span className="text-xs text-gray-400 font-bold">인물 · 시대 · 서술 톤 · 화풍</span>
                            </div>
                            <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${props.showManualSettings ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={() => {
                                if (confirm('모든 설정을 기본값으로 초기화하시겠습니까?\n\n캐릭터 사진은 유지됩니다.')) {
                                    props.onResetProjectSettings();
                                    toast.success('설정이 초기화되었습니다.');
                                }
                            }}
                            className="px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all group"
                            title="모든 설정을 기본값으로 초기화"
                            aria-label="설정 초기화"
                        >
                            <span className="text-lg group-hover:scale-110 transition-transform">🔄</span>
                        </button>
                    </div>
                </div>

                {/* ========== COLLAPSIBLE MANUAL SETTINGS ========== */}
                <div className={`manual-settings-wrapper ${props.showManualSettings ? 'expanded' : 'collapsed'}`}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        
                        {/* STEP 1: CASTING */}
                        <section className="flex flex-col gap-5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold font-title">1</div>
                                <h2 className="text-2xl font-title text-gray-800">역사 인물 설정</h2>
                                {hasAnalysis && !props.hero && (
                                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-bold">AI 자동 생성 예정</span>
                                )}
                            </div>
                            <CharacterCard
                                role="위인 (주인공)"
                                subtitle="Historical Figure"
                                persona={props.hero}
                                onInput={props.onHeroInput}
                                onRemove={props.onHeroRemove}
                                onEditPrompt={props.onHeroEditPrompt}
                                onOutfit={props.onHeroOutfit}
                                onProps={props.onHeroProps}
                            />
                            <CharacterCard
                                role="관련 인물 1"
                                subtitle="Key Associate"
                                persona={props.friend}
                                onInput={props.onFriendInput}
                                onRemove={props.onFriendRemove}
                                onEditPrompt={props.onFriendEditPrompt}
                                onOutfit={props.onFriendOutfit}
                                onProps={props.onFriendProps}
                            />
                            <CharacterCard
                                role="관련 인물 2"
                                subtitle="Secondary Figure"
                                persona={props.friend2}
                                onInput={props.onFriend2Input}
                                onRemove={props.onFriend2Remove}
                                onEditPrompt={props.onFriend2EditPrompt}
                                onOutfit={props.onFriend2Outfit}
                                onProps={props.onFriend2Props}
                            />
                        </section>

                        {/* STEP 2: SCRIPT */}
                        <section className="flex flex-col gap-5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold font-title">2</div>
                                <h2 className="text-2xl font-title text-gray-800">시대 & 서술 방식</h2>
                            </div>
                            
                            <div className="studio-card p-6 flex flex-col gap-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-bold text-gray-700 mb-2 text-sm">시대 배경</label>
                                        <select value={props.selectedGenre} onChange={(e) => props.onGenreChange(e.target.value)} className={`studio-input cursor-pointer ${hasAnalysis ? 'auto-filled' : ''}`}>
                                            {GENRE_GROUPS.map(group => (
                                                <optgroup key={group.category} label={group.category}>
                                                    {group.items.map(g => <option key={g} value={g}>{g}</option>)}
                                                </optgroup>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block font-bold text-gray-700 mb-2 text-sm">서술 톤</label>
                                        <select value={props.storyTone} onChange={(e) => props.onToneChange(e.target.value)} className={`studio-input cursor-pointer ${hasAnalysis ? 'auto-filled' : ''}`}>
                                            {TONE_GROUPS.map(group => (
                                                <optgroup key={group.category} label={group.category}>
                                                    {group.items.map(t => <option key={t} value={t}>{t}</option>)}
                                                </optgroup>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* STEP 3: ART DIRECTION */}
                        <section className="flex flex-col gap-5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold font-title">3</div>
                                <h2 className="text-2xl font-title text-gray-800">화풍 설정</h2>
                            </div>

                            <div className="studio-card p-6 flex flex-col gap-5 border-t-4 border-amber-600">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-2 text-sm">전기만화 제목</label>
                                    <input 
                                        type="text"
                                        value={props.coverTitle}
                                        onChange={(e) => props.onCoverTitleChange(e.target.value)}
                                        placeholder="자동 생성 (비워두기 가능)"
                                        className={`studio-input text-lg font-bold ${hasAnalysis && props.coverTitle ? 'auto-filled' : ''}`}
                                    />
                                </div>

                                {/* Style Presets */}
                                <div>
                                    <label className="block font-bold text-gray-700 mb-2 text-sm">화풍 프리셋</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {STYLE_PRESETS.map(preset => (
                                            <button
                                                key={preset.name}
                                                onClick={() => props.onStylePresetChange(props.selectedStylePreset === preset.name ? '' : preset.name)}
                                                className={`text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                                                    props.selectedStylePreset === preset.name 
                                                        ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm ring-2 ring-purple-200' 
                                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                <span className="mr-1">{preset.emoji}</span>
                                                <span className="font-bold">{preset.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block font-bold text-gray-700 mb-2 text-sm">표지 화풍 (직접 입력)</label>
                                    <textarea
                                        value={props.coverStyle}
                                        onChange={(e) => props.onCoverStyleChange(e.target.value)}
                                        placeholder="예: 조선시대 궁중 기록화 스타일, 격식 있는 구도, 금박 장식" 
                                        className={`studio-input h-24 resize-none ${hasAnalysis && props.coverStyle ? 'auto-filled' : ''}`}
                                    />
                                </div>
                            </div>
                        </section>
                        {/* STEP 4: AI ENGINE SETTINGS */}
                        <section className="flex flex-col gap-5 lg:col-span-3 mt-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold font-title">4</div>
                                <h2 className="text-2xl font-title text-gray-800">AI 엔진 고급 설정</h2>
                            </div>

                            <div className="studio-card p-6 flex flex-col gap-5 border-t-4 border-blue-600 bg-blue-50/30">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block font-bold text-gray-700 mb-2 text-sm">
                                            텍스트 추론 모델 <span className="text-xs text-blue-500 ml-1">(스토리 빌딩 & 분석)</span>
                                        </label>
                                        <select 
                                            value={props.selectedTextModel} 
                                            onChange={(e) => props.onTextModelChange(e.target.value)} 
                                            className="studio-input cursor-pointer font-bold"
                                        >
                                            {TEXT_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block font-bold text-gray-700 mb-2 text-sm">
                                            이미지 생성 모델 <span className="text-xs text-purple-500 ml-1">(작화 렌더링)</span>
                                        </label>
                                        <select 
                                            value={props.selectedImageModel} 
                                            onChange={(e) => props.onImageModelChange(e.target.value)} 
                                            className="studio-input cursor-pointer font-bold"
                                        >
                                            {IMAGE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* ========== LAUNCH BUTTON ========== */}
                <div className="mt-8 max-w-xl mx-auto">
                    <button 
                        onClick={props.onLaunch} 
                        disabled={!canLaunch} 
                        className="studio-btn w-full bg-blue-600 text-white text-xl py-5 hover:bg-blue-700 shadow-xl hover:shadow-blue-500/30 transition-all disabled:bg-gray-300 disabled:shadow-none rounded-2xl"
                    >
                        <span>🎬</span>
                        <span>{props.isTransitioning ? '제작 중...' : '전기 만화 제작'}</span>
                    </button>
                    {!canLaunch && (
                        <p className="text-center text-red-500 text-xs mt-3 font-bold">
                            * 위인 정보를 입력하고 역사 분석을 실행하거나, 인물 사진을 등록해주세요
                        </p>
                    )}
                    {canLaunch && !props.hero && hasAnalysis && (
                        <p className="text-center text-purple-500 text-xs mt-3 font-bold">
                            📜 역사 인물이 분석 결과로 자동 생성됩니다
                        </p>
                    )}
                </div>
                
                <footer className="mt-20 text-center text-gray-400 text-xs font-body flex flex-col items-center gap-2">
                    <p>© 2025 위인전 공방. Powered by Gemini AI.</p>
                    <p className="text-[10px] text-gray-300 mt-1">AI가 생성한 역사적 내용은 참고용이며, 정확한 역사 사실과 다를 수 있습니다.</p>
                    <a href="https://github.com/Reasonofmoon/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                        <span>달의이성 (Reasonofmoon)</span>
                    </a>
                </footer>
            </div>
        </div>
    );
};
