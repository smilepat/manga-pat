/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Zustand store — 4 domain slices with IndexedDB persistence
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import { enableMapSet } from 'immer';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { GENRES, TONES, LANGUAGES, TEXT_MODELS, IMAGE_MODELS, STYLE_PRESETS, ComicFace, Beat, Persona, PremiseAnalysis } from './types';

enableMapSet();

// ======== IDB Storage Adapter ========
const idbStorage = createJSONStorage(() => ({
  getItem: async (name: string) => {
    const val = await idbGet(name);
    return val ?? null;
  },
  setItem: async (name: string, value: string) => {
    await idbSet(name, value);
  },
  removeItem: async (name: string) => {
    await idbDel(name);
  },
}));

// ======== Character Slice ========
interface CharacterSlice {
  hero: Persona | null;
  friend: Persona | null;
  friend2: Persona | null;
  setHero: (p: Persona | null) => void;
  setFriend: (p: Persona | null) => void;
  setFriend2: (p: Persona | null) => void;
  updateEditPrompt: (role: 'hero' | 'friend' | 'friend2', val: string) => void;
  updateOutfit: (role: 'hero' | 'friend' | 'friend2', val: string) => void;
  updateProps: (role: 'hero' | 'friend' | 'friend2', val: string) => void;
}

// ======== Project Slice ========
interface ProjectSlice {
  selectedGenre: string;
  selectedLanguage: string;
  customPremise: string;
  storyTone: string;
  richMode: boolean;
  coverTitle: string;
  coverStyle: string;
  storyTitle: string;
  selectedStylePreset: string;
  selectedTextModel: string;
  selectedImageModel: string;
  premiseAnalysis: PremiseAnalysis | null;
  selectedFigurePreset: string | null;
  historicalPeriod: string;
  setSelectedGenre: (v: string) => void;
  setSelectedLanguage: (v: string) => void;
  setCustomPremise: (v: string) => void;
  setStoryTone: (v: string) => void;
  setRichMode: (v: boolean) => void;
  setCoverTitle: (v: string) => void;
  setCoverStyle: (v: string) => void;
  setStoryTitle: (v: string) => void;
  setSelectedStylePreset: (v: string) => void;
  setSelectedTextModel: (v: string) => void;
  setSelectedImageModel: (v: string) => void;
  setPremiseAnalysis: (v: PremiseAnalysis | null) => void;
  setSelectedFigurePreset: (v: string | null) => void;
  setHistoricalPeriod: (v: string) => void;
  resetProjectSettings: () => void;
}

// ======== Generation Slice ========
interface GenerationSlice {
  comicFaces: ComicFace[];
  currentSheetIndex: number;
  isStarted: boolean;
  showSetup: boolean;
  isTransitioning: boolean;
  analyzingStatus: string;
  generatingPages: Set<number>;
  history: ComicFace[];
  _hasHydrated: boolean;
  setComicFaces: (updater: ComicFace[] | ((prev: ComicFace[]) => ComicFace[])) => void;
  updateFace: (id: string, updates: Partial<ComicFace>) => void;
  setCurrentSheetIndex: (v: number | ((prev: number) => number)) => void;
  setIsStarted: (v: boolean) => void;
  setShowSetup: (v: boolean) => void;
  setIsTransitioning: (v: boolean) => void;
  setAnalyzingStatus: (v: string) => void;
  addGeneratingPage: (p: number) => void;
  removeGeneratingPage: (p: number) => void;
  isPageGenerating: (p: number) => boolean;
  pushHistory: (face: ComicFace) => void;
  updateHistory: (id: string, updates: Partial<ComicFace>) => void;
}

// ======== UI Slice ========
interface UISlice {
  showApiKeyDialog: boolean;
  editingFaceId: string | null;
  regeneratingFaceId: string | null;
  showManualSettings: boolean;
  isAnalyzingPremise: boolean;
  setShowApiKeyDialog: (v: boolean) => void;
  setEditingFaceId: (v: string | null) => void;
  setRegeneratingFaceId: (v: string | null) => void;
  setShowManualSettings: (v: boolean) => void;
  setIsAnalyzingPremise: (v: boolean) => void;
  toggleManualSettings: () => void;
}

// ======== Combined Store ========
export type AppStore = CharacterSlice & ProjectSlice & GenerationSlice & UISlice & {
  resetApp: () => void;
  resetProjectSettings: () => void;
};

export const useStore = create<AppStore>()(
  persist(
    immer((set, get) => ({
      // ---- Character State ----
      hero: null,
      friend: null,
      friend2: null,
      setHero: (p) => set({ hero: p }),
      setFriend: (p) => set({ friend: p }),
      setFriend2: (p) => set({ friend2: p }),
      updateEditPrompt: (role, val) => set((state) => {
        const target = state[role];
        if (target) target.editPrompt = val;
      }),
      updateOutfit: (role, val) => set((state) => {
        const target = state[role];
        if (target) target.outfit = val;
      }),
      updateProps: (role, val) => set((state) => {
        const target = state[role];
        if (target) target.props = val;
      }),

      // ---- Project State ----
      selectedGenre: GENRES[0],
      selectedLanguage: LANGUAGES[0].code,
      customPremise: "",
      storyTone: TONES[0],
      richMode: true,
      coverTitle: "",
      coverStyle: "",
      storyTitle: "",
      selectedStylePreset: "",
      selectedTextModel: TEXT_MODELS[0].id,
      selectedImageModel: IMAGE_MODELS[0].id,
      premiseAnalysis: null,
      selectedFigurePreset: null,
      historicalPeriod: "",
      setSelectedGenre: (v) => set({ selectedGenre: v }),
      setSelectedLanguage: (v) => set({ selectedLanguage: v }),
      setCustomPremise: (v) => set({ customPremise: v }),
      setStoryTone: (v) => set({ storyTone: v }),
      setRichMode: (v) => set({ richMode: v }),
      setCoverTitle: (v) => set({ coverTitle: v }),
      setCoverStyle: (v) => set({ coverStyle: v }),
      setStoryTitle: (v) => set({ storyTitle: v }),
      setSelectedStylePreset: (v) => set({ selectedStylePreset: v }),
      setSelectedTextModel: (v) => set({ selectedTextModel: v }),
      setSelectedImageModel: (v) => set({ selectedImageModel: v }),
      setPremiseAnalysis: (v) => set({ premiseAnalysis: v }),
      setSelectedFigurePreset: (v) => set({ selectedFigurePreset: v }),
      setHistoricalPeriod: (v) => set({ historicalPeriod: v }),
      resetProjectSettings: () => set((state) => {
        state.selectedGenre = GENRES[0];
        state.selectedLanguage = LANGUAGES[0].code;
        state.customPremise = "";
        state.storyTone = TONES[0];
        state.richMode = true;
        state.coverTitle = "";
        state.coverStyle = "";
        state.storyTitle = "";
        state.selectedStylePreset = "";
        state.selectedTextModel = TEXT_MODELS[0].id;
        state.selectedImageModel = IMAGE_MODELS[0].id;
        state.premiseAnalysis = null;
        state.selectedFigurePreset = null;
        state.historicalPeriod = "";
      }),

      // ---- Generation State ----
      comicFaces: [],
      currentSheetIndex: 0,
      isStarted: false,
      showSetup: true,
      isTransitioning: false,
      analyzingStatus: "",
      generatingPages: new Set<number>(),
      history: [],
      _hasHydrated: false,
      setComicFaces: (updater) => set((state) => {
        state.comicFaces = typeof updater === 'function' ? updater(state.comicFaces) : updater;
      }),
      updateFace: (id, updates) => set((state) => {
        const face = state.comicFaces.find(f => f.id === id);
        if (face) Object.assign(face, updates);
      }),
      setCurrentSheetIndex: (v) => set((state) => {
        state.currentSheetIndex = typeof v === 'function' ? v(state.currentSheetIndex) : v;
      }),
      setIsStarted: (v) => set({ isStarted: v }),
      setShowSetup: (v) => set({ showSetup: v }),
      setIsTransitioning: (v) => set({ isTransitioning: v }),
      setAnalyzingStatus: (v) => set({ analyzingStatus: v }),
      addGeneratingPage: (p) => set((state) => { state.generatingPages.add(p); }),
      removeGeneratingPage: (p) => set((state) => { state.generatingPages.delete(p); }),
      isPageGenerating: (p) => get().generatingPages.has(p),
      pushHistory: (face) => set((state) => {
        if (!state.history.find(h => h.id === face.id)) state.history.push(face);
      }),
      updateHistory: (id, updates) => set((state) => {
        const h = state.history.find(f => f.id === id);
        if (h) Object.assign(h, updates);
      }),

      // ---- UI State ----
      showApiKeyDialog: false,
      editingFaceId: null,
      regeneratingFaceId: null,
      showManualSettings: false,
      isAnalyzingPremise: false,
      setShowApiKeyDialog: (v) => set({ showApiKeyDialog: v }),
      setEditingFaceId: (v) => set({ editingFaceId: v }),
      setRegeneratingFaceId: (v) => set({ regeneratingFaceId: v }),
      setShowManualSettings: (v) => set({ showManualSettings: v }),
      setIsAnalyzingPremise: (v) => set({ isAnalyzingPremise: v }),
      toggleManualSettings: () => set((state) => { state.showManualSettings = !state.showManualSettings; }),

      // ---- Reset ----
      resetApp: () => set((state) => {
        state.hero = null;
        state.friend = null;
        state.friend2 = null;
        state.comicFaces = [];
        state.currentSheetIndex = 0;
        state.isStarted = false;
        state.showSetup = true;
        state.isTransitioning = false;
        state.history = [];
        state.generatingPages = new Set();
        state.storyTitle = "";
        state.coverTitle = "";
        state.coverStyle = "";
        state.customPremise = "";
        state.premiseAnalysis = null;
        state.selectedFigurePreset = null;
        state.historicalPeriod = "";
        state.analyzingStatus = "";
      }),
    })),
    {
      name: 'manga-gongbang-project',
      storage: idbStorage,
      // Only persist data slices, NOT functions or transient UI state
      partialize: (state) => ({
        // Character data
        hero: state.hero,
        friend: state.friend,
        friend2: state.friend2,
        // Project settings
        selectedGenre: state.selectedGenre,
        selectedLanguage: state.selectedLanguage,
        customPremise: state.customPremise,
        storyTone: state.storyTone,
        richMode: state.richMode,
        coverTitle: state.coverTitle,
        coverStyle: state.coverStyle,
        storyTitle: state.storyTitle,
        selectedStylePreset: state.selectedStylePreset,
        selectedTextModel: state.selectedTextModel,
        selectedImageModel: state.selectedImageModel,
        premiseAnalysis: state.premiseAnalysis,
        selectedFigurePreset: state.selectedFigurePreset,
        historicalPeriod: state.historicalPeriod,
        // Generation data (completed pages only)
        // NOTE: isStarted and showSetup are intentionally NOT persisted.
        // On refresh the user always lands on the Setup screen — this prevents
        // the infinite re-generation loop that occurred when isStarted=true
        // was restored while generatingPages was empty.
        comicFaces: state.comicFaces.filter(f => !f.isLoading),
        currentSheetIndex: state.currentSheetIndex,
        history: state.history.filter(h => !h.isLoading),
      }),
      onRehydrateStorage: () => {
        return (_state, error) => {
          if (error) {
            console.warn('Failed to rehydrate from IndexedDB:', error);
          } else {
            // Reset all transient generation state so a page refresh never
            // re-triggers generation. isStarted / showSetup default to
            // false / true (defined in initial state), so the user always
            // lands on the Setup screen after refresh.
            // Validate persisted model IDs against available models
            const validTextIds = new Set(TEXT_MODELS.map(m => m.id));
            const validImageIds = new Set(IMAGE_MODELS.map(m => m.id));
            const validGenres = new Set(GENRES);
            const validTones = new Set(TONES);
            const validPresets = new Set(STYLE_PRESETS.map(p => p.name));

            useStore.setState((s) => ({
              _hasHydrated: true,
              isStarted: false,
              showSetup: true,
              isTransitioning: false,
              generatingPages: new Set<number>(),
              analyzingStatus: '',
              // Reset invalid model selections to defaults
              selectedTextModel: validTextIds.has(s.selectedTextModel) ? s.selectedTextModel : TEXT_MODELS[0].id,
              selectedImageModel: validImageIds.has(s.selectedImageModel) ? s.selectedImageModel : IMAGE_MODELS[0].id,
              // Reset invalid genre/tone/preset from old domain data
              selectedGenre: validGenres.has(s.selectedGenre) ? s.selectedGenre : GENRES[0],
              storyTone: validTones.has(s.storyTone) ? s.storyTone : TONES[0],
              selectedStylePreset: !s.selectedStylePreset || validPresets.has(s.selectedStylePreset) ? s.selectedStylePreset : '',
              selectedFigurePreset: s.selectedFigurePreset || null,
              historicalPeriod: s.historicalPeriod || "",
              // Clear any stale isLoading flags that survived serialization
              comicFaces: s.comicFaces.map(f => ({ ...f, isLoading: false })),
              history: s.history.map(h => ({ ...h, isLoading: false })),
            }));
            console.log('✅ Project restored from IndexedDB');
          }
        };
      },
    }
  )
);
