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

// 📜 역사 시대/카테고리
export interface GenreGroup {
    category: string;
    items: string[];
}

export const GENRE_GROUPS: GenreGroup[] = [
    { category: "⚔️ 삼국시대 (57 BC - 668)", items: ["고구려 영웅담", "백제 문화 전성기", "신라 통일 전쟁", "가야 철의 왕국", "삼국 외교전"] },
    { category: "🏛️ 남북국/고려 (698-1392)", items: ["발해 해동성국", "고려 건국", "고려 문화 융성", "몽골 항쟁", "고려 불교와 예술"] },
    { category: "📚 조선 전기 (1392-1592)", items: ["조선 건국과 개혁", "세종 시대 문화혁명", "사림과 훈구의 대립", "조선 과학과 발명", "성리학과 사회제도"] },
    { category: "🔥 조선 후기 (1592-1897)", items: ["임진왜란 영웅", "병자호란과 굴욕", "영정조 르네상스", "실학과 개혁사상", "민란과 저항"] },
    { category: "🇰🇷 구한말/일제강점기 (1897-1945)", items: ["개화와 근대화", "독립운동", "의병과 항일투쟁", "문화 독립운동", "해외 독립운동"] },
    { category: "🌏 현대 (1945-)", items: ["건국과 분단", "6.25 전쟁 영웅", "산업화와 민주화", "과학기술 선구자", "문화예술 개척자"] },
];

export const GENRES = GENRE_GROUPS.flatMap(g => g.items);

// 🗣️ 전기 서술 톤 (카테고리별)
export interface ToneGroup {
    category: string;
    items: string[];
}

export const TONE_GROUPS: ToneGroup[] = [
    { category: "📖 교육적 서술", items: ["객관적 역사 서술", "교과서적 설명체", "다큐멘터리 나레이션"] },
    { category: "🎭 극적 서사", items: ["영웅 서사시", "비장한 결의", "역경 극복 서사", "역사적 대전환"] },
    { category: "💭 내면 묘사", items: ["인물 독백", "고뇌와 번민", "꿈과 이상", "철학적 성찰"] },
    { category: "👥 인간적 면모", items: ["따뜻한 일화", "스승과 제자", "가족과 우정", "유머와 재치"] },
    { category: "⚔️ 긴장/갈등", items: ["전쟁과 전투", "정치적 대립", "시대적 모순", "운명적 선택"] },
    { category: "🌅 시대 분위기", items: ["고풍스러운 옛말", "격식체 사극", "근대 계몽체", "현대 회고체"] },
];

export const TONES = TONE_GROUPS.flatMap(g => g.items);

export const LANGUAGES = [
    { code: 'ko-KR', name: '한국어 (Korean)' },
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
  base64: string;
  desc: string;
  editPrompt?: string;
  outfit?: string;
  props?: string;
}

// --- 역사 전기 분석 타입 ---

export interface CharacterProfile {
  role: 'hero' | 'friend' | 'friend2';
  name: string;
  appearance: string;
  historicalTitle?: string;
  period?: string;
  historicalContext?: string;
}

export interface ScenePlanItem {
  pageNum: number;
  scene: string;
  purpose: string;
  emotionalBeat: string;
  historicalEvent?: string;
}

export interface PremiseAnalysis {
  suggestedGenre: string;
  suggestedTone: string;
  suggestedTitle: string;
  coverStyle: string;
  characterProfiles: CharacterProfile[];
  storyArc: ScenePlanItem[];
  historicalPeriod?: string;
  educationalNote?: string;
}

// --- 한국 역사 화풍 프리셋 ---

export interface StylePreset {
  name: string;
  prompt: string;
  emoji: string;
  genres: string[];
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    name: "수묵화 풍",
    prompt: "Traditional Korean ink wash painting (수묵화), elegant brushstrokes, atmospheric mountain landscapes, flowing robes, calligraphic details, muted earth tones with dramatic black ink accents",
    emoji: "🖌️",
    genres: ["고구려", "백제", "신라", "가야", "삼국", "발해"]
  },
  {
    name: "민화 스타일",
    prompt: "Korean folk painting (민화) style, vibrant saturated colors, decorative patterns, symbolic animals and plants, flat perspective, bold outlines, festive and auspicious atmosphere",
    emoji: "🎨",
    genres: ["문화", "예술", "불교", "융성", "전성기"]
  },
  {
    name: "조선 문인화",
    prompt: "Joseon literati painting style, refined delicate brushwork, scholarly atmosphere, pine trees and bamboo, restrained elegant composition, subtle ink gradations, contemplative mood",
    emoji: "📜",
    genres: ["성리학", "사림", "세종", "과학", "실학", "개혁"]
  },
  {
    name: "궁중 기록화",
    prompt: "Korean royal court documentary painting (의궤) style, detailed figures in formal hanbok, ceremonial scenes, bird's eye perspective, meticulous costume details, rich gold and vermilion accents",
    emoji: "👑",
    genres: ["건국", "제도", "사회", "문화혁명", "르네상스"]
  },
  {
    name: "근현대 흑백",
    prompt: "Early 20th century Korean illustration, black and white with selective sepia tones, newspaper engraving style, dramatic contrast, documentary photography influence, gritty realistic textures",
    emoji: "📰",
    genres: ["개화", "근대화", "독립", "항일", "일제", "해외"]
  },
  {
    name: "전쟁 기록화",
    prompt: "Korean war documentary illustration, dramatic battlefield scenes, dynamic action composition, heroic poses, muted earth tones with dramatic sky, smoke and fire effects, emotional intensity",
    emoji: "⚔️",
    genres: ["전쟁", "임진왜란", "병자호란", "몽골", "항쟁", "6.25", "의병"]
  },
  {
    name: "교육 만화",
    prompt: "Korean educational comic (학습만화) style, clean precise lines, clear character designs, informative panels with historical accuracy, bright approachable colors, detailed period costumes",
    emoji: "📚",
    genres: ["과학", "발명", "교육", "선구자", "개척자"]
  },
  {
    name: "사극 시네마",
    prompt: "Korean historical drama (사극) cinematic style, rich costume details, atmospheric golden hour lighting, dramatic poses, film grain texture, wide cinematic composition, deep depth of field",
    emoji: "🎬",
    genres: ["영웅", "서사", "극적", "대립", "굴욕", "저항", "민란"]
  },
  {
    name: "현대 그래픽노블",
    prompt: "Modern Korean graphic novel style, detailed realistic art, dramatic panel composition, contemporary illustration technique, sophisticated color palette, strong visual storytelling",
    emoji: "📖",
    genres: ["현대", "산업화", "민주화", "건국", "분단"]
  },
  {
    name: "동양화 파노라마",
    prompt: "Panoramic East Asian landscape painting, vast Korean mountain ranges, mist and clouds, tiny human figures in grand nature, meditative atmosphere, traditional Korean architecture nestled in scenery",
    emoji: "🏔️",
    genres: ["해동성국", "고려", "통일", "외교", "철의"]
  }
];

// --- 위인 프리셋 ---

export interface HistoricalFigurePreset {
  name: string;
  title: string;
  period: string;
  premise: string;
  coverTitle: string;
  tone: string;
  stylePreset: string;
  characters: CharacterProfile[];
  emoji: string;
}

export const HISTORICAL_FIGURE_PRESETS: HistoricalFigurePreset[] = [
  {
    name: "세종대왕",
    title: "조선 제4대 왕 (1397-1450)",
    period: "세종 시대 문화혁명",
    premise: "충녕대군으로 태어나 왕위에 오른 세종이 한글 창제, 과학 기술 발전, 영토 확장 등 위대한 업적을 이루기까지의 이야기. 집현전 학자들과의 협력, 훈민정음 반대 세력과의 갈등을 담는다.",
    coverTitle: "세종, 빛을 만들다",
    tone: "영웅 서사시",
    stylePreset: "궁중 기록화",
    characters: [
      { role: 'hero', name: '세종', appearance: '익선관을 쓰고 곤룡포를 입은 위엄 있는 중년 왕, 온화하면서도 총명한 눈빛, 풍성한 수염', historicalTitle: '조선 제4대 왕', period: '조선 전기 (1397-1450)' },
      { role: 'friend', name: '장영실', appearance: '소박한 관복 차림의 중년 남성, 호기심 가득한 눈빛, 손에 기구를 들고 있는 발명가', historicalTitle: '조선 과학자', period: '조선 전기 (?-?)' },
      { role: 'friend2', name: '최만리', appearance: '사모관대를 갖춘 엄격한 표정의 노년 문신, 긴 수염, 반대 상소를 들고 있는 보수적 학자', historicalTitle: '집현전 부제학', period: '조선 전기 (?-1445)' },
    ],
    emoji: "👑"
  },
  {
    name: "이순신",
    title: "충무공 (1545-1598)",
    period: "임진왜란 영웅",
    premise: "무과에 급제한 후 임진왜란에서 조선을 구한 충무공 이순신의 일대기. 거북선 건조, 23전 23승 신화, 그리고 노량해전에서의 최후를 그린다.",
    coverTitle: "이순신, 바다의 벽이 되다",
    tone: "비장한 결의",
    stylePreset: "전쟁 기록화",
    characters: [
      { role: 'hero', name: '이순신', appearance: '두정갑을 입고 투구를 쓴 근엄한 장군, 강인한 체격, 결의에 찬 눈빛, 장검을 차고 있음', historicalTitle: '삼도수군통제사', period: '조선 (1545-1598)' },
      { role: 'friend', name: '류성룡', appearance: '사모관대를 갖춘 문관, 지적이고 차분한 인상, 이순신을 천거한 명재상', historicalTitle: '영의정', period: '조선 (1542-1607)' },
      { role: 'friend2', name: '원균', appearance: '갑옷 차림의 다소 오만한 표정의 장군, 이순신과 대비되는 인물', historicalTitle: '경상우수사', period: '조선 (1540-1597)' },
    ],
    emoji: "⚓"
  },
  {
    name: "유관순",
    title: "독립운동가 (1902-1920)",
    period: "독립운동",
    premise: "충남 천안에서 태어나 이화학당에서 수학하던 유관순이 3.1운동에 참여하고 아우내 장터 만세운동을 이끌기까지의 이야기. 어린 나이에 조국의 독립을 위해 목숨을 바친 불꽃 같은 삶.",
    coverTitle: "유관순, 꺾이지 않는 불꽃",
    tone: "역경 극복 서사",
    stylePreset: "근현대 흑백",
    characters: [
      { role: 'hero', name: '유관순', appearance: '이화학당 교복을 입은 당찬 표정의 젊은 여성, 단정한 단발머리, 강인하면서도 순수한 눈빛', historicalTitle: '독립운동가', period: '일제강점기 (1902-1920)' },
      { role: 'friend', name: '김복순', appearance: '이화학당 교복의 동급생, 유관순의 동지이자 친구', historicalTitle: '이화학당 학생', period: '일제강점기' },
      { role: 'friend2', name: '프랭크 스코필드', appearance: '양복 차림의 서양인 선교사, 안경을 쓴 인자한 중년, 3.1운동을 세계에 알린 인물', historicalTitle: '선교사/독립운동 조력자', period: '일제강점기 (1889-1970)' },
    ],
    emoji: "🔥"
  },
  {
    name: "장영실",
    title: "조선 과학자 (?-?)",
    period: "조선 과학과 발명",
    premise: "노비 출신에서 조선 최고의 과학자가 된 장영실. 세종의 인재 등용 정책 아래 자격루, 혼천의, 측우기 등을 발명하며 조선의 과학 기술을 비약적으로 발전시킨 이야기.",
    coverTitle: "장영실, 하늘을 읽다",
    tone: "역경 극복 서사",
    stylePreset: "조선 문인화",
    characters: [
      { role: 'hero', name: '장영실', appearance: '소박한 관복의 중년 남성, 호기심과 집중력이 느껴지는 눈빛, 손에 천문 기구를 들고 있음', historicalTitle: '상의원 별좌', period: '조선 전기' },
      { role: 'friend', name: '세종', appearance: '곤룡포를 입은 인자한 왕, 장영실의 재능을 알아본 현명한 군주', historicalTitle: '조선 제4대 왕', period: '조선 전기 (1397-1450)' },
      { role: 'friend2', name: '이천', appearance: '관복 차림의 문신, 장영실과 함께 과학 발명에 참여한 기술관료', historicalTitle: '공조참판', period: '조선 전기' },
    ],
    emoji: "🔭"
  },
  {
    name: "김유신",
    title: "삼국통일 장군 (595-673)",
    period: "신라 통일 전쟁",
    premise: "가야 왕족의 후예로 신라에서 태어나 삼국통일의 핵심 인물이 된 김유신 장군의 파란만장한 인생. 화랑 시절부터 백제·고구려 정벌, 당나라와의 외교전까지.",
    coverTitle: "김유신, 세 나라를 하나로",
    tone: "영웅 서사시",
    stylePreset: "수묵화 풍",
    characters: [
      { role: 'hero', name: '김유신', appearance: '신라 갑옷을 입은 위풍당당한 장군, 투구 아래 날카로운 눈빛, 장검을 들고 말 위에 선 모습', historicalTitle: '태대각간', period: '삼국시대 (595-673)' },
      { role: 'friend', name: '김춘추', appearance: '신라 왕족의 화려한 의복, 외교적 지혜가 느껴지는 세련된 인상의 청년', historicalTitle: '신라 제29대 왕 (태종무열왕)', period: '삼국시대 (604-661)' },
      { role: 'friend2', name: '관창', appearance: '화랑도 복장의 젊은 전사, 결연한 표정, 16세의 어린 나이지만 용맹한 기상', historicalTitle: '화랑', period: '삼국시대 (645-660)' },
    ],
    emoji: "🗡️"
  },
  {
    name: "신사임당",
    title: "조선 예술가 (1504-1551)",
    period: "세종 시대 문화혁명",
    premise: "강릉에서 태어나 뛰어난 예술적 재능과 학식으로 조선 최고의 여성 예술가로 인정받은 신사임당의 이야기. 시·서·화에 두루 능통했던 천재 예술가이자 율곡 이이의 어머니.",
    coverTitle: "신사임당, 붓끝에 담은 세상",
    tone: "철학적 성찰",
    stylePreset: "조선 문인화",
    characters: [
      { role: 'hero', name: '신사임당', appearance: '단정한 한복을 입은 품격 있는 중년 여성, 지적이고 차분한 눈빛, 붓을 들고 그림을 그리는 모습', historicalTitle: '예술가/학자', period: '조선 전기 (1504-1551)' },
      { role: 'friend', name: '이원수', appearance: '소박한 관복의 선비, 신사임당의 남편으로 아내의 재능을 존중하는 온화한 인물', historicalTitle: '수운판관', period: '조선 전기 (1501-1561)' },
      { role: 'friend2', name: '율곡 이이', appearance: '총명한 눈빛의 어린 소년에서 학자로 성장하는 모습, 어머니의 가르침을 받는 자세', historicalTitle: '조선 대학자', period: '조선 (1536-1584)' },
    ],
    emoji: "🎨"
  },
  {
    name: "안중근",
    title: "독립운동가 (1879-1910)",
    period: "의병과 항일투쟁",
    premise: "의병 활동에서 이토 히로부미 저격까지, 조국의 독립을 위해 목숨을 바친 안중근 의사의 일대기. 동양 평화론을 주창한 사상가이자 행동하는 지식인의 삶.",
    coverTitle: "안중근, 동양 평화를 쏘다",
    tone: "비장한 결의",
    stylePreset: "근현대 흑백",
    characters: [
      { role: 'hero', name: '안중근', appearance: '양복 차림의 당당한 청년, 단지동맹으로 약지가 잘린 왼손, 강렬하고 결의에 찬 눈빛', historicalTitle: '독립운동가/의병장', period: '구한말 (1879-1910)' },
      { role: 'friend', name: '우덕순', appearance: '거사 동지, 양복 차림의 진지한 표정의 청년', historicalTitle: '독립운동가', period: '구한말' },
      { role: 'friend2', name: '이토 히로부미', appearance: '서양식 정장과 모자의 일본 정치인, 교활한 인상, 한국 침략의 원흉', historicalTitle: '일본 초대 통감', period: '구한말 (1841-1909)' },
    ],
    emoji: "✊"
  },
  {
    name: "광개토대왕",
    title: "고구려 제19대 왕 (374-413)",
    period: "고구려 영웅담",
    premise: "18세에 고구려 왕위에 올라 동아시아 최대 영토를 정복한 광개토대왕의 정복 전쟁과 통치 이야기. 만주와 한반도에 걸친 대제국을 건설한 정복 군주의 웅장한 서사.",
    coverTitle: "광개토, 대륙을 품다",
    tone: "영웅 서사시",
    stylePreset: "수묵화 풍",
    characters: [
      { role: 'hero', name: '광개토대왕', appearance: '고구려식 금관과 찰갑을 입은 젊고 패기 넘치는 왕, 말 위에서 활을 들고 있는 정복자의 위엄', historicalTitle: '고구려 제19대 왕', period: '삼국시대 (374-413)' },
      { role: 'friend', name: '을지문덕', appearance: '고구려 장군 복장의 지략가, 침착하고 냉정한 눈빛의 백전노장', historicalTitle: '고구려 장군', period: '삼국시대' },
      { role: 'friend2', name: '장수왕', appearance: '왕자 복장의 어린 소년, 아버지의 위업을 이어받을 총명한 후계자', historicalTitle: '고구려 제20대 왕', period: '삼국시대 (394-491)' },
    ],
    emoji: "🦅"
  },
  {
    name: "정약용",
    title: "실학자 (1762-1836)",
    period: "실학과 개혁사상",
    premise: "정조의 총애를 받은 실학자 정약용이 18년 유배 생활 속에서 500권의 저술을 완성하고 조선 개혁을 꿈꾼 이야기. 수원 화성 설계, 목민심서 집필 등 학문과 실천의 삶.",
    coverTitle: "정약용, 유배지에서 꿈꾸다",
    tone: "철학적 성찰",
    stylePreset: "조선 문인화",
    characters: [
      { role: 'hero', name: '정약용', appearance: '소박한 유배복 또는 관복의 학자, 깊은 사색에 잠긴 총명한 눈빛, 붓과 서책에 둘러싸인 모습', historicalTitle: '실학자/목민관', period: '조선 후기 (1762-1836)' },
      { role: 'friend', name: '정조', appearance: '곤룡포를 입은 개혁적인 왕, 학문을 사랑하는 지적인 인상, 정약용을 아끼는 모습', historicalTitle: '조선 제22대 왕', period: '조선 후기 (1752-1800)' },
      { role: 'friend2', name: '정약전', appearance: '유배지에서 소박한 복장의 학자, 형제간의 유대가 느껴지는 온화한 인물', historicalTitle: '실학자 (자산어보 저자)', period: '조선 후기 (1758-1816)' },
    ],
    emoji: "📝"
  },
  {
    name: "김구",
    title: "대한민국 임시정부 주석 (1876-1949)",
    period: "해외 독립운동",
    premise: "동학농민운동부터 대한민국 임시정부 주석까지, 평생을 조국 독립에 바친 김구 선생의 일대기. 백범일지에 담긴 고난과 투쟁, 그리고 통일 조국의 꿈.",
    coverTitle: "김구, 나의 소원은 대한독립",
    tone: "역경 극복 서사",
    stylePreset: "근현대 흑백",
    characters: [
      { role: 'hero', name: '김구', appearance: '두루마기 또는 양복 차림의 노년 독립운동가, 인자하면서도 단호한 눈빛, 흰 머리카락과 수염', historicalTitle: '대한민국 임시정부 주석', period: '구한말-현대 (1876-1949)' },
      { role: 'friend', name: '윤봉길', appearance: '양복에 도시락 폭탄을 든 결의에 찬 청년, 거사 직전의 비장한 모습', historicalTitle: '독립운동가', period: '일제강점기 (1908-1932)' },
      { role: 'friend2', name: '이봉창', appearance: '양복 차림의 단정한 청년, 일왕 저격 거사를 결심한 비장한 표정', historicalTitle: '독립운동가', period: '일제강점기 (1900-1932)' },
    ],
    emoji: "🕊️"
  },
];
