<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 위인전 공방 — AI 역사 전기 만화

대한민국 위인의 일생을 Gemini AI로 만화 형식으로 자동 생성하는 Vite + React 애플리케이션입니다.

View your app in AI Studio: https://ai.studio/apps/drive/1HIQM05s7Web-JuWBx3YbzBlJjzlk1m2s

## 로컬 실행

**전제 조건:** Node.js 18+ 권장

1. 의존성 설치: `npm install`
2. 개발 서버 실행: `npm run dev` (기본 포트 3000)
3. 앱 첫 화면의 다이얼로그에서 본인의 [Gemini API 키](https://aistudio.google.com/apikey)를 입력합니다. 키는 브라우저(IndexedDB)에만 저장되며 서버로 전송되지 않습니다.

## 프로덕션 빌드

```bash
npm run build      # dist/ 디렉터리에 정적 파일 생성
npm run preview    # 로컬에서 빌드 결과 미리보기
```

## Vercel 배포

이 프로젝트는 정적 SPA로 빌드되며 [vercel.json](vercel.json)에 빌드 설정이 포함되어 있습니다. Gemini API 키는 사용자가 앱 내에서 직접 입력하므로 **빌드 시 환경 변수가 필요하지 않습니다.**

### 옵션 A — Vercel CLI

```bash
npm install -g vercel
vercel login        # 최초 1회
vercel              # 프리뷰 배포
vercel --prod       # 프로덕션 배포
```

첫 실행 시 프로젝트 연결을 묻는 프롬프트가 나옵니다. Framework는 자동으로 **Vite**로 감지됩니다.

### 옵션 B — GitHub 연동 (권장)

1. 이 저장소를 GitHub에 푸시합니다.
2. [vercel.com/new](https://vercel.com/new)에서 저장소를 import합니다.
3. 별도 설정 없이 **Deploy**를 클릭하면 [vercel.json](vercel.json)의 설정으로 자동 배포됩니다.
4. 이후 `master` 브랜치에 푸시할 때마다 자동 재배포됩니다.

### 빌드 설정 (자동 감지됨)

| 항목 | 값 |
|------|-----|
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

### API 키 처리

이 앱은 **클라이언트 측에서 사용자가 직접 키를 입력**하는 구조입니다 ([useApiKey.ts](useApiKey.ts), [ApiKeyDialog.tsx](ApiKeyDialog.tsx)). 따라서:

- Vercel 환경 변수에 `GEMINI_API_KEY`를 설정할 필요가 없습니다.
- 정적 SPA 특성상 빌드 시 주입된 키는 브라우저에 노출되므로 현재 방식이 더 안전합니다.
