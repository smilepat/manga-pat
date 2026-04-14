/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AI Engine — all Gemini API functions extracted from App.tsx
 */

import { GoogleGenAI } from '@google/genai';
import toast from 'react-hot-toast';
import { GENRES, TONES, LANGUAGES, STYLE_PRESETS, HISTORICAL_FIGURE_PRESETS, DECISION_PAGES, BACK_COVER_PAGE, TOTAL_PAGES, INITIAL_PAGES, BATCH_SIZE, ComicFace, Beat, PremiseAnalysis } from './types';
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
    const prompt = `You are a Korean historical costume and portrait expert. Analyze this character image and create a DETAILED visual reference description for recreating this EXACT historical figure consistently across many different scenes.

Describe in 60-80 words covering ALL of these:
- HEADWEAR/HAIR: traditional headgear (관모, 갓, 투구, 족두리 etc.), hairstyle (상투, 땋은머리 etc.), exact color
- FACE: facial structure, age appearance, skin tone, facial hair (수염) style if any, expression
- ATTIRE: specific traditional Korean clothing (한복, 관복, 갑옷, 두루마기 etc.) with exact colors and patterns, layers, sash/belt details
- BUILD: body type, stature, posture
- SIGNATURE FEATURES: distinctive accessories (부채, 검, 붓, 서책 etc.), rank insignia (흉배), unique identifiers

This description will be used as a CHARACTER CONSISTENCY REFERENCE for a Korean historical biography comic — be precise enough that another AI can reproduce this exact figure.
Output ONLY the visual description, no commentary.`;
    const res = await retryOperation(() => ai.models.generateContent({
      model: useStore.getState().selectedTextModel,
      contents: { parts: [{ text: prompt }, { inlineData: { mimeType: detectMime(base64), data: toRawBase64(base64) } }] }
    }));
    return res.text?.trim() || `A distinctive Korean historical ${role} figure in traditional attire.`;
  } catch (_e) { return `A Korean historical ${role} figure with traditional attire and dignified bearing.`; }
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
  toast.loading('역사 자료를 분석 중입니다...', { id: 'analyze-premise' });

  try {
    const ai = getAI();

    const prompt = `You are a Korean historical biography architect (한국 역사 전기 구성가). Analyze this premise about a Korean historical figure and output ONLY valid JSON.

PREMISE: "${state.customPremise}"

Choose ONE historical period/category from: ${GENRES.join(' | ')}
Choose ONE narration tone from: ${TONES.join(' | ')}

JSON format:
{
  "suggestedGenre": "exact period/category name from above list",
  "suggestedTone": "exact tone name from above list",
  "suggestedTitle": "short biography title in Korean (max 5 words, e.g. '세종, 빛을 만들다')",
  "coverStyle": "visual direction for biography cover art (15 words, English, historically appropriate)",
  "historicalPeriod": "specific era description (e.g. '조선 전기 1397-1450')",
  "educationalNote": "brief educational significance in Korean (1-2 sentences)",
  "characterProfiles": [
    {"role": "hero", "name": "historical figure name in Korean", "appearance": "DETAILED visual description (40-60 words, English): traditional Korean attire for their era and rank (한복/관복/갑옷 etc.), headwear, facial features, age, build, signature accessories. Must be historically accurate and specific enough to recreate consistently.", "historicalTitle": "official title/rank", "period": "birth-death years"},
    {"role": "friend", "name": "associated historical figure", "appearance": "... (same detail level, period-appropriate attire)", "historicalTitle": "...", "period": "..."}
  ],
  "storyArc": [
    {"pageNum": 1, "scene": "visual scene description", "purpose": "narrative purpose in Korean", "historicalEvent": "actual historical event depicted"}
  ]
}

IMPORTANT: The storyArc should follow a biographical narrative structure:
- Pages 1-2: Birth, childhood, formative experiences (출생/성장)
- Pages 3-5: Key achievements and contributions (핵심 업적)
- Pages 6-8: Trials, conflicts, pivotal decisions (시련/갈등)
- Pages 9-10: Legacy and historical significance (역사적 의의)

All character appearances MUST be historically accurate — correct period clothing, hairstyles, and accessories for their era and social status.`;

    const res = await retryOperation(() => ai.models.generateContent({
      model: state.selectedTextModel, contents: prompt, config: { responseMimeType: 'application/json' }
    }));
    const parsed = JSON.parse(res.text?.replace(/```json|```/g, '').trim() || '{}') as PremiseAnalysis;

    if (!GENRES.includes(parsed.suggestedGenre)) parsed.suggestedGenre = GENRES[0];
    if (!TONES.includes(parsed.suggestedTone)) parsed.suggestedTone = TONES[0];

    state.setPremiseAnalysis(parsed);
    toast.success('역사 분석 완료!', { id: 'analyze-premise' });
  } catch (e) {
    handleAPIError(e, '역사 분석');
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

    // Historical context for character generation
    const genreContext = state.selectedGenre || '';
    const toneContext = state.storyTone || '';
    const premiseContext = state.customPremise?.trim()?.slice(0, 100) || '';

    const prompt = `Generate a HISTORICAL FIGURE CHARACTER PORTRAIT for a Korean biography comic.

CHARACTER: ${profile.name} (${profile.role === 'hero' ? '주인공 위인' : profile.role === 'friend' ? '관련 인물' : '부차적 인물'})
VISUAL DESCRIPTION: ${profile.appearance}
HISTORICAL CONTEXT: ${genreContext} / ${toneContext}${premiseContext ? ` — "${premiseContext}"` : ''}

REQUIREMENTS:
- Three-quarter view (3/4 angle) bust shot showing face and upper body clearly
- Simple solid-color or gradient background (NO complex backgrounds)
- ${styleGuidance} art style
- Character must wear HISTORICALLY ACCURATE Korean traditional attire for their era and rank
- Traditional Korean headwear appropriate to their status (관모, 갓, 투구, 비녀 etc.)
- Period-appropriate hairstyle (상투 for male officials, traditional styles for women)
- Show dignity and character through posture and expression (${profile.role === 'hero' ? 'dignified, determined leader' : profile.role === 'friend' ? 'loyal, capable ally' : 'distinctive supporting figure'})
- Detailed rendering of traditional clothing patterns, fabrics, and accessories
- The character design must be RECOGNIZABLE and consistent across different historical scenes

QUALITY: Professional historical illustration quality. Think of Korean historical drama (사극) character design or educational biography illustration.

NEGATIVE: No text, letters, numbers, watermarks, signatures, logos, or multiple characters. No modern clothing or accessories. No anachronistic elements. Single character illustration ONLY.`;

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

  const storyContext = state.customPremise?.trim()
    ? `전기 소재: ${state.customPremise}`
    : `시대: ${state.selectedGenre}`;
  const heroContext = state.hero ? ` 위인: ${state.hero.desc}.` : '';
  const prompt = `Create a creative, short Korean biography comic title (Max 5 words in Korean). Format: "인물명, 업적/상징" (e.g. "세종, 빛을 만들다", "이순신, 바다의 벽이 되다"). CONTEXT: ${storyContext}.${heroContext} Output ONLY the title text in Korean, no quotes.`;

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

  // Determine biographical phase based on page position
  const bioPhase = pageNum <= 2 ? '출생/성장기 — childhood, education, formative experiences'
    : pageNum <= 5 ? '핵심 업적기 — key achievements, contributions, breakthroughs'
    : pageNum <= 8 ? '시련/갈등기 — trials, conflicts, pivotal challenges'
    : '역사적 의의 — legacy, impact, lasting significance';

  const prompt = `You are a Korean historical biography storyteller (한국 역사 전기 서술가). Generate PAGE ${pageNum} in Korean.

BIOGRAPHY SUBJECT: ${premiseContext}
HISTORICAL PERIOD: ${state.selectedGenre}
BIOGRAPHICAL PHASE: ${bioPhase}
PREVIOUS STORY FLOW:
${historyContext}
CHARACTERS: ${charRefs}
NARRATION TONE: ${state.storyTone}
PAGE TYPE: ${isDecisionPage ? '역사적 분기점 (HISTORICAL TURNING POINT) — a real pivotal decision the historical figure faced, with 2 historically plausible paths' : 'NARRATIVE PROGRESSION'}
${avoidRepeatBlock}
${avoidDialogueBlock}

OUTPUT JSON ONLY:
{
  "scene": "visual scene description in English (30-50 words) - describe SPECIFIC historical scene with accurate period setting (Korean traditional architecture, landscapes, clothing). Show character INTERACTION in historically appropriate context (court audience, battle, scholarly discussion, ceremony). Characters must NOT face the camera. Include period-accurate environment details. NO modern elements, NO anachronisms.",
  "caption": "narration text in Korean (optional, leave empty if not needed) — educational narration providing historical context. Must be NEW narration, not repeated from previous pages.",
  "dialogue": "character dialogue in Korean — period-appropriate speech reflecting the character's social status and era. Must be a FRESH line that advances the biographical narrative. Never repeat or rephrase previous dialogue.",
  "focus_char": "hero | friend | friend2 | other",
  "choices": ${isDecisionPage ? '["historically plausible option 1 in Korean", "historically plausible option 2 in Korean"]' : '[]'}
}

CRITICAL RULES:
1. HISTORICAL ACCURACY: All scenes, dialogue, and settings must be appropriate to the Korean historical period. No anachronisms.
2. The scene must be SPECIFIC and UNIQUE — show an actual historical moment or plausible biographical event.
3. Dialogue must reflect the character's era, social status, and personality — use appropriate speech levels (존댓말/반말).
4. NEVER repeat dialogue from previous pages, even paraphrased.
5. ${isDecisionPage ? 'The choices must represent REAL historical dilemmas the figure faced — not fictional branching.' : 'Each page should reveal a new aspect of the historical figure and their character.'}
6. If a page has no meaningful dialogue, leave the dialogue field EMPTY rather than forcing repetitive lines.`;

  try {
    const ai = getAI();
    const res = await retryOperation(() => ai.models.generateContent({
      model: state.selectedTextModel, contents: prompt, config: { responseMimeType: 'application/json' }
    }));
    const parsed = JSON.parse(res.text?.replace(/```json|```/g, '').trim() || "{}");

    // Ensure choices exist for decision pages
    if (isDecisionPage && (!parsed.choices || parsed.choices.length === 0)) {
      parsed.choices = ["역경에 맞서다", "다른 길을 모색하다"];
    }

    return parsed as Beat;
  } catch (e) {
    handleAPIError(e, '역사 서술 생성');
    return { scene: "A pivotal moment in Korean history unfolds in a traditional setting.", focus_char: 'hero', choices: isDecisionPage ? ["역경에 맞서다", "다른 길을 모색하다"] : [] };
  }
}

// ======== Historical Composition System ========

const CAMERA_ANGLES = [
  "wide panoramic establishing shot showing Korean traditional architecture (기와지붕, 궁궐, 한옥) with characters in historical context",
  "formal portrait composition in 3/4 view, similar to Korean traditional portraiture (초상화), dignified pose showing rank and status",
  "medium shot at eye level, characters in traditional Korean interior (대청마루, 서재) with period-accurate furnishings",
  "low angle looking up at historical figure, dramatic sky behind, conveying authority and determination",
  "over-the-shoulder view: one figure seen from behind another's shoulder during formal audience or discussion",
  "elevated bird's eye perspective reminiscent of court documentary painting (의궤), showing ceremonial arrangement",
  "close-up on hands performing significant historical action (writing with 붓, wielding sword, operating instrument)",
  "extreme close-up on face/expression capturing pivotal emotional moment — three-quarter profile view",
  "side profile silhouette against Korean landscape (산, 강, 들판), contemplative or decisive moment",
  "three-quarter back view with depth, figure looking out toward vast Korean scenery, reflecting on destiny",
  "ground-level view from courtyard showing grand scale of Korean palace or fortress architecture",
  "split composition: left side shows one historical figure, right side shows another reacting across formal space",
];

// Historical interaction patterns — period-appropriate character dynamics
const CHARACTER_INTERACTIONS = [
  "Historical figures face EACH OTHER in formal Korean discussion, proper seated posture (정좌) or standing audience.",
  "Main figure studies documents or inventions intently, three-quarter profile, scholarly concentration.",
  "Figures stand SIDE BY SIDE surveying a battlefield, landscape, or construction — shared gaze toward their vision.",
  "One figure in foreground (back to viewer), formally addressing another figure who listens with respect or defiance.",
  "Figure turns from a window or balcony, looking over shoulder — moment of decision or revelation.",
  "Two figures at different heights reflecting status (왕 on throne, 신하 bowing; 스승 standing, 제자 seated).",
  "Figure in dynamic historical action: commanding troops, practicing calligraphy, conducting experiment — purposeful motion.",
  "Close-up of hands performing period craft (writing 한글, forging metal, mixing medicine) with faces partially visible.",
  "One figure passionately arguing a position while court officials or colleagues show varied reactions.",
  "Figure gazing at stars, maps, or the horizon from a traditional Korean setting, shown from behind or side.",
  "Figures walking together through historical Korean scenery (궁궐 회랑, 시장, 산길), captured mid-stride.",
  "Dramatic confrontation: figures facing each other across a formal court space or battlefield.",
];

// Historical visual direction by period and tone
function getHistoricalDirection(genre: string, tone: string): string {
  const g = genre.toLowerCase();
  const t = tone.toLowerCase();

  // Tone-based mood modifier
  const moodMod = t.includes('비장') || t.includes('갈등') || t.includes('비극') ? ' Use muted, somber color palette with dramatic shadows.'
    : t.includes('따뜻') || t.includes('일화') || t.includes('우정') ? ' Use warm, golden color palette with soft natural lighting.'
    : t.includes('전쟁') || t.includes('긴장') || t.includes('대립') ? ' Use desaturated earth tones with sharp contrast and smoky atmosphere.'
    : t.includes('교육') || t.includes('객관') || t.includes('설명') ? ' Use clear, balanced lighting with precise detail rendering.'
    : '';

  if (g.includes('고구려') || g.includes('백제') || g.includes('신라') || g.includes('가야') || g.includes('삼국'))
    return "Historical direction: Ancient Korean Three Kingdoms aesthetic — earthen fortress walls, iron armor and weapons, tomb mural (고분벽화) color palette, bold warrior compositions, nature-integrated wooden architecture." + moodMod;
  if (g.includes('발해') || g.includes('고려') || g.includes('몽골'))
    return "Historical direction: Goryeo dynasty aesthetic — celadon (청자) blue-green tones, Buddhist temple atmosphere, elegant court culture, ornate architectural details, refined silk garments." + moodMod;
  if (g.includes('조선 건국') || g.includes('세종') || g.includes('사림') || g.includes('과학') || g.includes('성리학'))
    return "Historical direction: Early Joseon aesthetic — Confucian scholarly atmosphere, clean hanbok lines, serene palace gardens, ink-wash landscape influence, dignified formal compositions." + moodMod;
  if (g.includes('임진') || g.includes('병자') || g.includes('영정조') || g.includes('실학') || g.includes('민란'))
    return "Historical direction: Late Joseon aesthetic — vibrant folk culture (민화) colors, bustling marketplace scenes, scholarly retreats, dynamic historical drama atmosphere." + moodMod;
  if (g.includes('개화') || g.includes('독립') || g.includes('항일') || g.includes('해외') || g.includes('문화 독립'))
    return "Historical direction: Early modern Korean aesthetic — newspaper illustration style, sepia tones with selective color, Western-Korean fusion architecture, revolutionary determination atmosphere." + moodMod;
  if (g.includes('건국') || g.includes('6.25') || g.includes('산업') || g.includes('민주') || g.includes('과학기술') || g.includes('문화예술'))
    return "Historical direction: Modern Korean aesthetic — documentary photography influence, urban development imagery, contrast between tradition and modernity, hopeful nation-building atmosphere." + moodMod;

  return "Historical direction: Professional Korean historical illustration quality with cinematic framing, period-accurate costumes, and dignified character presentation." + moodMod;
}

function getCompositionDirective(pageIndex: number, previousScenes: string[], genre: string, tone: string): string {
  const angle = CAMERA_ANGLES[pageIndex % CAMERA_ANGLES.length];
  const interaction = CHARACTER_INTERACTIONS[pageIndex % CHARACTER_INTERACTIONS.length];
  const historicalDir = getHistoricalDirection(genre, tone);

  const avoidance = previousScenes.length > 0
    ? `\nAVOID REPEATING: Do NOT reuse these compositions — ${previousScenes.slice(-3).join('; ')}`
    : '';

  return `CAMERA/ANGLE: ${angle}.
CHARACTER DIRECTION: ${interaction}
${historicalDir}
CRITICAL: Characters must NEVER stare directly at the camera. They should interact with each other, the historical environment, or be captured in natural moments of action and contemplation — like Korean historical drama (사극) cinematography.${avoidance}`;
}

// ======== Image Generation ========
export async function generateImage(beat: Beat, type: ComicFace['type'], pageIndex?: number): Promise<string> {
  const state = useStore.getState();
  const contents: any[] = [];

  // === Style Configuration ===
  const matchedPreset = STYLE_PRESETS.find(p => p.name === state.selectedStylePreset);
  const baseStyle = matchedPreset?.prompt || state.selectedGenre;
  const stylePrompt = `${baseStyle} Korean historical biography illustration, historically accurate, professional quality`;

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
      parts.push(`MAIN HISTORICAL FIGURE (match reference image): ${state.hero.desc}`);
      if (state.hero.outfit || state.hero.props || state.hero.editPrompt) {
        const mods = [state.hero.outfit, state.hero.props, state.hero.editPrompt].filter(Boolean).join(', ');
        parts.push(`Figure modifications: ${mods}`);
      }
    }
    if (state.friend) {
      parts.push(`ASSOCIATED FIGURE 1 (match reference image): ${state.friend.desc}`);
      if (state.friend.outfit || state.friend.props || state.friend.editPrompt) {
        const mods = [state.friend.outfit, state.friend.props, state.friend.editPrompt].filter(Boolean).join(', ');
        parts.push(`Associated figure 1 modifications: ${mods}`);
      }
    }
    if (state.friend2) {
      parts.push(`ASSOCIATED FIGURE 2 (match reference image): ${state.friend2.desc}`);
      if (state.friend2.outfit || state.friend2.props || state.friend2.editPrompt) {
        const mods = [state.friend2.outfit, state.friend2.props, state.friend2.editPrompt].filter(Boolean).join(', ');
        parts.push(`Associated figure 2 modifications: ${mods}`);
      }
    }

    if (parts.length > 0) {
      parts.push('CHARACTER CONSISTENCY: These historical figures MUST look identical across all pages — same facial features, same traditional attire, same accessories unless the narrative explicitly changes their appearance (e.g., aging, changing rank).');
    }

    return parts.join('\n');
  };

  // === Unique variation seed ===
  const variationSeed = `[variation-id: ${Date.now()}-p${currentPageIndex}]`;

  // === Build Main Prompt ===
  let prompt = "";

  if (type === 'cover') {
    // COVER: Title text + historical figure illustration
    const title = state.coverTitle || state.storyTitle || state.selectedGenre;
    prompt = `${stylePrompt}. Create a Korean historical biography comic COVER PAGE for the title "${title}".

${buildCharInstructions()}

TITLE TEXT: Render the title "${title}" prominently at the top or center of the cover in bold, stylized Korean calligraphy-inspired lettering. The title must be clearly readable.

COMPOSITION: ${state.coverStyle || "Dignified historical figure pose, centered composition, period-appropriate atmospheric background with Korean traditional architecture or landscape"}. The cover should convey the gravitas of a historical biography with the figure in period-accurate attire.

NEGATIVE: No watermarks, logos, or signatures. No modern elements. No anachronistic objects. Do NOT add any text other than the title "${title}".
${variationSeed}`;

  } else if (type === 'back_cover') {
    // BACK COVER: Historical legacy illustration
    prompt = `${stylePrompt}. Create a biography epilogue illustration showing the historical figure's lasting legacy.

${state.hero ? buildCharInstructions() : 'Show the main historical figure in a reflective, dignified moment.'}

MOOD: ${state.coverStyle || "Legacy and remembrance, sense of historical significance, golden hour atmosphere with Korean landscape"}. Show symbols of the figure's lasting contribution to Korean history.

NEGATIVE: No text, "END" labels, numbers, watermarks, or signatures. No modern elements.
${variationSeed}`;

  } else {
    // STORY PAGE: Historical scene with optional dialogue/caption
    const dialogueInstruction = beat.dialogue
      ? ` Include speech bubble with: "${beat.dialogue}". Style: natural bubble tail pointing to speaker, clean and readable.`
      : '';
    const captionInstruction = beat.caption
      ? ` Include subtle narration box (top corner) with: "${beat.caption}". Style: elegant, like historical narration.`
      : '';

    const compositionDirective = getCompositionDirective(currentPageIndex, previousScenes, state.selectedGenre, state.storyTone);

    prompt = `${stylePrompt}. PAGE ${currentPageIndex} — Illustrate this UNIQUE historical scene: ${beat.scene}

${buildCharInstructions()}

DIALOGUE/CAPTION:${dialogueInstruction}${captionInstruction}

${compositionDirective}

HISTORICAL ACCURACY: All depicted clothing, architecture, tools, furniture, and customs MUST be appropriate to the specific Korean historical period. No anachronistic elements (no modern objects, no out-of-era clothing).

IMPORTANT: This scene must look DISTINCTLY DIFFERENT from all other pages. Characters must NEVER face the camera directly — draw them interacting with each other, the historical environment, or captured in natural moments. Use Korean historical drama (사극) cinematography: formal audiences, battlefield tactics, scholarly discussions, ceremonial scenes. Vary background, poses, lighting, and composition.

NEGATIVE: No watermarks, signatures, or random text outside of specified speech/caption bubbles. No modern objects. No Japanese or Chinese elements unless historically documented in the Korean context.
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
    const prompt = `EDIT INSTRUCTION: ${instruction}. Focus on the RED marked area for changes. Maintain the original historical illustration art style throughout. Ensure historical accuracy — all clothing, objects, and architecture must remain period-appropriate for Korean history.

CRITICAL: Do NOT add any new text, letters, numbers, watermarks, signatures, or logos. If the original had text/speech bubbles, preserve them naturally but do not add any new written elements. No modern or anachronistic elements.`;
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
  const desc = await analyzeCharacterImage(base64, "위인(주인공)");
  useStore.getState().setHero({ base64, desc });
}

export async function handleFriendInput(base64: string) {
  useStore.getState().setFriend({ base64, desc: "분석 중..." });
  const desc = await analyzeCharacterImage(base64, "관련인물1");
  useStore.getState().setFriend({ base64, desc });
}

export async function handleFriend2Input(base64: string) {
  useStore.getState().setFriend2({ base64, desc: "분석 중..." });
  const desc = await analyzeCharacterImage(base64, "관련인물2");
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
    state.setAnalyzingStatus('📜 역사 인물 자동 생성 중...');
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

// ======== Apply Historical Figure Preset ========
export function applyFigurePreset(presetName: string) {
  const preset = HISTORICAL_FIGURE_PRESETS.find(p => p.name === presetName);
  if (!preset) return;
  const state = useStore.getState();
  state.setSelectedFigurePreset(preset.name);
  state.setCustomPremise(preset.premise);
  state.setSelectedGenre(preset.period);
  state.setStoryTone(preset.tone);
  state.setCoverTitle(preset.coverTitle);
  state.setSelectedStylePreset(preset.stylePreset);
  state.setHistoricalPeriod(preset.title);
  state.setPremiseAnalysis({
    suggestedGenre: preset.period,
    suggestedTone: preset.tone,
    suggestedTitle: preset.coverTitle,
    coverStyle: `Historical biography cover for ${preset.name} — dignified portrait with period-appropriate setting`,
    characterProfiles: preset.characters,
    storyArc: [],
    historicalPeriod: preset.title,
    educationalNote: `${preset.name}의 일대기를 담은 전기 만화`,
  });
}
