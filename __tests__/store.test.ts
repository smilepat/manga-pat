import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStore } from '../store';
import { GENRES, TONES, LANGUAGES } from '../types';

describe('Zustand AppStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useStore.getState().resetApp();
  });

  describe('Character Slice', () => {
    it('should set hero properly', () => {
      const heroData = { base64: 'mock_base64', desc: 'A mock hero' };
      useStore.getState().setHero(heroData);
      expect(useStore.getState().hero).toEqual(heroData);
    });

    it('should update edit prompt safely with immer', () => {
      useStore.getState().setHero({ base64: 'test', desc: 'test' });
      useStore.getState().updateEditPrompt('hero', 'Make him smile');
      expect(useStore.getState().hero?.editPrompt).toBe('Make him smile');
    });
  });

  describe('Project Slice', () => {
    it('should have correct default settings', () => {
      const state = useStore.getState();
      expect(state.selectedGenre).toBe(GENRES[0]);
      expect(state.storyTone).toBe(TONES[0]);
      expect(state.selectedLanguage).toBe(LANGUAGES[0].code);
      expect(state.richMode).toBe(true);
    });

    it('should update project settings', () => {
      useStore.getState().setSelectedGenre(GENRES[1]);
      useStore.getState().setStoryTitle("My Epic Manga");
      
      const state = useStore.getState();
      expect(state.selectedGenre).toBe(GENRES[1]);
      expect(state.storyTitle).toBe("My Epic Manga");
    });
  });

  describe('Generation Slice', () => {
    it('should add and remove generating pages via Set', () => {
      useStore.getState().addGeneratingPage(2);
      expect(useStore.getState().isPageGenerating(2)).toBe(true);
      
      useStore.getState().removeGeneratingPage(2);
      expect(useStore.getState().isPageGenerating(2)).toBe(false);
    });

    it('should update history immutably', () => {
      const face = { id: 'page-1', type: 'story' as const, choices: [], isLoading: false };
      useStore.getState().pushHistory(face);
      expect(useStore.getState().history).toHaveLength(1);
      
      useStore.getState().updateHistory('page-1', { resolvedChoice: 'Attack' });
      expect(useStore.getState().history[0].resolvedChoice).toBe('Attack');
    });
  });

  describe('UI Slice', () => {
    it('should toggle manual settings', () => {
      const initial = useStore.getState().showManualSettings;
      useStore.getState().toggleManualSettings();
      expect(useStore.getState().showManualSettings).toBe(!initial);
    });
  });

  describe('Reset', () => {
    it('should clear all major states', () => {
      useStore.getState().setHero({ base64: 'hi', desc: 'hi' });
      useStore.getState().addGeneratingPage(1);
      useStore.getState().setIsStarted(true);

      useStore.getState().resetApp();

      const state = useStore.getState();
      expect(state.hero).toBeNull();
      expect(state.isStarted).toBe(false);
      expect(state.generatingPages.size).toBe(0);
    });
  });
});
