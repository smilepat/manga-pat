
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { ComicFace, INITIAL_PAGES, GATE_PAGE, DECISION_PAGES } from './types';
import { LoadingFX } from './LoadingFX';

interface PanelProps {
    face?: ComicFace;
    allFaces: ComicFace[];
    onChoice: (pageIndex: number, choice: string) => void;
    onOpenBook: () => void;
    onDownload: (withWatermark?: boolean) => void;
    onDownloadImages?: () => void;
    onReset: () => void;
    onEditPage?: (id: string) => void;
    onRegeneratePage?: (id: string) => void;
    onRetryPage?: (id: string) => void;
    onUndoPage?: (id: string) => void;
}

export const Panel: React.FC<PanelProps> = ({ face, allFaces, onChoice, onOpenBook, onDownload, onDownloadImages, onReset, onEditPage, onRegeneratePage, onRetryPage, onUndoPage }) => {
    if (!face) return <div className="w-full h-full bg-gray-100" />;
    if (face.isLoading && !face.imageUrl) return <LoadingFX />;

    // Error state with retry
    if (face.error && !face.imageUrl) return (
        <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
            </div>
            <p className="text-white font-title text-lg">{face.error}</p>
            <p className="text-gray-400 text-sm">네트워크 상태를 확인하고 다시 시도해주세요.</p>
            {onRetryPage && (
                <button
                    onClick={(e) => { e.stopPropagation(); onRetryPage(face.id); }}
                    className="studio-btn bg-blue-600 text-white px-6 py-3 hover:bg-blue-500 shadow-lg"
                >
                    🔄 다시 시도
                </button>
            )}
        </div>
    );
    
    const isFullBleed = face.type === 'cover' || face.type === 'back_cover';

    return (
        <div className={`panel-container relative group ${isFullBleed ? '!p-0 !bg-gray-900' : ''}`}>
            <div className="gloss"></div>
            {face.imageUrl && <img src={face.imageUrl} alt={face.narrative?.scene || (face.type === 'cover' ? '전기 만화 표지' : face.type === 'back_cover' ? '뒷표지' : `${face.pageIndex || 0}페이지`)} className={`panel-image ${isFullBleed ? '!object-cover' : ''}`} />}
            
            {/* Edit/Regen Buttons */}
            {face.imageUrl && !face.isLoading && onEditPage && (
                <div className="absolute top-4 right-4 opacity-40 hover:opacity-100 group-hover:opacity-100 transition-opacity duration-300 z-30 flex flex-col gap-2 items-end">
                    {face.type === 'story' && onRegeneratePage && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onRegeneratePage(face.id); }}
                            className="bg-white/90 hover:bg-white text-gray-900 font-bold p-2 rounded-full shadow-lg border border-gray-200 flex items-center gap-2 px-4"
                        >
                            <span>🔄</span> <span className="text-xs font-bold">재생성</span>
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onEditPage(face.id); }}
                        className="bg-white/90 hover:bg-white text-gray-900 font-bold p-2 rounded-full shadow-lg border border-gray-200 flex items-center gap-2 px-4"
                    >
                        <span>✏️</span> <span className="text-xs font-bold">수정</span>
                    </button>
                    {face.previousImageUrl && onUndoPage && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onUndoPage(face.id); }}
                            className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold p-2 rounded-full shadow-lg border border-amber-300 flex items-center gap-2 px-4"
                        >
                            <span>↩️</span> <span className="text-xs font-bold">되돌리기</span>
                        </button>
                    )}
                </div>
            )}

            {/* Choice Ahead Indicator */}
            {face.type === 'story' && face.pageIndex != null && !face.isDecisionPage && DECISION_PAGES.includes(face.pageIndex + 1) && face.imageUrl && !face.isLoading && (
                <div className="absolute top-4 left-4 z-20 bg-amber-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
                    <span>⚡</span>
                    <span>다음 페이지에서 역사적 분기점!</span>
                </div>
            )}

            {/* Decision Buttons */}
            {face.isDecisionPage && face.choices.length > 0 && (
                <div className={`absolute bottom-0 inset-x-0 p-6 pb-12 flex flex-col gap-3 items-center justify-end transition-opacity duration-500 ${face.resolvedChoice ? 'opacity-0 pointer-events-none' : 'opacity-100'} bg-gradient-to-t from-black/90 via-black/60 to-transparent z-20`}>
                    <p className="text-white font-title text-2xl tracking-wider drop-shadow-lg mb-2">역사적 분기점</p>
                    {face.choices.map((choice, i) => (
                        <button key={i} onClick={(e) => { e.stopPropagation(); if(face.pageIndex) onChoice(face.pageIndex, choice); }}
                          className={`studio-btn w-full py-4 text-lg font-bold shadow-lg backdrop-blur-sm border border-white/20 ${
                              i===0 
                              ? 'bg-blue-600/90 text-white hover:bg-blue-500' 
                              : 'bg-gray-800/90 text-white hover:bg-gray-700'
                          }`}>
                            {choice}
                        </button>
                    ))}
                </div>
            )}

            {/* Cover Action */}
            {face.type === 'cover' && (
                 <div className="absolute bottom-20 inset-x-0 flex justify-center z-20">
                     <button onClick={(e) => { e.stopPropagation(); onOpenBook(); }}
                      disabled={!allFaces.find(f => f.pageIndex === GATE_PAGE)?.imageUrl}
                      className="studio-btn bg-white text-black px-12 py-4 text-2xl font-bold hover:bg-gray-100 shadow-2xl disabled:opacity-50 disabled:cursor-wait ring-4 ring-black/5">
                         {(!allFaces.find(f => f.pageIndex === GATE_PAGE)?.imageUrl) ? 
                            `인쇄 대기 중... (${allFaces.filter(f => f.type==='story' && f.imageUrl && (f.pageIndex||0) <= GATE_PAGE).length}/${INITIAL_PAGES})` 
                            : '▶ 이야기 시작'}
                     </button>
                 </div>
            )}

            {/* Back Cover Actions */}
            {face.type === 'back_cover' && (
                <div className="absolute bottom-16 inset-x-0 flex flex-col items-center gap-3 z-20">
                    <button onClick={(e) => { e.stopPropagation(); onDownload(true); }} className="studio-btn bg-blue-600 text-white px-8 py-3 text-lg font-bold hover:bg-blue-500 shadow-lg w-64">
                        📥 PDF 다운로드
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDownload(false); }} className="studio-btn bg-blue-800 text-white px-8 py-2 text-sm font-bold hover:bg-blue-700 shadow-lg w-64">
                        📄 PDF (워터마크 없이)
                    </button>
                    {onDownloadImages && (
                        <button onClick={(e) => { e.stopPropagation(); onDownloadImages(); }} className="studio-btn bg-purple-600 text-white px-8 py-2 text-sm font-bold hover:bg-purple-500 shadow-lg w-64">
                            🖼️ 이미지 개별 저장
                        </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); if (confirm('현재 프로젝트를 종료하고 새로 시작하시겠습니까?\n\n모든 생성된 페이지가 삭제됩니다.')) onReset(); }} className="studio-btn bg-white text-gray-900 px-8 py-2 text-sm font-bold hover:bg-gray-100 shadow-lg w-64">
                        🔄 새 프로젝트
                    </button>
                </div>
            )}
        </div>
    );
}
