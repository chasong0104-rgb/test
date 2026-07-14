# 원여고 분실물 지도 — Supabase 버전

학교 분실물을 지도에서 찾고 등록하는 웹앱(PWA). 백엔드는 **Supabase**(PostgreSQL + Auth + Realtime)를 사용합니다.

## 기술 구성
- **프론트엔드**: 순수 HTML/CSS/JS (빌드 도구 없음), PWA
- **백엔드**: Supabase
  - DB: `items`(분실물), `profiles`(회원·포인트)
  - 인증: 아이디+비밀번호 (내부적으로 `아이디@lostfound.app` 이메일로 변환)
  - 실시간: Supabase Realtime 구독으로 등록/변경이 모든 접속자에게 자동 반영

## 설정 값 (이미 코드에 반영됨)
`supabase-config.js` 안에 프로젝트 URL과 공개(publishable) 키가 들어 있습니다.
- Project URL: `https://qytspnzohmraaqfhxbcr.supabase.co`
- Publishable key(`sb_publishable_...`): 클라이언트에 노출돼도 되는 값이며, 실제 데이터 보호는 서버의 **RLS(행 수준 보안) 정책**이 담당합니다.

## Supabase 쪽에 이미 구성된 것 (마이그레이션으로 자동 적용됨)
- 테이블 `items`, `profiles` + 인덱스
- **RLS 정책**
  - 분실물: 누구나 조회 가능 / 게스트·회원 모두 등록 가능 / 내용 변조 불가
  - 프로필: 누구나 조회, 본인 것만 수정
- **트리거**
  - 회원가입 시 프로필 자동 생성
  - **로그인 사용자가 분실물을 등록하면 자동 +10P 적립**
- **함수** `mark_item_found(item_id)` — "주인찾음" 처리 전용 (상태/포인트만 변경)
- 인증: 이메일 자동 확인(autoconfirm) ON — 내부 이메일이라 즉시 로그인됨

## 배포 (정적 호스팅 아무거나)
빌드가 필요 없는 순수 정적 파일이라, 이 폴더를 그대로 올리면 됩니다.
- **GitHub Pages / Netlify / Vercel / Cloudflare Pages** 등 어디든 가능
- 파일 경로 구조를 그대로 유지하세요.

> ⚠️ 로컬 `index.html`을 더블클릭(`file://`)하면 카메라·서비스워커·인증이 정상 동작하지 않을 수 있어요. `https://`로 배포하거나, 로컬 테스트는 `npx serve .` 같은 로컬 서버로 여세요.

## 앱처럼 설치 (PWA)
- **아이폰(Safari)**: 공유 버튼 → "홈 화면에 추가"
- **갤럭시(Chrome)**: 메뉴(⋮) → "홈 화면에 추가"

## 알아두면 좋은 점 / 한계
- **로그인 없이도 조회·등록 가능**합니다(게스트). MY페이지에서 아이디+비밀번호로 가입하면 닉네임과 누적 포인트가 저장되고, 등록 시 +10P가 적립됩니다.
- 사진은 리사이즈해서 DB에 base64로 바로 저장합니다(설정 간단). 사진이 아주 많아지면 나중에 Supabase Storage로 옮기는 걸 권장합니다.
- "주인찾음" 처리는 현재 누구나 누를 수 있습니다. 담당 선생님만 처리하게 제한하려면 관리자 역할을 추가하면 됩니다.
- 2~5층은 업로드된 지도 이미지를 재사용하고 장소 이름만 층별로 다르게 넣었습니다. 실제 도면이 있으면 `img/map_castle.jpg`, `img/map_blossom.jpg`를 교체하고 `app.js`의 `FLOOR_NAMES`/`POINTS`를 맞추면 됩니다.

## 보안 메모
- Supabase **액세스 토큰(`sbp_...`)** 은 절대 이 저장소에 커밋하지 마세요. (MCP 설정용이며 앱 코드에는 필요 없습니다.)
- 공개 키(`sb_publishable_...`)는 커밋해도 됩니다.
