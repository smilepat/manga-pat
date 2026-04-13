
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useCallback } from 'react';
import { ComicFace, TOTAL_PAGES } from './types';
import { Panel } from './Panel';

interface BookProps {
    comicFaces: ComicFace[];
    currentSheetIndex: number;
    isStarted: boolean;
    isSetupVisible: boolean;
    onSheetClick: (index: number) => void;
    onChoice: (pageIndex: number, choice: string) => void;
    onOpenBook: () => void;
    onDownload: (withWatermark?: boolean) => void;
    onDownloadImages?: () => void;
    onReset: () => void;
    onEditPage: (id: string) => void;
    onRegeneratePage: (id: string) => void;
    onRetryPage: (id: string) => void;
    onUndoPage: (id: string) => void;
}

export const Book: React.FC<BookProps> = (props) => {
    // Swipe gesture handling
    const touchStartX = useRef<number>(0);
    const touchStartY = useRef<number>(0);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    }, []);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (!props.isStarted || props.isSetupVisible) return;
        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        const deltaY = e.changedTouches[0].clientY - touchStartY.current;
        // Only trigger if horizontal swipe is dominant and > 50px
        if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
            if (deltaX < 0) {
                // Swipe left → next page
                const maxIndex = Math.min(props.currentSheetIndex + 1, props.comicFaces.length);
                if (maxIndex > props.currentSheetIndex) props.onSheetClick(maxIndex);
            } else {
                // Swipe right → previous page
                if (props.currentSheetIndex > 0) props.onSheetClick(props.currentSheetIndex - 1);
            }
        }
    }, [props.isStarted, props.isSetupVisible, props.currentSheetIndex, props.comicFaces.length, props.onSheetClick]);

    const goNext = useCallback(() => {
        const maxIndex = Math.min(props.currentSheetIndex + 1, props.comicFaces.length);
        if (maxIndex > props.currentSheetIndex) props.onSheetClick(maxIndex);
    }, [props.currentSheetIndex, props.comicFaces.length, props.onSheetClick]);

    const goPrev = useCallback(() => {
        if (props.currentSheetIndex > 0) props.onSheetClick(props.currentSheetIndex - 1);
    }, [props.currentSheetIndex, props.onSheetClick]);

    const sheetsToRender = [];
    if (props.comicFaces.length > 0) {
        sheetsToRender.push({ front: props.comicFaces[0], back: props.comicFaces.find(f => f.pageIndex === 1) });
        for (let i = 2; i <= TOTAL_PAGES; i += 2) {
            sheetsToRender.push({ front: props.comicFaces.find(f => f.pageIndex === i), back: props.comicFaces.find(f => f.pageIndex === i + 1) });
        }
    } else if (props.isSetupVisible) {
        sheetsToRender.push({ front: undefined, back: undefined });
    }

    const currentPage = props.currentSheetIndex > 0 ? props.currentSheetIndex : 0;
    const totalPages = props.comicFaces.length;

    return (
        <div className={`book ${props.currentSheetIndex > 0 ? 'opened' : ''} transition-all duration-1000 ease-in-out`}
           onTouchStart={handleTouchStart}
           onTouchEnd={handleTouchEnd}
           style={ (props.isSetupVisible) ? { transform: 'translateZ(-600px) translateY(-100px) rotateX(20deg) scale(0.9)', filter: 'blur(6px) brightness(0.7)', pointerEvents: 'none' } : {}}>
          {sheetsToRender.map((sheet, i) => (
              <div key={i} className={`paper ${i < props.currentSheetIndex ? 'flipped' : ''}`} style={{ zIndex: i < props.currentSheetIndex ? i : sheetsToRender.length - i }}
                   onClick={() => props.onSheetClick(i)}>
                  <div className="front">
                      <Panel face={sheet.front} allFaces={props.comicFaces} onChoice={props.onChoice} onOpenBook={props.onOpenBook} onDownload={props.onDownload} onDownloadImages={props.onDownloadImages} onReset={props.onReset} onEditPage={props.onEditPage} onRegeneratePage={props.onRegeneratePage} onRetryPage={props.onRetryPage} onUndoPage={props.onUndoPage} />
                  </div>
                  <div className="back">
                      <Panel face={sheet.back} allFaces={props.comicFaces} onChoice={props.onChoice} onOpenBook={props.onOpenBook} onDownload={props.onDownload} onDownloadImages={props.onDownloadImages} onReset={props.onReset} onEditPage={props.onEditPage} onRegeneratePage={props.onRegeneratePage} onRetryPage={props.onRetryPage} onUndoPage={props.onUndoPage} />
                  </div>
              </div>
          ))}

          {/* Keyboard Shortcuts Hint - Only show when book is open */}
          {props.isStarted && !props.isSetupVisible && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-4 z-50 kbd-hint">
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-0.5 bg-white/20 rounded">←</kbd>
                <kbd className="px-2 py-0.5 bg-white/20 rounded">→</kbd>
                <span className="text-gray-300">페이지</span>
              </span>
              <span className="w-px h-3 bg-white/30"></span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-0.5 bg-white/20 rounded">Space</kbd>
                <span className="text-gray-300">다음</span>
              </span>
              <span className="w-px h-3 bg-white/30"></span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-0.5 bg-white/20 rounded">Esc</kbd>
                <span className="text-gray-300">닫기</span>
              </span>
            </div>
          )}

          {/* Mobile Navigation Arrows */}
          {props.isStarted && !props.isSetupVisible && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-6 z-50 mobile-nav-arrows">
              <button
                onClick={goPrev}
                disabled={props.currentSheetIndex <= 0}
                className="w-12 h-12 rounded-full bg-black/70 text-white flex items-center justify-center text-xl shadow-lg disabled:opacity-30 active:scale-90 transition-transform"
                aria-label="이전 페이지"
              >
                ←
              </button>
              <button
                onClick={goNext}
                disabled={props.currentSheetIndex >= props.comicFaces.length}
                className="w-12 h-12 rounded-full bg-black/70 text-white flex items-center justify-center text-xl shadow-lg disabled:opacity-30 active:scale-90 transition-transform"
                aria-label="다음 페이지"
              >
                →
              </button>
            </div>
          )}

          {/* Page indicator with generation progress */}
          {props.isStarted && !props.isSetupVisible && currentPage > 0 && (
            <div className="fixed top-4 right-4 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-xs font-bold z-50 flex flex-col items-end gap-1">
              <span>{currentPage} / {totalPages}</span>
              {(() => {
                const loadingCount = props.comicFaces.filter(f => f.isLoading).length;
                const doneCount = props.comicFaces.filter(f => f.imageUrl && !f.isLoading).length;
                const errorCount = props.comicFaces.filter(f => f.error && !f.isLoading).length;
                if (loadingCount > 0) return (
                  <span className="text-blue-400 text-[10px] flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                    {loadingCount}페이지 생성 중... ({doneCount} 완료)
                  </span>
                );
                if (errorCount > 0) return (
                  <span className="text-red-400 text-[10px]">{errorCount}페이지 실패</span>
                );
                return <span className="text-green-400 text-[10px]">전체 완료</span>;
              })()}
            </div>
          )}
      </div>
    );
}
