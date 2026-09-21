# GT 겨울여정 — 2027 GT 겨울수련회 안내 앱

수련회 정보(일정, 오시는 길, 준비물, 조 편성, 공지사항, 사진, 비상연락처)를 한 앱에 모은 정적 웹앱입니다.
빌드 도구 없이 순수 HTML/CSS/JS로만 되어 있어서 GitHub Pages로 바로 배포할 수 있고,
사진 공유는 Firebase(Firestore + Storage)를 사용합니다.

## 폴더 구조

```
index.html          앱의 뼈대 (거의 수정할 일 없음)
css/style.css        디자인/레이아웃
js/data.js            ★ 내용 수정은 여기서 — 일정, 장소, 준비물, 공지 등 모든 텍스트
js/firebase-config.js ★ 사진 공유 기능을 켜려면 여기에 Firebase 값 입력
js/app.js             렌더링 로직 (평소엔 건드릴 필요 없음)
manifest.json         홈 화면에 추가했을 때 쓰이는 앱 이름/아이콘 설정
```

## 1. 내용 수정하기

`js/data.js` 파일 하나만 열어서 값을 바꾸면 됩니다. 예시:

```js
meta: {
  dateLabel: "2027.01.15(금) – 01.17(일) · 2박 3일",
  venueLabel: "실제 수양관 이름",
  ...
},
```

일정, 조 편성, 준비물, 공지사항, FAQ, 연락처도 모두 같은 파일 안에 배열로 되어 있어서
항목을 복사해서 늘리거나 지우면 됩니다. 저장 후 GitHub에 커밋 → 푸시하면
몇 분 내로 실제 사이트에 반영됩니다.

## 2. GitHub Pages로 배포하기

1. GitHub에서 새 저장소를 만듭니다 (예: `gt-winter-retreat`).
2. 이 폴더의 파일 전체를 저장소에 푸시합니다.
   ```bash
   git init
   git add .
   git commit -m "GT 겨울여정 초기 버전"
   git branch -M main
   git remote add origin https://github.com/<계정명>/<저장소명>.git
   git push -u origin main
   ```
3. GitHub 저장소 페이지 → **Settings → Pages**로 이동합니다.
4. **Source**를 `Deploy from a branch`로, **Branch**를 `main` / `/ (root)`로 설정하고 저장합니다.
5. 1~2분 후 `https://<계정명>.github.io/<저장소명>/` 주소로 접속하면 앱이 보입니다.

이후 내용을 바꾸고 싶을 때는 `js/data.js`만 수정해서 다시 커밋·푸시하면 됩니다.

## 3. 사진 공유 기능 켜기 (Firebase)

지금은 `js/firebase-config.js`가 비어 있어서 "사진" 탭에 안내 문구만 나옵니다.
아래 순서대로 하면 실제로 사진을 올리고 실시간으로 볼 수 있게 됩니다.

### 3-1. Firebase 프로젝트 만들기
1. https://console.firebase.google.com 접속 → **프로젝트 추가**
2. 프로젝트 이름 입력 (예: `gt-winter-retreat`) 후 생성 (Google Analytics는 꺼도 무방)

### 3-2. 웹 앱 등록 + 설정값 가져오기
1. 프로젝트 개요 화면에서 **웹 아이콘(`</>`)** 클릭
2. 앱 닉네임 입력 후 **앱 등록** (Firebase Hosting은 사용하지 않으므로 체크 안 해도 됩니다)
3. 화면에 나오는 `firebaseConfig` 객체를 그대로 복사해서 `js/firebase-config.js`의
   `export const firebaseConfig = { ... }` 안에 붙여넣습니다.

### 3-3. Firestore, Storage 활성화
1. 왼쪽 메뉴 **빌드 → Firestore Database → 데이터베이스 만들기**
   - 위치는 `asia-northeast3 (서울)` 추천
   - 보안 규칙은 일단 "테스트 모드"로 시작해도 되고, 아래 3-4 규칙을 바로 넣어도 됩니다.
2. 왼쪽 메뉴 **빌드 → Storage → 시작하기**
   - 위치는 Firestore와 동일하게 선택

### 3-4. 보안 규칙 설정 (중요)

**Firestore 규칙** (Firestore Database → 규칙 탭에 붙여넣기):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /photos/{photoId} {
      allow read: if true;
      allow create: if request.resource.data.keys().hasAll(['url', 'path', 'uploadedAt'])
                    && request.resource.data.url is string;
      allow update, delete: if false; // 삭제/수정은 Firebase 콘솔에서 관리자가 직접
    }
  }
}
```

**Storage 규칙** (Storage → Rules 탭에 붙여넣기):
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{allPaths=**} {
      allow read: if true;
      allow write: if request.resource.size < 10 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

이 규칙은 누구나 읽고 올릴 수 있는(로그인 없는) 캐주얼한 사진 공유용입니다.
부적절한 사진이 올라오면 Firebase 콘솔의 Storage/Firestore에서 직접 삭제하면 됩니다.
더 엄격한 제어(업로드한 사람만 삭제 가능 등)가 필요하면 Firebase Authentication을
추가로 붙이는 것을 검토해보세요.

### 3-5. 배포 및 확인
`js/firebase-config.js`를 채운 뒤 다시 커밋·푸시하면, 사이트의 "사진" 탭에서
바로 업로드 폼과 실시간 갤러리가 나타납니다.

## 참고

- 이 프로젝트는 빌드 과정이 없는 순수 정적 파일이라, 로컬에서 미리 보려면
  브라우저에서 `index.html`을 직접 여는 대신 아래처럼 간단한 로컬 서버로 열어야
  합니다 (ES 모듈은 `file://`로 열면 브라우저가 차단합니다).
  ```bash
  npx serve .
  # 또는
  python3 -m http.server 8000
  ```
- 문의/버그 수정은 코드를 직접 고쳐서 반영하는 구조입니다 — 별도의 관리자 로그인 화면은 없습니다.
