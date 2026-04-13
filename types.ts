/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export const MAX_STORY_PAGES = 10;
export const BACK_COVER_PAGE = 11;
export const TOTAL_PAGES = 11;
export const INITIAL_PAGES = 2;
export const GATE_PAGE = 2;
export const BATCH_SIZE = 6;
export const DECISION_PAGES = [3, 6, 9];

export const TEXT_MODELS = [
  { id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite (프리뷰·기본)' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (프리뷰)' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (프리뷰·고성능)' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
];

export const IMAGE_MODELS = [
  { id: 'gemini-3.1-flash-image-preview', name: 'Gemini 3.1 Flash Image (프리뷰·기본)' },
  { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro Image (프리뷰·고품질)' },
  { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image (안정)' },
];

// 🎥 2. 장르 (카테고리별)
export interface GenreGroup {
    category: string;
    items: string[];
}

export const GENRE_GROUPS: GenreGroup[] = [
    { category: "🚀 SF / 사이버펑크", items: ["스페이스 오페라", "사이버펑크 스릴러", "레트로 SF", "밀리터리 SF", "디스토피아 드라마", "유토피아 SF", "에코 SF", "다크 SF", "바이오펑크", "포스트 사이버펑크", "스페이스 웨스턴", "외계 침공", "포스트 아포칼립스", "시간 여행 모험"] },
    { category: "⚔️ 판타지", items: ["중세 판타지", "어반 판타지", "검과 마법", "다크 판타지", "영웅 판타지", "하이 판타지", "신화 기반 판타지", "동화 재해석", "판타지 코미디", "마술적 사실주의"] },
    { category: "🔍 미스터리 / 스릴러", items: ["네온 누아르 어드벤처", "초자연 미스터리", "미스터리 탐정", "하드보일드 범죄", "탐정 누아르", "법정 스릴러", "첨단 첩보물", "생존 스릴러"] },
    { category: "👻 호러", items: ["심리 호러", "코즈믹 호러", "클래식 호러", "고딕 로맨스"] },
    { category: "😂 코미디", items: ["슬랩스틱 코미디", "풍자 코미디", "로맨틱 코미디", "액션 코미디", "고전 코미디"] },
    { category: "💕 로맨스 / 드라마", items: ["가벼운 로맨스", "시대극 로맨스", "성장 드라마", "하이틴 드라마", "일상물", "정치 드라마", "의학 드라마", "스포츠 드라마", "초능력 드라마"] },
    { category: "💥 액션 / 어드벤처", items: ["스팀펑크 모험", "몬스터 어드벤처", "괴수 액션", "슈퍼히어로 액션", "전쟁 대서사시", "야생 생존", "심해 모험", "로드 무비 스타일"] },
    { category: "🎲 기타", items: ["대체 역사", "자유 설정"] },
];

export const GENRES = GENRE_GROUPS.flatMap(g => g.items);

// 🗣️ 대사 톤 (카테고리별)
export interface ToneGroup {
    category: string;
    items: string[];
}

export const TONE_GROUPS: ToneGroup[] = [
    { category: "😊 밝고 긍정적", items: ["건전하고 긍정적인", "희망차고 들뜬", "다정하고 밝은", "지나치게 낙천적인", "순수하고 아이 같은", "느긋하고 여유로운"] },
    { category: "😂 유머 / 과장", items: ["재치 있는 농담", "과장된 반응", "수다스럽고 과장된", "장난스럽고 놀리는", "허세 부리는", "슬랩스틱/과장된", "악의 없는 장난", "중2병 (드라마틱)"] },
    { category: "😎 쿨 / 강인한", items: ["짧고 강렬하게", "차갑고 직설적인", "자신감 넘치는/호탕한", "영웅적인 선언", "권위적이고 강압적인", "승리에 도취된"] },
    { category: "😰 어둡고 부정적", items: ["냉소적/비꼬는", "분노에 찬", "절망적인", "위협적인", "악당의 조롱", "히스테릭한", "비극적인 독백", "음모를 꾸미는"] },
    { category: "🤔 차분 / 이성적", items: ["자연스럽고 일상적인", "사무적/건조한", "담담하고 평범한", "분석적이고 이성적인", "관찰자적/건조한", "정중하고 격식 있는"] },
    { category: "💭 내면 / 감성", items: ["내면의 독백", "감정을 억누르는", "로맨틱한 속삭임", "철학적인", "신비롭고 모호한", "시적이고 은유적인", "우울하고 멜랑꼴리한", "직관적이고 감정적인"] },
    { category: "😬 불안 / 긴장", items: ["소심하고 조심스러운", "빠르고 정신없는", "긴박한 속삭임", "당황해서 횡설수설", "의심하고 추궁하는", "무관심한/시큰둥한", "계산적이고 차가운"] },
    { category: "📜 특수 문체", items: ["고풍스러운/옛말"] },
];

export const TONES = TONE_GROUPS.flatMap(g => g.items);

export const LANGUAGES = [
    { code: 'ko-KR', name: '한국어 (Korean)' },
    { code: 'en-US', name: '영어 (English)' },
    { code: 'ja-JP', name: '일본어 (Japanese)' },
    { code: 'es-MX', name: '스페인어 (Spanish)' },
    { code: 'fr-FR', name: '프랑스어 (French)' },
    { code: 'de-DE', name: '독일어 (German)' },
    { code: 'it-IT', name: '이탈리아어 (Italian)' },
    { code: 'zh-CN', name: '중국어 (Chinese)' },
    { code: 'ru-RU', name: '러시아어 (Russian)' },
    { code: 'pt-BR', name: '포르투갈어 (Portuguese)' }
];

export interface ComicFace {
  id: string;
  type: 'cover' | 'story' | 'back_cover';
  imageUrl?: string;
  narrative?: Beat;
  choices: string[];
  resolvedChoice?: string;
  isLoading: boolean;
  pageIndex?: number;
  isDecisionPage?: boolean;
  error?: string;
  previousImageUrl?: string;
}

export interface Beat {
  caption?: string;
  dialogue?: string;
  scene: string;
  choices: string[];
  focus_char: 'hero' | 'friend' | 'friend2' | 'other';
}

export interface Persona {
  base64: string; // The image data
  desc: string;   // The AI-analyzed text description of the visual features
  editPrompt?: string; // User supplied prompt to modify character (e.g. "wearing a hat")
  outfit?: string;     // User supplied outfit description
  props?: string;      // User supplied signature props description
}

// --- Smart Premise Analyzer Types ---

export interface CharacterProfile {
  role: 'hero' | 'friend' | 'friend2';
  name: string;
  appearance: string; // Visual description for image generation
}

export interface ScenePlanItem {
  pageNum: number;
  scene: string;
  purpose: string;
  emotionalBeat: string;
}

export interface PremiseAnalysis {
  suggestedGenre: string;
  suggestedTone: string;
  suggestedTitle: string;
  coverStyle: string;
  characterProfiles: CharacterProfile[];
  storyArc: ScenePlanItem[];
}

// --- Art Style Presets ---

export interface StylePreset {
  name: string;
  prompt: string;
  emoji: string;
  genres: string[]; // matching genre keywords
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    name: "셀 애니",
    prompt: "90s cel animation style, vibrant saturated colors, sharp clean lines, dramatic lighting",
    emoji: "🎞️",
    genres: ["학원", "액션", "로맨스", "성장", "슈퍼히어로", "스포츠"]
  },
  {
    name: "다크 누아르",
    prompt: "dark noir style, high contrast black and white with selective color, rain-soaked streets, dramatic shadows",
    emoji: "🌑",
    genres: ["누아르", "범죄", "스릴러", "하드보일드", "탐정", "법정"]
  },
  {
    name: "파스텔 수채화",
    prompt: "soft pastel watercolor illustration, gentle brushstrokes, dreamy atmosphere, warm soft lighting",
    emoji: "🎨",
    genres: ["일상", "로맨스", "로맨틱", "성장", "가벼운", "동화"]
  },
  {
    name: "사이버네온",
    prompt: "cyberpunk neon glow aesthetic, holographic UI elements, circuit patterns, futuristic cityscape",
    emoji: "💜",
    genres: ["사이버펑크", "네온", "SF", "디스토피아", "포스트", "첨단"]
  },
  {
    name: "판타지 에픽",
    prompt: "epic high fantasy painting, cinematic dramatic lighting, detailed environment, grand scale",
    emoji: "⚔️",
    genres: ["판타지", "중세", "검과", "영웅", "마법", "신화", "하이"]
  },
  {
    name: "웹툰 클린",
    prompt: "Korean webtoon style, clean crisp digital art, bright vivid colors, expressive characters",
    emoji: "📱",
    genres: ["일상물", "하이틴", "코미디", "학원"]
  },
  {
    name: "공포 하이콘",
    prompt: "horror manga style, heavy deep shadows, distorted unsettling perspectives, scratchy ink textures",
    emoji: "👁️",
    genres: ["호러", "고딕", "코즈믹", "심리", "초자연"]
  },
  {
    name: "레트로 SF",
    prompt: "retro sci-fi pulp magazine art, bold colors, dramatic action poses, vintage space age aesthetic",
    emoji: "🚀",
    genres: ["스페이스", "레트로", "밀리터리", "우주", "외계"]
  },
  {
    name: "동양화 풍",
    prompt: "East Asian ink wash painting style, sumi-e brushwork, elegant minimalism, atmospheric depth",
    emoji: "🏯",
    genres: ["시대극", "대체 역사", "전쟁", "마술적"]
  },
  {
    name: "치비 코미디",
    prompt: "chibi SD style, super-deformed cute characters, exaggerated comedic expressions, bright playful colors",
    emoji: "😆",
    genres: ["슬랩스틱", "풍자", "코미디", "판타지 코미디", "액션 코미디"]
  }
];