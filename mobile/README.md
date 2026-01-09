# Budget App Mobile (Android)

Capacitor 기반 Android 모바일 앱입니다.

## 사전 요구사항

### 필수 설치
1. **Node.js** (v18 이상)
2. **Android Studio** (최신 버전)
   - Android SDK (API 33 이상)
   - Android SDK Build-Tools
   - Android Emulator (선택사항)

### Android Studio 설정
1. Android Studio 설치: https://developer.android.com/studio
2. SDK Manager에서 다음 설치:
   - Android SDK Platform (API 33)
   - Android SDK Build-Tools
   - Android Emulator (에뮬레이터 사용 시)
3. 환경 변수 설정:
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/tools
   ```

## 설치 및 초기 설정

### 1. 의존성 설치
```bash
# mobile 디렉토리에서
npm install

# frontend 빌드가 필요하면
cd ../frontend
npm install
npm run build
```

### 2. Capacitor 초기화 (처음 한 번만)
```bash
# mobile 디렉토리에서
npx cap add android
```

### 3. 웹 빌드 및 동기화
```bash
npm run build
```

이 명령은 다음을 수행합니다:
- frontend 프로젝트 빌드
- 빌드된 파일을 Android 프로젝트로 복사

## 개발

### 웹 코드 수정 후 동기화
```bash
npm run sync
```

### Android Studio에서 앱 열기
```bash
npm run android
```

이후 Android Studio에서:
- 에뮬레이터 또는 실제 기기 선택
- Run 버튼 클릭

### 빠른 개발 워크플로우
1. `../frontend`에서 웹 코드 수정
2. `npm run build` (mobile 디렉토리에서)
3. Android Studio에서 자동 새로고침 또는 다시 실행

## 빌드 및 배포

### Debug APK 빌드
```bash
npm run build
npm run android
```

Android Studio에서: Build > Build Bundle(s) / APK(s) > Build APK(s)

생성 위치: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release APK 빌드
1. `android/app/build.gradle`에서 서명 설정
2. Android Studio에서: Build > Generate Signed Bundle / APK
3. 서명 키 생성 또는 기존 키 선택
4. Release 선택 후 빌드

## 플러그인

현재 설치된 Capacitor 플러그인:
- **@capacitor/app** - 앱 상태 관리
- **@capacitor/haptics** - 햅틱 피드백
- **@capacitor/keyboard** - 키보드 관리
- **@capacitor/status-bar** - 상태바 스타일

## 문제 해결

### 빌드 오류
```bash
# Capacitor 동기화
npx cap sync

# Android 프로젝트 클린
cd android
./gradlew clean
cd ..
```

### 웹 변경사항이 반영되지 않음
```bash
npm run build
npx cap copy
```

### Android Studio에서 Gradle 동기화 실패
- File > Invalidate Caches / Restart
- Android Studio 재시작

## 구조

```
mobile/
├── capacitor.config.ts    # Capacitor 설정
├── package.json           # 의존성
├── android/              # Android 네이티브 프로젝트 (git 제외)
└── README.md            # 이 파일
```

## 추가 정보

- Capacitor 문서: https://capacitorjs.com/docs
- Android 개발 가이드: https://developer.android.com/guide
