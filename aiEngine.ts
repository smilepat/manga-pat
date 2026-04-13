/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AI Engine — all Gemini API functions extracted from App.tsx
 */

import { GoogleGenAI } from '@google/genai';
import toast from 'react-hot-toast';
import { GENRES, TONES, LANGUAGES, STYLE_PRESETS, DECISION_PAGES, BACK_COVER_PAGE, TOTAL_PAGES, INITIAL_PAGES, BATCH_SIZE, ComicFace, Beat, PremiseAnalysis } from './types';
import { useStore } from './store';

// --- Constants ---
const MODEL_IMAGE_EDIT = "gemini-2.5-flash-image"; // Image-capable model for editing

const STORAGE_KEY = 'manga-gongbang-api-key';

function getApiKey(): string {
  return localStorage.getItem(STORAGE_KEY) || '';
}

function getAI() {
  return new GoogleGenAI({ apiKey: getApiKey() });
}

function handleAPIError(e: unknown, context = "작업") {
  console.error("API Error:", e);
  const msg = String(e);

  if (msg.includes('Requested entity was not found') || msg.includes('API_KEY_INVALID') || msg.toLowerCase().includes('permission denied')) {
    toast.error('API 키가 유효하지 않습니다. 다시 설정해주세요.');
    useStore.getState().setShowApiKeyDialog(true);
  } else if (msg.includes('429') || msg.includes('Resource has been exhausted')) {
    toast.error('API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
  } else if (msg.includes('503') || msg.includes('UNAVAILABLE')) {
    toast.error('서비스를 일시적으로 사용할 수 없습니다. 다시 시도해주세요.');
  } else if (msg.includes('network') || msg.includes('fetch')) {
    toast.error('네트워크 연결을 확인해주세요.');
  } else {
    toast.error(`${context} 실패: ${msg.slice(0, 100)}`);
  }
}

async function convertToWebP(base64: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timeout = setTimeout(() => {
      console.warn('convertToWebP: timeout — returning raw data URL');
      // On timeout, return the original data URL instead of hanging forever
      const fallback = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
      resolve(fallback);
    }, 10000);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/webp', 0.8));
      } catch (e) {
        console.warn('convertToWebP: canvas error, returning raw data URL', e);
        resolve(img.src);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      console.warn('convertToWebP: image load failed, trying alternate MIME types');
      // Gemini may return PNG, WebP, or JPEG — try PNG if JPEG failed
      if (!base64.startsWith('data:')) {
        const pngAttempt = new Image();
        pngAttempt.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = pngAttempt.width;
            canvas.height = pngAttempt.height;
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.drawImage(pngAttempt, 0, 0);
            resolve(canvas.toDataURL('image/webp', 0.8));
          } catch (e) {
            resolve(pngAttempt.src);
          }
        };
        pngAttempt.onerror = () => {
          // Last resort: try as WebP
          const webpSrc = `data:image/webp;base64,${base64}`;
          resolve(webpSrc);
        };
        pngAttempt.src = `data:image/png;base64,${base64}`;
      } else {
        // Already a data URL but failed to load — return as-is
        resolve(base64);
      }
    };

    // Try JPEG first (most common Gemini response), then fallback chain handles others
    img.src = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
  });
}

/** Strip data URL prefix so only the raw base64 bytes are sent to the Gemini API. */
function toRawBase64(dataUrlOrBase64: string): string {
  const idx = dataUrlOrBase64.indexOf(',');
  return idx !== -1 ? dataUrlOrBase64.slice(idx + 1) : dataUrlOrBase64;
}

/** Detect the MIME type from a data URL, defaulting to image/jpeg. */
function detectMime(dataUrlOrBase64: string): string {
  const match = dataUrlOrBase64.match(/^data:(image\/[a-z]+);base64,/);
  return match ? match[1] : 'image/jpeg';
}

// Model fallback map: Pro/heavy → lighter variant
const MODEL_FALLBACK: Record<string, string> = {
  'gemini-2.5-pro': 'gemini-2.5-flash',
  'gemini-2.5-flash': 'gemini-2.5-flash-lite',
  'gemini-3.1-pro-preview': 'gemini-3-flash-preview',
  'gemini-3-flash-preview': 'gemini-3.1-flash-lite-preview',
  'gemini-3-pro-image-preview': 'gemini-3.1-flash-image-preview',
  'gemini-3.1-flash-image-preview': 'gemini-2.5-flash-image',
};

function getFallbackModel(model: string): string | null {
  return MODEL_FALLBACK[model] || null;
}

async function retryOperation<T>(operation: () => Promise<T>, maxRetries = 4, baseDelay = 3000): Promise<T> {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (e: any) {
      lastError = e;
      const msg = String(e);
      const isRetryable = msg.includes('429') || msg.includes('503') || msg.includes('Resource has been exhausted') || msg.includes('UNAVAILABLE');
      if (isRetryable && i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);

        // On 503, try switching to a Flash model automatically
        if (msg.includes('503') || msg.includes('UNAVAILABLE')) {
          const state = useStore.getState();
          const fallbackText = getFallbackModel(state.selectedTextModel);
          const fallbackImage = getFallbackModel(state.selectedImageModel);
          if (fallbackText && state.selectedTextModel !== fallbackText) {
            console.warn(`⚡ Model overloaded! Auto-switching text model: ${state.selectedTextModel} → ${fallbackText}`);
            state.setSelectedTextModel(fallbackText);
          }
          if (fallbackImage && state.selectedImageModel !== fallbackImage) {
            console.warn(`⚡ Model overloaded! Auto-switching image model: ${state.selectedImageModel} → ${fallbackImage}`);
            state.setSelectedImageModel(fallbackImage);
          }
        }

        // Show retry toast
        if (i === 0) {
          toast.loading(`API가 과부하 상태입니다. 재시도 중... (${i + 1}/${maxRetries})`, { id: 'api-retry' });
        } else {
          toast.loading(`API가 과부하 상태입니다. 재시도 중... (${i + 1}/${maxRetries})`, { id: 'api-retry' });
        }

        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw e;
    }
  }
  throw lastError;
}

// ======== Character Analysis ========
// Analyzes uploaded/generated character image to create detailed visual reference for consistency
export async function analyzeCharacterImage(base64: string, role: string): Promise<string> {
  try {
    const ai = getAI();
    const prompt = `You are a character designer. Analyze this character image and create a DETAILED visual reference description that can be used to recreate this EXACT character consistently across many different scenes and poses.

Describe in 60-80 words covering ALL of these:
- HAIR: exact style (length, cut, bangs, texture), exact color (e.g. "platinum blonde with purple tips")
- EYES: shape, color, distinctive features (e.g. "sharp amber eyes with long lashes")
- FACE: skin tone, facial structure, age appearance
- BUILD: body type, height impression
- OUTFIT: specific clothing items with exact colors (e.g. "dark navy blazer over white shirt, red ribbon tie")
- SIGNATURE FEATURES: anything unique that makes this character instantly recognizable (accessories, scars, piercings, markings, glasses style, etc.)

This description will be used as a CHARACTER CONSISTENCY REFERENCE — be precise enough that another AI can reproduce this exact character.
Output ONLY the visual description, no commentary.`;
    const res = await retryOperation(() => ai.models.generateContent({
      model: useStore.getState().selectedTextModel,
      contents: { parts: [{ text: prompt }, { inlineData: { mimeType: detectMime(base64), data: toRawBase64(base64) } }] }
    }));
    return res.text?.trim() || `A distinctive ${role} character with memorable features.`;
  } catch (_e) { return `A ${role} character with unique, recognizable appearance.`; }
}

// ======== Smart Premise Analyzer ========
export async function analyzePremise() {
  const state = useStore.getState();
  if (!state.customPremise.trim()) {
    toast.error('먼저 프리미스(아이디어)를 입력해주세요.');
    return;
  }

  const key = getApiKey();
  if (!key) { state.setShowApiKeyDialog(true); return; }

  state.setIsAnalyzingPremise(true);
  toast.loading('AI가 프리미스를 분석 중입니다...', { id: 'analyze-premise' });

  try {
    const ai = getAI();
    const langName = LANGUAGES.find(l => l.code === state.selectedLanguage)?.name || "Korean";

    const prompt = `You are a manga story architect. Analyze this premise and output ONLY valid JSON:

PREMISE: "${state.customPremise}"
TARGET LANGUAGE: ${langName}

Choose ONE genre from: ${GENRES.slice(0, 20).join(' | ')}...
Choose ONE tone from: ${TONES.slice(0, 20).join(' | ')}...

JSON format:
{
  "suggestedGenre": "exact genre name from above",
  "suggestedTone": "exact tone name from above",
  "suggestedTitle": "short title in ${langName} (max 4 words)",
  "coverStyle": "visual direction for cover art (15 words, English)",
  "characterProfiles": [
    {"role": "hero", "name": "character name in target language", "appearance": "DETAILED visual description (40-60 words, English): face shape, eye color/shape, hairstyle with color, skin tone, body build, signature outfit with colors, accessories, distinguishing features (scars, tattoos, glasses, etc). Must be specific enough to recreate consistently across multiple images."},
    {"role": "friend", "name": "...", "appearance": "... (same detail level as hero)"}
  ],
  "storyArc": [
    {"pageNum": 1, "scene": "visual scene description", "purpose": "narrative purpose in ${langName}"}
  ]
}`;

    const res = await retryOperation(() => ai.models.generateContent({
      model: state.selectedTextModel, contents: prompt, config: { responseMimeType: 'application/json' }
    }));
    const parsed = JSON.parse(res.text?.replace(/```json|```/g, '').trim() || '{}') as PremiseAnalysis;

    if (!GENRES.includes(parsed.suggestedGenre)) parsed.suggestedGenre = GENRES[0];
    if (!TONES.includes(parsed.suggestedTone)) parsed.suggestedTone = TONES[0];

    state.setPremiseAnalysis(parsed);
    toast.success('프리미스 분석 완료!', { id: 'analyze-premise' });
  } catch (e) {
    handleAPIError(e, '프리미스 분석');
    toast.dismiss('analyze-premise');
  } finally {
    state.setIsAnalyzingPremise(false);
  }
}

// ======== Accept Analysis ========
export function acceptAnalysis() {
  const state = useStore.getState();
  const analysis = state.premiseAnalysis;
  if (!analysis) return;
  state.setSelectedGenre(analysis.suggestedGenre);
  state.setStoryTone(analysis.suggestedTone);
  if (analysis.suggestedTitle) state.setCoverTitle(analysis.suggestedTitle);
  if (analysis.coverStyle) state.setCoverStyle(analysis.coverStyle);
  const matchedPreset = STYLE_PRESETS.find(p => p.genres.some(g => analysis.suggestedGenre.includes(g)));
  if (matchedPreset) state.setSelectedStylePreset(matchedPreset.name);
}

// ======== Character Auto-Generation ========
export async function generateCharacterFromProfile(profile: { role: string; name: string; appearance: string }): Promise<{ base64: string; desc: string } | null> {
  const state = useStore.getState();
  try {
    const ai = getAI();

    // Get style context for consistent character generation
    const matchedPreset = STYLE_PRESETS.find(p => p.name === state.selectedStylePreset);
    const styleGuidance = matchedPreset ? matchedPreset.prompt : "clean manga style";

    // Genre/story context for character personality expression
    const genreContext = state.selectedGenre || '';
    const toneContext = state.storyTone || '';
    const premiseContext = state.customPremise?.trim()?.slice(0, 100) || '';

    const prompt = `Generate a CHARACTER REFERENCE SHEET for manga/comic production.

CHARACTER: ${profile.name} (${profile.role === 'hero' ? 'PROTAGONIST' : profile.role === 'friend' ? 'SUPPORTING CHARACTER' : 'SECONDARY CHARACTER'})
VISUAL DESCRIPTION: ${profile.appearance}
STORY CONTEXT: ${genreContext} / ${toneContext}${premiseContext ? ` — "${premiseContext}"` : ''}

REQUIREMENTS:
- Three-quarter view (3/4 angle) bust shot showing face and upper body clearly
- Simple solid-color or gradient background (NO complex backgrounds)
- ${styleGuidance} art style
- Character must have DISTINCTIVE, MEMORABLE features: unique hairstyle, expressive eyes, recognizable outfit
- Show personality through posture and expression (${profile.role === 'hero' ? 'confident, determined' : profile.role === 'friend' ? 'warm, supportive' : 'mysterious, intriguing'})
- Clean detailed line work with vibrant anime-style coloring
- The character design must be ICONIC and easily recognizable in different scenes and poses

QUALITY: Professional anime character design sheet quality. Think of character designs from top anime studios (Ufotable, MAPPA, Kyoto Animation).

NEGATIVE: No text, letters, numbers, watermarks, signatures, logos, or multiple characters. Single character illustration ONLY.`;

    const res = await retryOperation(() => ai.models.generateContent({
      model: state.selectedImageModel,
      contents: prompt,
      config: { responseModalities: ['IMAGE', 'TEXT'], imageConfig: { aspectRatio: '1:1' } }
    }));
    const imagePart = res.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data);
    const imageData = imagePart?.inlineData?.data;
    const mimeType = imagePart?.inlineData?.mimeType;
    if (imageData) {
      const dataUrl = mimeType ? `data:${mimeType};base64,${imageData}` : imageData;
      const webpBase64 = await convertToWebP(dataUrl);

      // Re-analyze the generated image for detailed visual description
      // This ensures the desc matches the ACTUAL generated appearance, not just the prompt
      const detailedDesc = await analyzeCharacterImage(webpBase64, profile.role);
      return { base64: webpBase64, desc: detailedDesc };
    }
    return null;
  } catch (e) {
    handleAPIError(e, '캐릭터 생성');
    return null;
  }
}

// ======== Title Generation ========
async function generateTitle(): Promise<string> {
  const state = useStore.getState();
  if (state.coverTitle.trim()) return state.coverTitle;

  const langName = LANGUAGES.find(l => l.code === state.selectedLanguage)?.name || "Korean";
  const storyContext = state.customPremise?.trim()
    ? `STORY PREMISE: ${state.customPremise}`
    : `GENRE: ${state.selectedGenre}`;
  const heroContext = state.hero ? ` HERO: ${state.hero.desc}.` : '';
  const prompt = `Create a creative, short comic book title (Max 5 words). CONTEXT: ${storyContext}.${heroContext} TARGET LANGUAGE: ${langName}. Output ONLY the title text, no quotes.`;

  try {
    const ai = getAI();
    const res = await retryOperation(() => ai.models.generateContent({ model: useStore.getState().selectedTextModel, contents: prompt }));
    return res.text?.trim().replace(/^["'""'']/g, '').replace(/["'""'']$/g, '') || state.selectedGenre;
  } catch (e) {
    handleAPIError(e, '제목 생성');
    return state.customPremise?.trim()?.slice(0, 20) || state.selectedGenre;
  }
}

// ======== Beat Generation ========
// Generates story beat with visual scene description, dialogue, and choices
export async function generateBeat(pageNum: number, isDecisionPage: boolean): Promise<Beat> {
  const state = useStore.getState();
  if (!state.hero) throw new Error("No Hero");

  const langName = LANGUAGES.find(l => l.code === state.selectedLanguage)?.name || "Korean";

  // Build concise story context
  const premiseContext = state.customPremise?.trim() || state.selectedGenre;

  // Get previous story flow (last 5 pages for richer context)
  const recentHistory = state.history
    .filter(p => p.type === 'story' && p.narrative && (p.pageIndex || 0) < pageNum)
    .sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0))
    .slice(-5);

  const historyContext = recentHistory.length > 0
    ? recentHistory.map(h => {
        const n = h.narrative;
        const parts = [`P${h.pageIndex}`];
        if (h.resolvedChoice) parts.push(`[CHOICE: ${h.resolvedChoice}]`);
        if (n?.scene) parts.push(`Scene: ${n.scene.slice(0, 40)}`);
        if (n?.dialogue) parts.push(`Dialogue: "${n.dialogue.slice(0, 40)}"`);
        if (n?.caption) parts.push(`Caption: "${n.caption.slice(0, 30)}"`);
        return parts.join(' | ');
      }).join('\n')
    : "Beginning";

  // Character reference (consistent across all generations)
  const buildCharRef = (p: { desc: string; outfit?: string; props?: string; editPrompt?: string } | null, label: string) => {
    if (!p) return `${label}: (none)`;
    const base = `${label}: ${p.desc}`;
    const extras = [p.outfit, p.props, p.editPrompt].filter(Boolean).join(', ');
    return extras ? `${base} [${extras}]` : base;
  };

  const charRefs = [
    buildCharRef(state.hero, 'Hero'),
    state.friend ? buildCharRef(state.friend, 'Friend') : null,
    state.friend2 ? buildCharRef(state.friend2, 'Extra') : null
  ].filter(Boolean).join(' | ');

  // Collect previous scenes AND dialogues to enforce variety
  const previousPages = state.comicFaces
    .filter(f => f.type === 'story' && f.narrative)
    .sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0));

  const previousSceneDescs = previousPages
    .map(f => `P${f.pageIndex}: ${f.narrative!.scene.slice(0, 50)}`);

  const previousDialogues = previousPages
    .filter(f => f.narrative?.dialogue)
    .map(f => `P${f.pageIndex}: "${f.narrative!.dialogue!.slice(0, 50)}"`);

  const avoidRepeatBlock = previousSceneDescs.length > 0
    ? `\nPREVIOUS SCENES (DO NOT repeat similar visuals):\n${previousSceneDescs.join('\n')}\n\nYou MUST create a visually DISTINCT scene — different location, different action, different character pose, different time of day or lighting.`
    : '';

  const avoidDialogueBlock = previousDialogues.length > 0
    ? `\nPREVIOUS DIALOGUES (DO NOT repeat or paraphrase these lines):\n${previousDialogues.join('\n')}\n\nEach page MUST have COMPLETELY NEW dialogue that advances the story. Characters should say something they haven't said before — new information, new emotions, new reactions.`
    : '';

  const prompt = `You are a manga storyteller. Generate PAGE ${pageNum} in ${langName}.

STORY CORE: ${premiseContext}
PREVIOUS STORY FLOW:
${historyContext}
CHARACTERS: ${charRefs}
TONE: ${state.storyTone}
PAGE TYPE: ${isDecisionPage ? 'CHOICE POINT - create suspense with 2 options' : 'NARRATIVE PROGRESSION'}
${avoidRepeatBlock}
${avoidDialogueBlock}

OUTPUT JSON ONLY:
{
  "scene": "visual scene description in English (30-50 words) - describe SPECIFIC action, character INTERACTION (who looks at whom, body language, gestures), background environment, lighting direction, and camera angle. Characters must NOT face the camera — they should look at each other, at objects, or away. Each page MUST show a different moment. NO text mentions.",
  "caption": "narration text in ${langName} (optional, leave empty if not needed) — must be NEW narration, not repeated from previous pages",
  "dialogue": "character dialogue in ${langName} — must be a FRESH line that moves the story forward. Never repeat or rephrase previous dialogue.",
  "focus_char": "hero | friend | friend2 | other",
  "choices": ${isDecisionPage ? '["option 1", "option 2"]' : '[]'}
}

CRITICAL RULES:
1. The scene must be SPECIFIC and UNIQUE — no generic descriptions.
2. Dialogue must ADVANCE the plot — each line reveals new information, emotion, or conflict.
3. NEVER repeat dialogue from previous pages, even paraphrased.
4. If a page has no meaningful dialogue, leave the dialogue field EMPTY rather than forcing repetitive lines.`;

  try {
    const ai = getAI();
    const res = await retryOperation(() => ai.models.generateContent({
      model: state.selectedTextModel, contents: prompt, config: { responseMimeType: 'application/json' }
    }));
    const parsed = JSON.parse(res.text?.replace(/```json|```/g, '').trim() || "{}");

    // Ensure choices exist for decision pages
    if (isDecisionPage && (!parsed.choices || parsed.choices.length === 0)) {
      parsed.choices = ["계속 진행하기", "다른 경로 선택"];
    }

    return parsed as Beat;
  } catch (e) {
    handleAPIError(e, '스토리 생성');
    return { scene: "A dramatic scene unfolds.", focus_char: 'hero', choices: isDecisionPage ? ["계속하기", "피하기"] : [] };
  }
}

// ======== Anime-Style Composition System ========

const CAMERA_ANGLES = [
  "wide establishing shot from above, showing environment and characters in context",
  "close-up two-shot: characters facing each other in profile, tension between them",
  "medium shot at eye level, characters positioned at different depths in the frame",
  "low angle looking up at character, dramatic perspective showing determination",
  "over-the-shoulder view: one character seen from behind the other's shoulder",
  "bird's eye view from directly above, showing spatial relationship between characters",
  "dutch angle tilted composition, creating visual unease or energy",
  "extreme close-up on eyes/expression, capturing raw emotion — NO front-facing stare",
  "side profile silhouette, characters looking toward the horizon or at each other",
  "three-quarter back view with depth, character looking away from camera into the scene",
  "worm's eye view from ground level, dramatic upward framing",
  "split-panel composition: left side shows one character, right side shows another reacting",
];

// Character gaze/interaction patterns — prevents static front-facing poses
const CHARACTER_INTERACTIONS = [
  "Characters face EACH OTHER in conversation, NOT the camera. Show natural eye contact between them.",
  "Main character looks DOWN at something important, lost in thought — three-quarter profile view.",
  "Characters stand SIDE BY SIDE looking at the same direction, shared gaze toward a distant object.",
  "One character in foreground (back to camera), facing another character who is reacting.",
  "Character turns AWAY from camera, looking over shoulder — dynamic manga pose.",
  "Two characters at different heights (one sitting, one standing), looking at each other.",
  "Character mid-action: running, reaching, fighting — body in motion, NOT posing for camera.",
  "Close-up of hands or gesture while characters interact, faces partially visible.",
  "One character speaking animatedly while others listen with varied reactions.",
  "Character gazing out a window/at scenery, shown from behind or side profile.",
  "Characters walking together, captured mid-stride from a following or leading angle.",
  "Dramatic confrontation: characters facing each other from opposite sides of the frame.",
];

// Anime visual direction keywords by genre mood
function getAnimeDirection(genre: string, tone: string): string {
  const g = genre.toLowerCase();
  const t = tone.toLowerCase();

  // Tone-based mood modifier
  const moodMod = t.includes('어둡') || t.includes('절망') || t.includes('비극') ? ' Use muted, somber color palette.'
    : t.includes('밝') || t.includes('긍정') || t.includes('희망') ? ' Use warm, uplifting color palette.'
    : t.includes('긴장') || t.includes('긴박') || t.includes('위협') ? ' Use desaturated tones with sharp contrast.'
    : '';

  if (g.includes('sf') || g.includes('사이버') || g.includes('디스토피아'))
    return "Anime direction: dramatic neon lighting, sharp highlights, deep shadows like Ghost in the Shell or Psycho-Pass." + moodMod;
  if (g.includes('판타지') || g.includes('마법') || g.includes('검과'))
    return "Anime direction: epic fantasy lighting with volumetric rays, vivid sky colors, detailed environments like Frieren or Mushoku Tensei." + moodMod;
  if (g.includes('호러') || g.includes('고딕') || g.includes('심리'))
    return "Anime direction: oppressive shadows, desaturated palette with selective color, unsettling angles like Another or Paranoia Agent." + moodMod;
  if (g.includes('코미디') || g.includes('슬랩스틱'))
    return "Anime direction: bright saturated colors, exaggerated expressions, clean bold lines like Spy x Family or Konosuba." + moodMod;
  if (g.includes('로맨스') || g.includes('일상'))
    return "Anime direction: soft warm lighting, bokeh backgrounds, gentle color grading like Your Lie in April or Clannad." + moodMod;
  if (g.includes('액션') || g.includes('슈퍼히어로') || g.includes('격투'))
    return "Anime direction: dynamic speed lines, impact frames, high-contrast action poses like Demon Slayer or Jujutsu Kaisen." + moodMod;
  if (g.includes('스포츠'))
    return "Anime direction: kinetic motion blur, sweat/effort details, dramatic close-ups like Haikyuu or Blue Lock." + moodMod;
  if (g.includes('누아르') || g.includes('범죄') || g.includes('스릴러'))
    return "Anime direction: heavy chiaroscuro, rain/wet surfaces, moody atmosphere like 91 Days or Baccano." + moodMod;
  if (g.includes('성장') || g.includes('드라마'))
    return "Anime direction: naturalistic lighting, scenic backgrounds with emotional weight like 3-gatsu no Lion or Anohana." + moodMod;

  return "Anime direction: professional anime production quality with cinematic framing and expressive character acting." + moodMod;
}

function getCompositionDirective(pageIndex: number, previousScenes: string[], genre: string, tone: string): string {
  const angle = CAMERA_ANGLES[pageIndex % CAMERA_ANGLES.length];
  const interaction = CHARACTER_INTERACTIONS[pageIndex % CHARACTER_INTERACTIONS.length];
  const animeDir = getAnimeDirection(genre, tone);

  const avoidance = previousScenes.length > 0
    ? `\nAVOID REPEATING: Do NOT reuse these compositions — ${previousScenes.slice(-3).join('; ')}`
    : '';

  return `CAMERA/ANGLE: ${angle}.
CHARACTER DIRECTION: ${interaction}
${animeDir}
CRITICAL: Characters must NEVER stare directly at the camera like a portrait photo. They should interact with each other, the environment, or their own emotions naturally — like real anime cinematography.${avoidance}`;
}

// ======== Image Generation ========
export async function generateImage(beat: Beat, type: ComicFace['type'], pageIndex?: number): Promise<string> {
  const state = useStore.getState();
  const contents: any[] = [];

  // === Style Configuration ===
  const matchedPreset = STYLE_PRESETS.find(p => p.name === state.selectedStylePreset);
  const baseStyle = matchedPreset?.prompt || state.selectedGenre;
  const stylePrompt = `${baseStyle} manga comic art, professional quality`;

  // === Collect previous scene descriptions to avoid repetition ===
  const previousScenes = state.comicFaces
    .filter(f => f.type === 'story' && f.narrative?.scene && f.imageUrl && f.id !== `page-${pageIndex}`)
    .sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0))
    .slice(-3)
    .map(f => f.narrative!.scene.slice(0, 40));

  const currentPageIndex = pageIndex ?? state.comicFaces.filter(f => f.type === 'story').length;

  // === Character Reference Images ===
  // Only attach the character(s) relevant to this scene's focus to reduce repetitive signal
  const attachCharImage = (char: { base64: string } | null) => {
    if (char?.base64) {
      contents.push({ inlineData: { mimeType: detectMime(char.base64), data: toRawBase64(char.base64) } });
    }
  };

  if (type === 'cover' || type === 'back_cover') {
    // Cover/back: attach hero only
    attachCharImage(state.hero);
  } else {
    // Story pages: attach only the focus character + hero for consistency
    attachCharImage(state.hero);
    if (beat.focus_char === 'friend' || beat.scene?.toLowerCase().includes('friend')) {
      attachCharImage(state.friend);
    }
    if (beat.focus_char === 'friend2' || beat.scene?.toLowerCase().includes('extra')) {
      attachCharImage(state.friend2);
    }
  }

  // === Character Consistency Instructions ===
  const buildCharInstructions = () => {
    const parts: string[] = [];

    // Include detailed desc for each character to maintain visual consistency
    if (state.hero) {
      parts.push(`HERO (match reference image): ${state.hero.desc}`);
      if (state.hero.outfit || state.hero.props || state.hero.editPrompt) {
        const mods = [state.hero.outfit, state.hero.props, state.hero.editPrompt].filter(Boolean).join(', ');
        parts.push(`Hero modifications: ${mods}`);
      }
    }
    if (state.friend) {
      parts.push(`FRIEND (match reference image): ${state.friend.desc}`);
      if (state.friend.outfit || state.friend.props || state.friend.editPrompt) {
        const mods = [state.friend.outfit, state.friend.props, state.friend.editPrompt].filter(Boolean).join(', ');
        parts.push(`Friend modifications: ${mods}`);
      }
    }
    if (state.friend2) {
      parts.push(`EXTRA (match reference image): ${state.friend2.desc}`);
      if (state.friend2.outfit || state.friend2.props || state.friend2.editPrompt) {
        const mods = [state.friend2.outfit, state.friend2.props, state.friend2.editPrompt].filter(Boolean).join(', ');
        parts.push(`Extra modifications: ${mods}`);
      }
    }

    if (parts.length > 0) {
      parts.push('CHARACTER CONSISTENCY: These characters MUST look identical across all pages — same hair color/style, same eye color, same outfit unless explicitly changed.');
    }

    return parts.join('\n');
  };

  // === Unique variation seed ===
  const variationSeed = `[variation-id: ${Date.now()}-p${currentPageIndex}]`;

  // === Build Main Prompt ===
  let prompt = "";

  if (type === 'cover') {
    // COVER: Title text + hero illustration
    const title = state.coverTitle || state.storyTitle || state.selectedGenre;
    prompt = `${stylePrompt}. Create a manga/comic COVER PAGE for the title "${title}".

${buildCharInstructions()}

TITLE TEXT: Render the title "${title}" prominently at the top or center of the cover in bold, stylized lettering that matches the genre mood. The title must be clearly readable.

COMPOSITION: ${state.coverStyle || "Dynamic hero pose, centered composition, atmospheric background"}. The cover should look like a professional manga volume cover with the title integrated into the design.

NEGATIVE: No watermarks, logos, or signatures. Do NOT add any text other than the title "${title}".
${variationSeed}`;

  } else if (type === 'back_cover') {
    // BACK COVER: Visual conclusion
    prompt = `${stylePrompt}. Create an ending page illustration.

${state.hero ? buildCharInstructions() : 'Show the main character in a reflective moment.'}

MOOD: ${state.coverStyle || "Peaceful conclusion, sense of completion, warm atmosphere"}

NEGATIVE: No text, "END" labels, numbers, watermarks, or signatures.
${variationSeed}`;

  } else {
    // STORY PAGE: Scene with optional dialogue/caption
    const dialogueInstruction = beat.dialogue
      ? ` Include manga speech bubble with: "${beat.dialogue}". Style: natural bubble tail pointing to speaker.`
      : '';
    const captionInstruction = beat.caption
      ? ` Include subtle narration box (top corner) with: "${beat.caption}". Style: faint, like real manga narration.`
      : '';

    const compositionDirective = getCompositionDirective(currentPageIndex, previousScenes, state.selectedGenre, state.storyTone);

    prompt = `${stylePrompt}. PAGE ${currentPageIndex} — Illustrate this UNIQUE scene: ${beat.scene}

${buildCharInstructions()}

DIALOGUE/CAPTION:${dialogueInstruction}${captionInstruction}

${compositionDirective}

IMPORTANT: This scene must look DISTINCTLY DIFFERENT from all other pages. Characters must NEVER face the camera directly — draw them interacting with each other, looking at objects, turning away, or in mid-action. Use natural anime cinematography: over-shoulder shots, profile conversations, dynamic action poses. Vary background, poses, lighting, and color temperature.

NEGATIVE: No watermarks, signatures, or random text outside of specified speech/caption bubbles. No sound effect symbols (POW, BAM, etc).
${variationSeed}`;
  }

  // Add text prompt at the end
  contents.push({ text: prompt });

  try {
    const ai = getAI();
    const res = await retryOperation(() => ai.models.generateContent({
      model: state.selectedImageModel,
      contents: { parts: contents },
      config: { responseModalities: ['IMAGE', 'TEXT'], imageConfig: { aspectRatio: '3:4' } }
    }));

    // Search all parts for image data (some models return image in different positions)
    const imagePart = res.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inlineData?.data
    );
    const rawData = imagePart?.inlineData?.data;
    const mimeType = imagePart?.inlineData?.mimeType;

    if (rawData) {
      // Use the actual MIME type from the API response if available
      const dataUrl = mimeType
        ? `data:${mimeType};base64,${rawData}`
        : rawData;
      return await convertToWebP(dataUrl);
    }

    // Log response structure for debugging
    console.warn('generateImage: no image data in response', {
      candidateCount: res.candidates?.length,
      partTypes: res.candidates?.[0]?.content?.parts?.map((p: any) => Object.keys(p)),
      textResponse: res.text?.slice(0, 100),
    });
    return '';
  } catch (e) {
    handleAPIError(e, '이미지 생성');
    return '';
  }
}

// ======== Edit Page ========
export async function handleEditPage(base64WithMark: string, instruction: string) {
  const state = useStore.getState();
  const faceId = state.editingFaceId;
  if (!faceId) return;
  // Save previous image for undo
  const currentFace = state.comicFaces.find(f => f.id === faceId);
  const prevUrl = currentFace?.imageUrl;
  state.updateFace(faceId, { isLoading: true, previousImageUrl: prevUrl });
  state.setEditingFaceId(null);

  try {
    const ai = getAI();
    const prompt = `EDIT INSTRUCTION: ${instruction}. Focus on the RED marked area for changes. Maintain the original manga comic art style throughout.

CRITICAL: Do NOT add any new text, letters, numbers, watermarks, signatures, or logos. If the original had text/speech bubbles, preserve them naturally but do not add any new written elements.`;
    const res = await retryOperation(() => ai.models.generateContent({
      model: MODEL_IMAGE_EDIT,
      contents: { parts: [{ text: prompt }, { inlineData: { mimeType: detectMime(base64WithMark), data: toRawBase64(base64WithMark) } }] }
    }));

    const newData = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
    if (newData) {
      const webpData = await convertToWebP(newData);
      state.updateFace(faceId, { imageUrl: webpData, isLoading: false });
    } else { throw new Error("No image"); }
  } catch (e) {
    handleAPIError(e, '페이지 수정');
    state.updateFace(faceId, { isLoading: false });
  }
}

// ======== Regenerate Page ========
export async function handleRegeneratePage(updatedBeat: Beat) {
  const state = useStore.getState();
  const faceId = state.regeneratingFaceId;
  if (!faceId) return;
  // Save previous image for undo
  const currentFace = state.comicFaces.find(f => f.id === faceId);
  const prevUrl = currentFace?.imageUrl;
  state.setRegeneratingFaceId(null);
  state.updateFace(faceId, { isLoading: true, narrative: updatedBeat, previousImageUrl: prevUrl });
  state.updateHistory(faceId, { narrative: updatedBeat });

  const face = useStore.getState().comicFaces.find(f => f.id === faceId);
  const url = await generateImage(updatedBeat, 'story', face?.pageIndex);
  state.updateFace(faceId, { imageUrl: url, isLoading: false });
}

// ======== Character Handlers ========
export async function handleHeroInput(base64: string) {
  useStore.getState().setHero({ base64, desc: "분석 중..." });
  const desc = await analyzeCharacterImage(base64, "HERO");
  useStore.getState().setHero({ base64, desc });
}

export async function handleFriendInput(base64: string) {
  useStore.getState().setFriend({ base64, desc: "분석 중..." });
  const desc = await analyzeCharacterImage(base64, "CO-STAR");
  useStore.getState().setFriend({ base64, desc });
}

export async function handleFriend2Input(base64: string) {
  useStore.getState().setFriend2({ base64, desc: "분석 중..." });
  const desc = await analyzeCharacterImage(base64, "EXTRA");
  useStore.getState().setFriend2({ base64, desc });
}

// ======== Single Page Generation ========
async function generateSinglePage(faceId: string, pageNum: number, type: ComicFace['type']) {
  const state = useStore.getState();
  const isDecision = DECISION_PAGES.includes(pageNum);
  let beat: Beat = { scene: "", choices: [], focus_char: 'other' };

  if (type === 'cover') { /* cover */ }
  else if (type === 'back_cover') { beat = { scene: "Teaser", choices: [], focus_char: 'other' }; }
  else { beat = await generateBeat(pageNum, isDecision); }

  // Re-get state after async
  const s2 = useStore.getState();
  if (beat.focus_char === 'friend' && !s2.friend && type === 'story') beat.focus_char = 'hero';
  if (beat.focus_char === 'friend2' && !s2.friend2 && type === 'story') beat.focus_char = 'hero';

  s2.updateFace(faceId, { narrative: beat, choices: beat.choices, isDecisionPage: isDecision });
  s2.updateHistory(faceId, { narrative: beat, choices: beat.choices });

  const url = await generateImage(beat, type, pageNum);
  if (url) {
    useStore.getState().updateFace(faceId, { imageUrl: url, isLoading: false, error: undefined });
  } else {
    useStore.getState().updateFace(faceId, { isLoading: false, error: '이미지 생성에 실패했습니다.' });
  }
}

// ======== Batch Generation ========
export async function generateBatch(startPage: number, count: number) {
  const state = useStore.getState();
  const pagesToGen: number[] = [];
  for (let i = 0; i < count; i++) {
    const p = startPage + i;
    if (p > TOTAL_PAGES) break;
    if (state.isPageGenerating(p)) continue;
    pagesToGen.push(p);
    if (DECISION_PAGES.includes(p)) break;
  }
  if (pagesToGen.length === 0) return;
  pagesToGen.forEach(p => state.addGeneratingPage(p));

  const newFaces: ComicFace[] = pagesToGen.map(pageNum => ({
    id: `page-${pageNum}`,
    type: pageNum === BACK_COVER_PAGE ? 'back_cover' : 'story',
    choices: [], isLoading: true, pageIndex: pageNum
  }));

  const s = useStore.getState();
  s.setComicFaces((prev: ComicFace[]) => {
    const existing = new Set(prev.map(f => f.id));
    return [...prev, ...newFaces.filter(f => !existing.has(f.id))];
  });
  newFaces.forEach(f => s.pushHistory(f));

  for (const pageNum of pagesToGen) {
    await generateSinglePage(`page-${pageNum}`, pageNum, pageNum === BACK_COVER_PAGE ? 'back_cover' : 'story');
    useStore.getState().removeGeneratingPage(pageNum);
  }
}

// ======== Launch Story ========
export async function launchStory() {
  const state = useStore.getState();

  // Validate API key
  const key = getApiKey();
  if (!key) { state.setShowApiKeyDialog(true); return; }

  // Auto-generate characters if none uploaded and analysis has profiles
  if (!state.hero && state.premiseAnalysis?.characterProfiles?.length) {
    state.setAnalyzingStatus('🎭 캐릭터 자동 생성 중...');
    for (const profile of state.premiseAnalysis.characterProfiles) {
      const s = useStore.getState();
      const current = profile.role === 'hero' ? s.hero : profile.role === 'friend' ? s.friend : s.friend2;
      if (current) continue;

      const result = await generateCharacterFromProfile(profile);
      if (result) {
        if (profile.role === 'hero') s.setHero({ base64: result.base64, desc: result.desc });
        else if (profile.role === 'friend') s.setFriend({ base64: result.base64, desc: result.desc });
        else if (profile.role === 'friend2') s.setFriend2({ base64: result.base64, desc: result.desc });
      }
    }
    useStore.getState().setAnalyzingStatus('');
  }

  const s2 = useStore.getState();
  if (!s2.hero) return; // Still no hero after auto-gen
  s2.setIsTransitioning(true);
  const title = await generateTitle();
  const s3 = useStore.getState();
  if (!s3.coverTitle) s3.setCoverTitle(title);
  s3.setStoryTitle(title);
  const coverFace: ComicFace = { id: 'cover', type: 'cover', choices: [], isLoading: true, pageIndex: 0 };
  s3.setComicFaces([coverFace]);
  // Reset history via store setter
  s3.setComicFaces([coverFace]);
  useStore.setState({ history: [coverFace] });
  s3.addGeneratingPage(0);
  generateSinglePage('cover', 0, 'cover').finally(() => useStore.getState().removeGeneratingPage(0));
  setTimeout(async () => {
    const ss = useStore.getState();
    ss.setIsStarted(true);
    ss.setShowSetup(false);
    ss.setIsTransitioning(false);
    await generateBatch(1, INITIAL_PAGES);
    generateBatch(3, 3);
  }, 1500);
}

// ======== Undo Page Edit ========
export function undoPageEdit(faceId: string) {
  const state = useStore.getState();
  const face = state.comicFaces.find(f => f.id === faceId);
  if (!face?.previousImageUrl) return;
  state.updateFace(faceId, { imageUrl: face.previousImageUrl, previousImageUrl: undefined });
}

// ======== Retry Failed Page ========
export async function retryPage(faceId: string) {
  const state = useStore.getState();
  const face = state.comicFaces.find(f => f.id === faceId);
  if (!face) return;
  state.updateFace(faceId, { isLoading: true, error: undefined });
  await generateSinglePage(faceId, face.pageIndex || 0, face.type);
}

// ======== Handle Choice ========
export function handleChoice(p: number, c: string) {
  const state = useStore.getState();
  state.updateFace(`page-${p}`, { resolvedChoice: c });
  state.updateHistory(`page-${p}`, { resolvedChoice: c });
  if (p + 1 <= TOTAL_PAGES) generateBatch(p + 1, BATCH_SIZE);
}
