# 원여고 분실물 지도 — 설치 및 배포 가이드

## 1. 먼저 Firebase 콘솔에서 켜야 하는 것 (딱 한 번만)

프로젝트: `change1-b3b61` (제공해주신 설정 그대로 코드에 넣어뒀어요)

1. **Firestore Database** 만들기
   - Firebase 콘솔 → Firestore Database → "데이터베이스 만들기" → 프로덕션 모드 → 리전 선택(asia-northeast3, 서울 추천)
2. **Authentication** 켜기
   - Authentication → Sign-in method → **이메일/비밀번호** 사용 설정
   - Authentication → Sign-in method → **익명(Anonymous)** 사용 설정 (로그인 안 해도 등록 가능하게 하는 "게스트" 기능에 필요해요)
3. **보안 규칙 붙여넣기**
   - Firestore Database → 규칙(Rules) 탭 → 이 폴더의 `firestore.rules` 내용을 그대로 붙여넣고 게시(Publish)

이 세 가지를 하지 않으면 "등록"이나 "로그인"이 권한 오류로 실패합니다.

## 2. 배포하기 (택 1)

### 방법 A. Firebase Hosting (제일 간단, 추천)
```bash
npm install -g firebase-tools
firebase login
cd 이 폴더로 이동
firebase deploy --only hosting,firestore:rules
```
배포가 끝나면 `https://change1-b3b61.web.app` 같은 주소가 나옵니다. 이 주소 하나를 학생들에게 공유하면 됩니다.

### 방법 B. 다른 정적 호스팅
GitHub Pages, Netlify, Vercel 등 아무 정적 파일 호스팅에 이 폴더를 그대로 올려도 됩니다. (파일 경로 구조를 그대로 유지해주세요.)

> ⚠️ 로컬 `index.html`을 더블클릭해서 여는 방식(`file://`)은 카메라 접근, 서비스워커, Firebase 인증이 정상 동작하지 않을 수 있어요. 꼭 `https://` 로 배포하거나, 로컬 테스트 시 `npx serve .` 같은 로컬 서버로 열어주세요.

## 3. 앱처럼 설치하기 (아이폰 / 갤럭시 모두 가능)
- **아이폰(Safari)**: 사이트 접속 → 하단 공유 버튼 → "홈 화면에 추가"
- **갤럭시(Chrome)**: 사이트 접속 → 브라우저 메뉴(⋮) → "홈 화면에 추가" 또는 주소창의 설치 아이콘 클릭

홈 화면에 아이콘이 생기고, 실행하면 브라우저 주소창 없이 앱처럼 열립니다(PWA).

## 4. 실시간 공유가 되는 원리
모든 사용자의 브라우저가 같은 Firestore 데이터베이스(`items`, `users` 컬렉션)를 실시간 구독(`onSnapshot`)하고 있어서, 한 사람이 등록/주인찾음 처리를 하면 몇 초 안에 접속 중인 모든 사람 화면에 자동으로 반영됩니다. 새로고침이 필요 없습니다.

## 5. 알아두면 좋은 점 / 한계
- **로그인 없이도 등록 가능**합니다. 접속하면 자동으로 "익명 로그인"이 되어 게스트로 등록/조회가 가능하고, MY페이지에서 아이디+비밀번호로 정식 가입하면 닉네임과 누적 포인트가 저장됩니다.
- 아이디/비밀번호는 내부적으로 Firebase 인증 이메일 형식(`아이디@lostfound.app`)으로 변환되어 저장되므로, 학생들은 이메일 없이 아이디만 정하면 됩니다.
- 사진은 별도 Storage 설정 없이 리사이즈해서 Firestore 문서에 바로 저장하는 방식이라 설정이 간단하지만, 사진이 아주 많아지면 문서당 1MB 제한에 걸릴 수 있어요. 나중에 사진이 많아지면 Firebase Storage로 옮기는 걸 권장드립니다.
- 2~5층은 실제 학교 도면이 없어 업로드해주신 지도 이미지를 그대로 재사용하고 장소 이름만 층별로 다르게 넣었습니다. 실제 층별 도면 이미지가 있으면 `img/map_castle.jpg`, `img/map_blossom.jpg`를 교체하고 `app.js`의 `FLOOR_NAMES`/`POINTS` 좌표만 맞는 위치로 수정하면 됩니다.
- "주인 찾음" 처리는 현재 누구나(등록자 포함) 누를 수 있게 되어 있어요. 담당 선생님만 처리할 수 있게 제한하고 싶다면 말씀해주세요 (관리자 계정 개념을 추가하면 됩니다).
