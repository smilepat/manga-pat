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

### API 키 처리 — 두 가지 선택지

배포자가 키 처리 방식을 선택할 수 있습니다.

#### 옵션 A — 사용자 직접 입력 (기본, 권장)

아무 환경 변수도 설정하지 않으면 앱 첫 실행 시 [ApiKeyDialog.tsx](ApiKeyDialog.tsx)가 표시되고 사용자가 본인의 [Gemini API 키](https://aistudio.google.com/apikey)를 입력합니다. 키는 사용자 브라우저의 localStorage에만 저장되며 서버나 빌드 산출물에 포함되지 않습니다.

- ✅ 공개 배포에 안전
- ✅ 키 사용 비용을 사용자가 부담
- ⚠️ 사용자가 키를 발급받는 단계를 거쳐야 함

#### 옵션 B — 배포자가 키 주입 (내부/개인용)

[.env.example](.env.example)을 `.env.local`로 복사하고 `GEMINI_API_KEY`(또는 `VITE_GEMINI_API_KEY`)를 설정한 뒤 빌드하면, 키 입력 다이얼로그가 표시되지 않고 주입된 키로 바로 동작합니다. Vercel을 쓴다면 대시보드 → Settings → Environment Variables에 동일하게 등록하면 됩니다 — 두 이름 모두 [vite.config.ts](vite.config.ts)에서 인식합니다.

```bash
cp .env.example .env.local
# .env.local 편집: GEMINI_API_KEY=AIzaSy... 주석 해제 및 값 입력
npm run build
```

우선순위: 사용자가 다이얼로그로 본인 키를 입력하면 localStorage에 저장된 그 키가 항상 우선됩니다. 즉 옵션 B로 배포해도 사용자는 자기 키로 덮어쓸 수 있습니다 ([useApiKey.ts:35-46](useApiKey.ts#L35-L46), [aiEngine.ts:18-21](aiEngine.ts#L18-L21)).

- ⚠️ **보안 경고**: Vite의 `define` 옵션이 이 키를 빌드 시 JS 번들에 평문으로 인라인합니다. 배포된 사이트의 소스를 보는 누구나 키를 추출할 수 있으니, 본인/내부 배포에만 사용하고 [Google Cloud 콘솔](https://console.cloud.google.com/apis/credentials)에서 해당 키에 **HTTP referrer 제한**을 반드시 거세요.
- ✅ 사용자가 키 입력 단계 없이 바로 사용 가능
- ❌ 키 사용 비용을 배포자가 부담

## 운영 가이드 (Operations)

현재 프로덕션에 적용된 보안 구성과 검증/조정 방법.

### 활성 구성

| 항목 | 값 |
|------|-----|
| Production URL | [manga-pat.vercel.app](https://manga-pat.vercel.app) |
| Vercel 프로젝트 | `prompt-improvement-dm-pat/manga-pat` |
| GCP 프로젝트 | `gen-lang-client-0081580267` (project number: `452237528328`) |
| API 키 UID | `469659c4-c4be-4318-bad5-799e5c1074a6` |
| 키 displayName | `Gemini API Key` |

### 3중 방어선

1. **API target 제한** → `generativelanguage.googleapis.com` 만 허용 (다른 Google API로 전용 불가)
2. **HTTP referrer 제한** → `https://manga-pat.vercel.app/*`, `https://*.vercel.app/*` 만 허용
3. **일일 요청 캡** → 모델당 500/일 (`generate_requests_per_model_per_day` consumer override)

### 현재 상태 확인 (CLI)

```powershell
# gcloud 경로 (Windows)
$env:PATH = "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin;$env:PATH"

# 1. API 키 제한 확인
gcloud services api-keys describe 469659c4-c4be-4318-bad5-799e5c1074a6 `
  --project=gen-lang-client-0081580267 `
  --format="json(displayName,restrictions)"

# 2. 일일 캡 확인 (500/d 적용 여부)
$token = gcloud auth print-access-token
Invoke-RestMethod `
  -Uri "https://serviceusage.googleapis.com/v1beta1/projects/452237528328/services/generativelanguage.googleapis.com/consumerQuotaMetrics/generativelanguage.googleapis.com%2Fgenerate_requests_per_model_per_day" `
  -Headers @{Authorization="Bearer $token"} |
  Select-Object -ExpandProperty consumerQuotaLimits |
  ForEach-Object { $_.quotaBuckets } |
  Where-Object consumerOverride |
  Select-Object @{n='dims';e={$_.dimensions}}, @{n='override';e={$_.consumerOverride.overrideValue}}
```

### 캡 조정

```powershell
# 일일 캡 변경 (예: 500 → 1000)
$token = gcloud auth print-access-token
Invoke-RestMethod `
  -Uri "https://serviceusage.googleapis.com/v1beta1/projects/452237528328/services/generativelanguage.googleapis.com/consumerQuotaMetrics/generativelanguage.googleapis.com%2Fgenerate_requests_per_model_per_day/limits/%2Fd%2Fmodel%2Fproject/consumerOverrides?force=true" `
  -Method POST -Headers @{Authorization="Bearer $token";"Content-Type"="application/json"} `
  -Body '{"overrideValue":"1000","dimensions":{}}'
```

또는 [Cloud Console Quotas](https://console.cloud.google.com/iam-admin/quotas?project=gen-lang-client-0081580267)에서 GUI로 조정.

### Referrer 추가 (예: 커스텀 도메인 연결 후)

```powershell
gcloud services api-keys update 469659c4-c4be-4318-bad5-799e5c1074a6 `
  --project=gen-lang-client-0081580267 `
  --allowed-referrers="https://manga-pat.vercel.app/*,https://*.vercel.app/*,https://your-domain.com/*" `
  --api-target=service=generativelanguage.googleapis.com
```

### 키 노출/유출 시 즉시 조치

1. **새 키 발급**: [Cloud Credentials](https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0081580267)에서 Create credentials → API key → 동일 제한 적용
2. **Vercel 환경변수 갱신**: Vercel Dashboard → Settings → Environment Variables → `GEMINI_API_KEY` 값 교체
3. **재배포**: `npx vercel --prod` (cloud build 시 새 키 인라인)
4. **옛 키 삭제**: 새 키 동작 확인 후 옛 키 삭제

### 비용 모니터링

- [Cloud Billing Reports](https://console.cloud.google.com/billing) — 일일/월별 사용량
- [Generative Language API 메트릭](https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/metrics?project=gen-lang-client-0081580267) — 실시간 호출 수
- 일일 캡에 가까워지면 위 페이지에서 그래프 확인 후 캡 상향 또는 사용 패턴 점검
