# 01 - 프로젝트 전체 규칙

## 프로젝트 컨텍스트
이 프로젝트는 한국외국어대학교(HUFS) 학생용 수강 시간표 빌더 웹앱이다.
학교 서버에서 강의 데이터를 수집하여 SQLite에 저장하고, Vue 프론트엔드로 시간표를 만든다.

## 작업 원칙

### 단계적 구현
- 한 번에 모든 것을 만들지 않는다
- Phase별로 나누어 구현하고, 각 Phase가 동작하는 것을 확인한 후 다음으로 넘어간다
- 각 파일은 200줄을 넘지 않도록 한다. 넘으면 분리한다

### 모노레포 구조
```
frontend/   → Vue 3 + Vite (포트 5173)
backend/    → Express.js (포트 8080)
```
- frontend와 backend는 독립적인 Node.js 프로젝트 (각자 package.json)
- 공유 코드 없음. 프론트↔백은 오직 HTTP API로 통신

### 에러 처리
- 모든 API 호출에는 try-catch
- 사용자에게 보이는 에러 메시지는 한국어로
- 콘솔 로그는 영어로

### 네이밍
- 파일명: kebab-case (lecture-service.js)
- 변수/함수: camelCase
- 컴포넌트: PascalCase
- DB 테이블/컬럼: snake_case
- API 경로: kebab-case

### 의존성 설치 시
- npm을 사용한다 (yarn, pnpm 사용하지 않음)
- 패키지 추가 시 반드시 정확한 버전을 명시한다
- 불필요한 패키지는 설치하지 않는다

### Git 커밋
- 커밋 메시지는 한국어로 작성
- 접두사: feat, fix, refactor, style, docs, chore
- 예: `feat: 강의 검색 필터 추가`

## 금지 사항
- TypeScript 사용하지 않음 (JavaScript만)
- SSR 사용하지 않음 (SPA only)
- ORM 사용하지 않음 (better-sqlite3 직접 사용)
- 외부 인증/로그인 시스템 없음 (익명 사용)
- `.env` 파일에 실제 비밀값 커밋 금지
