
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import { useStore } from './store';
import { Setup } from './Setup';
import { Book } from './Book';
import { EditModal } from './EditModal';
import { RegenerateDialog } from './RegenerateDialog';
import { ApiKeyDialog } from './ApiKeyDialog';
import {
  analyzePremise, acceptAnalysis, launchStory, handleChoice,
  handleHeroInput, handleFriendInput, handleFriend2Input,
  handleEditPage, handleRegeneratePage, retryPage, undoPageEdit,
} from './aiEngine';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'manga-gongbang-api-key';

const App: React.FC = () => {
  const {
    // Characters
    hero, friend, friend2, setHero, setFriend, setFriend2, updateEditPrompt, updateOutfit, updateProps,
    // Project
    selectedGenre, selectedLanguage, storyTone, customPremise, richMode,
    coverTitle, coverStyle, selectedStylePreset, selectedTextModel, selectedImageModel, premiseAnalysis, isAnalyzingPremise,
    setSelectedGenre, setSelectedLanguage, setStoryTone, setCustomPremise, setRichMode,
    setCoverTitle, setCoverStyle, setSelectedStylePreset, setSelectedTextModel, setSelectedImageModel, resetProjectSettings,
    // Generation
    comicFaces, currentSheetIndex, isStarted, showSetup, isTransitioning, analyzingStatus,
    setCurrentSheetIndex,
    // UI
    showApiKeyDialog, editingFaceId, regeneratingFaceId, showManualSettings,
    setShowApiKeyDialog, setEditingFaceId, setRegeneratingFaceId, toggleManualSettings,
  } = useStore();

  // API key dialog is now shown on-demand when user triggers an action
  // that requires a key (analyzePremise, launchStory), not on first visit.

  // Keyboard shortcuts for navigation
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return;
    }

    // Only work when story is started and setup is hidden
    if (!isStarted || showSetup) return;

    switch (e.key) {
      case 'ArrowRight':
      case ' ': // Spacebar
        e.preventDefault();
        // Move to next page
        const maxIndex = Math.min(currentSheetIndex + 1, comicFaces.length);
        if (maxIndex > currentSheetIndex) {
          setCurrentSheetIndex(maxIndex);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        // Move to previous page
        if (currentSheetIndex > 0) {
          setCurrentSheetIndex(currentSheetIndex - 1);
        }
        break;
      case 'Home':
        e.preventDefault();
        // Go to first page
        setCurrentSheetIndex(0);
        break;
      case 'End':
        e.preventDefault();
        // Go to last available page
        setCurrentSheetIndex(comicFaces.length);
        break;
      case 'Escape':
        e.preventDefault();
        // Close any open modals
        if (editingFaceId) setEditingFaceId(null);
        if (regeneratingFaceId) setRegeneratingFaceId(null);
        break;
    }
  }, [isStarted, showSetup, currentSheetIndex, comicFaces.length, setCurrentSheetIndex, editingFaceId, regeneratingFaceId, setEditingFaceId, setRegeneratingFaceId]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const handleApiKeySave = (key?: string) => {
    if (key) localStorage.setItem(STORAGE_KEY, key);
    setShowApiKeyDialog(false);
  };

  const downloadPDF = (withWatermark = true) => {
    const doc = new jsPDF({ unit: 'pt', format: [480, 720] });
    const pages = comicFaces.filter(f => f.imageUrl && !f.isLoading).sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0));

    // Title page: use cover image if available, otherwise simple text
    const cover = pages.find(f => f.type === 'cover');
    if (cover?.imageUrl) {
      doc.addImage(cover.imageUrl, 'JPEG', 0, 0, 480, 720);
    } else {
      doc.setFillColor(20, 20, 20);
      doc.rect(0, 0, 480, 720, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text("AI Comic Studio", 240, 320, { align: 'center' });
    }

    // Story pages
    const storyPages = pages.filter(f => f.type !== 'cover');
    storyPages.forEach((f, i) => {
      doc.addPage();
      if (f.imageUrl) doc.addImage(f.imageUrl, 'JPEG', 0, 0, 480, 720);

      // Page number
      doc.setFillColor(0, 0, 0);
      doc.setGState(new (doc as any).GState({ opacity: 0.6 }));
      doc.circle(460, 700, 12, 'F');
      doc.setGState(new (doc as any).GState({ opacity: 1 }));
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text(String(i + 1), 460, 704, { align: 'center' });

      // Watermark footer (optional)
      if (withWatermark) {
        doc.setFillColor(0, 0, 0);
        doc.setGState(new (doc as any).GState({ opacity: 0.5 }));
        doc.rect(0, 708, 480, 12, 'F');
        doc.setGState(new (doc as any).GState({ opacity: 1 }));
        doc.setTextColor(200, 200, 200);
        doc.setFontSize(7);
        doc.text("Generated by AI Comic Studio", 470, 716, { align: 'right' });
      }
    });
    const title = coverTitle || 'comic';
    doc.save(`${title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}.pdf`);
  };

  const downloadImages = () => {
    const pages = comicFaces.filter(f => f.imageUrl && !f.isLoading).sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0));
    pages.forEach((f, i) => {
      if (!f.imageUrl) return;
      const a = document.createElement('a');
      a.href = f.imageUrl;
      a.download = `page_${String(i).padStart(2, '0')}.webp`;
      a.click();
    });
  };

  const resetApp = useStore(s => s.resetApp);

  return (
    <div className="comic-scene">
      {showApiKeyDialog && <ApiKeyDialog onContinue={handleApiKeySave} />}
      {analyzingStatus && <div className="fixed inset-0 z-[600] bg-black/80 flex items-center justify-center text-white font-title text-3xl">{analyzingStatus}</div>}

      {editingFaceId && (
        <EditModal
          imageUrl={comicFaces.find(f => f.id === editingFaceId)?.imageUrl || ''}
          onClose={() => setEditingFaceId(null)}
          onApply={handleEditPage}
        />
      )}

      {regeneratingFaceId && (
        <RegenerateDialog
          initialBeat={comicFaces.find(f => f.id === regeneratingFaceId)?.narrative || { scene: "", choices: [], focus_char: 'hero' }}
          onClose={() => setRegeneratingFaceId(null)}
          onRegenerate={handleRegeneratePage}
        />
      )}

      <Setup
        show={showSetup} isTransitioning={isTransitioning}
        hero={hero} friend={friend} friend2={friend2}
        onHeroEditPrompt={(v) => updateEditPrompt('hero', v)}
        onFriendEditPrompt={(v) => updateEditPrompt('friend', v)}
        onFriend2EditPrompt={(v) => updateEditPrompt('friend2', v)}
        onHeroOutfit={(v) => updateOutfit('hero', v)}
        onFriendOutfit={(v) => updateOutfit('friend', v)}
        onFriend2Outfit={(v) => updateOutfit('friend2', v)}
        onHeroProps={(v) => updateProps('hero', v)}
        onFriendProps={(v) => updateProps('friend', v)}
        onFriend2Props={(v) => updateProps('friend2', v)}
        selectedGenre={selectedGenre} selectedLanguage={selectedLanguage} storyTone={storyTone} customPremise={customPremise} richMode={richMode}
        onHeroInput={handleHeroInput} onFriendInput={handleFriendInput} onFriend2Input={handleFriend2Input}
        onHeroRemove={() => { setHero(null); toast.success('주인공 이미지가 해제되었습니다.'); }}
        onFriendRemove={() => { setFriend(null); toast.success('조연 1 이미지가 해제되었습니다.'); }}
        onFriend2Remove={() => { setFriend2(null); toast.success('조연 2 이미지가 해제되었습니다.'); }}
        onGenreChange={setSelectedGenre} onLanguageChange={setSelectedLanguage} onToneChange={setStoryTone} onPremiseChange={setCustomPremise} onRichModeChange={setRichMode}
        coverTitle={coverTitle} coverStyle={coverStyle} onCoverTitleChange={setCoverTitle} onCoverStyleChange={setCoverStyle}
        onLaunch={launchStory}
        premiseAnalysis={premiseAnalysis} isAnalyzingPremise={isAnalyzingPremise}
        onAnalyzePremise={analyzePremise} onAcceptAnalysis={acceptAnalysis}
        showManualSettings={showManualSettings} onToggleManualSettings={toggleManualSettings}
        selectedStylePreset={selectedStylePreset} onStylePresetChange={setSelectedStylePreset}
        selectedTextModel={selectedTextModel} selectedImageModel={selectedImageModel}
        onTextModelChange={setSelectedTextModel} onImageModelChange={setSelectedImageModel}
        onOpenApiKeyDialog={() => setShowApiKeyDialog(true)}
        onResetProjectSettings={resetProjectSettings}
      />

      <Book
        comicFaces={comicFaces} currentSheetIndex={currentSheetIndex} isStarted={isStarted} isSetupVisible={showSetup && !isTransitioning}
        onSheetClick={(i) => { if (!isStarted) return; if (i < currentSheetIndex) setCurrentSheetIndex(i); else if (i === currentSheetIndex && comicFaces.find(f => f.pageIndex === i)?.imageUrl) setCurrentSheetIndex(prev => prev + 1); }}
        onChoice={handleChoice} onOpenBook={() => setCurrentSheetIndex(1)} onDownload={downloadPDF} onDownloadImages={downloadImages} onReset={resetApp}
        onEditPage={(id) => setEditingFaceId(id)}
        onRegeneratePage={(id) => setRegeneratingFaceId(id)}
        onRetryPage={retryPage}
        onUndoPage={undoPageEdit}
      />
    </div>
  );
};

export default App;
