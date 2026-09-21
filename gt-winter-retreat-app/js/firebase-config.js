// ============================================================================
// Firebase 설정 파일
// ----------------------------------------------------------------------------
// "사진" 탭의 사진 공유 기능은 Firebase(Firestore + Storage)를 사용합니다.
// 아래 값을 실제 프로젝트 값으로 바꾸기 전까지는 사진 탭에
// "Firebase 설정이 필요해요" 안내만 표시되고, 나머지 앱은 정상 작동합니다.
//
// 값 구하는 방법 (README.md의 "Firebase 설정" 섹션에 스크린샷 단계 설명 있음):
//   1. https://console.firebase.google.com 에서 새 프로젝트 생성
//   2. 프로젝트 설정 → 일반 → "내 앱" → 웹 앱 추가(</> 아이콘)
//   3. 표시되는 firebaseConfig 객체를 아래에 그대로 붙여넣기
//   4. Firestore Database, Storage 를 각각 "시작하기"로 활성화
//   5. README.md의 보안 규칙(rules)을 Firestore/Storage 콘솔에 붙여넣기
//
// 참고: 이 apiKey는 비밀키가 아니라 프로젝트를 식별하는 공개 값입니다.
// 실제 접근 제어는 Firestore/Storage의 보안 규칙(rules)이 담당합니다.
// ============================================================================

export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// data.js는 그대로 두고, 이 파일만 실제 값으로 채우면 됩니다.
export function isFirebaseConfigured() {
  return firebaseConfig.apiKey !== "YOUR_API_KEY" && !!firebaseConfig.apiKey;
}
