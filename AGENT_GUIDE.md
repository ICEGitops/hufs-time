# 멀티 에이전트 작업 가이드

이 문서는 Claude Code에게 단계별로 작업을 지시하기 위한 **프롬프트 모음**입니다.
아래 Phase별 프롬프트를 순서대로 Claude Code에 입력하세요.

---

## Phase 1: 프로젝트 초기 설정

### 프롬프트 1-1: 백엔드 초기화
```
CLAUDE.md와 .claude/rules/ 파일들을 모두 읽고 프로젝트 구조를 이해해줘.

첫 번째 작업으로 backend/ 폴더를 초기화해줘:
1. package.json 생성 (type: module, 필요한 dependencies 포함)
2. src/index.js - Express 서버 기본 설정
3. src/config/database.js - SQLite 연결 설정
4. src/db/schema.sql - 테이블 생성 DDL
5. src/middleware/errorHandler.js - 에러 핸들러
6. npm install 실행

서버를 시작하면 "Server running on port 8080" 이 출력되고,
GET /api/health 에 { status: "ok" } 가 반환되어야 해.
```

### 프롬프트 1-2: 프론트엔드 초기화
```
frontend/ 폴더를 Vue 3 + Vite로 초기화해줘:
1. npm create vite@latest 로 Vue 프로젝트 생성 (또는 수동 설정)
2. 필요한 패키지 설치: vue-router, pinia, axios, tailwindcss
3. vite.config.js 설정 (base path, proxy)
4. Tailwind CSS 설정
5. 기본 라우터 설정 (/, /search, /saved)
6. 기본 App.vue + 라우터 뷰 구성

npm run dev로 실행하면 localhost:5173에서 기본 페이지가 보여야 해.
```

---

## Phase 2: DB 스키마 + 스크래퍼

### 프롬프트 2-1: 더미 데이터 준비
```
스크래퍼를 만들기 전에 먼저 더미 데이터를 준비해줘:
1. backend/data/seed-lectures.json 생성
   - 최소 4개 학과 (정보통신공학과, 컴퓨터공학과, 영어학과, 경영학과)
   - 각 학과별 15~20개 강의
   - 실제와 유사한 데이터 (과목명, 교수명, 시간, 강의실 등)
   - 시간 형식: "월3,4", "화1,2,3", "수5,6 금5,6" 등
2. backend/src/db/seed.js - JSON을 읽어 DB에 삽입하는 시드 스크립트
3. npm run seed 명령어로 실행 가능하도록 package.json에 script 추가

시드 후 DB에 강의 데이터가 정상 저장되었는지 확인해줘.
```

### 프롬프트 2-2: 스크래퍼 기본 구조
```
HUFS 강의 데이터 스크래퍼의 기본 구조를 만들어줘:
1. backend/src/scraper/hufsScraper.js - HTTP 요청 모듈
2. backend/src/scraper/dataParser.js - HTML 파싱 + 시간 문자열 파서
3. backend/src/services/scraperService.js - 스크래핑 오케스트레이션

단, 실제 학교 서버에 요청하는 부분은 TODO로 남겨두고,
dataParser의 시간 파싱 로직은 완전히 구현해줘.
"월3,4 수3,4" → [{ day: '월', start: '11:00', end: '12:50' }, { day: '수', start: '11:00', end: '12:50' }]
이런 변환이 정확히 동작해야 해. 테스트도 작성해줘.
```

---

## Phase 3: 백엔드 API

### 프롬프트 3-1: 강의 API
```
강의 관련 API를 구현해줘:
1. backend/src/models/Lecture.js - DB 쿼리 함수들
2. backend/src/services/lectureService.js - 비즈니스 로직
3. backend/src/routes/lectures.js - 라우트 정의

엔드포인트:
- GET /api/lectures - 전체 조회 (필터링 + 페이지네이션)
  - ?department=정보통신공학과
  - ?year=3
  - ?category=전공선택
  - ?day=월
  - ?keyword=프로그래밍
  - ?page=1&limit=50
- GET /api/lectures/:id - 단건 조회 (시간 정보 포함)
- GET /api/lectures/search?q=... - 통합 검색

시드 데이터로 테스트해서 결과가 정상인지 확인해줘.
curl로 각 엔드포인트를 테스트해.
```

### 프롬프트 3-2: 학과 API + 스크래퍼 API
```
나머지 API를 구현해줘:

학과 API:
- GET /api/departments - 학과 목록 (DB에서 조회)

스크래퍼 API:
- POST /api/scraper/run - 스크래핑 시작 (비동기)
- GET /api/scraper/status - 최근 스크래핑 상태 조회

현재는 scraper/run 호출 시 실제 크롤링 대신
시드 데이터를 다시 로드하는 것으로 대체해도 돼.
```

---

## Phase 4: 프론트엔드 UI 기본

### 프롬프트 4-1: 시간표 그리드 컴포넌트
```
시간표의 핵심인 TimetableGrid 컴포넌트를 만들어줘:
1. components/TimetableGrid.vue
   - 월~금 5열, 09:00~21:00 24행(30분 단위) 그리드
   - CSS Grid 기반 레이아웃
   - 시간 라벨(좌측)과 요일 헤더(상단)
   - 빈 셀은 연한 줄무늬 배경
   
2. components/TimetableCell.vue
   - 강의가 배치된 셀
   - 과목명, 교수명, 강의실 표시
   - 파스텔 색상 배경
   - 클릭하면 상세 정보 표시

3. utils/colorAssigner.js
   - 12~16개의 파스텔 색상 팔레트
   - 과목 코드 기반으로 일관된 색상 배정

4. stores/timetable.js (Pinia)
   - 현재 시간표에 담긴 강의 목록 관리
   - addLecture, removeLecture 액션

HomeView.vue에 TimetableGrid를 배치해서 화면에 보이게 해줘.
하드코딩된 더미 강의 2~3개로 그리드에 표시되는지 확인해.
```

### 프롬프트 4-2: 강의 검색 패널
```
강의를 검색하고 시간표에 추가하는 패널을 만들어줘:

1. components/LectureSearchPanel.vue
   - 왼쪽 사이드 패널 (시간표 옆에 위치)
   - 검색 입력 + 필터 드롭다운들
   - 결과 목록 (스크롤 가능)

2. components/FilterBar.vue
   - 학과 선택 (select)
   - 학년 선택 (1,2,3,4)
   - 구분 선택 (전공필수/전공선택/교양 등)
   - 요일 선택 (체크박스)

3. components/LectureCard.vue
   - 검색 결과의 각 강의 카드
   - 과목명, 교수, 학점, 시간, 강의실 표시
   - "추가" 버튼

4. stores/lectures.js (Pinia)
   - API 호출하여 강의 데이터 로드
   - 필터 상태 관리
   
5. composables/useLectureSearch.js
   - 검색 로직 (debounce 300ms)
   - API 호출 + 결과 관리

6. utils/api.js
   - Axios 인스턴스 (baseURL 환경변수)

HomeView를 2컬럼 레이아웃으로 수정:
왼쪽 = 검색 패널 (40%), 오른쪽 = 시간표 그리드 (60%)
백엔드 API에서 강의를 가져와서 검색 패널에 표시해줘.
```

---

## Phase 5: 시간표 편집 로직

### 프롬프트 5-1: 강의 추가/제거 + 충돌 감지
```
시간표 편집 핵심 로직을 구현해줘:

1. composables/useConflictCheck.js
   - 새 강의의 시간이 기존 시간표와 겹치는지 검사
   - 겹치는 강의가 있으면 해당 강의 정보 반환
   
2. composables/useTimetable.js
   - addLecture: 충돌 검사 후 추가
   - removeLecture: 시간표에서 제거
   - 총 학점 계산 (전공/교양 구분)

3. components/ConflictAlert.vue
   - 충돌 시 토스트/모달 경고
   - 충돌 강의 정보 표시

검색 패널에서 "추가" 클릭 → 충돌 검사 → 통과 시 시간표에 반영
시간표 내 카드 클릭 → 상세 팝업 + "제거" 버튼
총 학점은 시간표 상단에 실시간 표시
```

---

## Phase 6: 저장/내보내기

### 프롬프트 6-1: LocalStorage 저장 + 내보내기
```
시간표 저장과 내보내기 기능을 구현해줘:

1. 시간표 저장 (LocalStorage)
   - 여러 시간표를 이름으로 구분하여 저장
   - 시간표 목록 조회, 불러오기, 삭제
   - stores/timetable.js에 save/load/delete 추가

2. SavedView.vue (/saved 라우트)
   - 저장된 시간표 목록 표시
   - 카드 형태로 미리보기
   - 불러오기/삭제 버튼

3. components/ExportButton.vue
   - PNG 이미지로 내보내기 (html2canvas 사용)
   - 시간표 영역을 캡처하여 다운로드

4. 헤더/네비게이션 바
   - 라우트 간 이동
   - 현재 시간표 이름 표시
   - 저장 버튼
```

---

## Phase 7: Docker + CI/CD

### 프롬프트 7-1: Docker 설정
```
배포를 위한 Docker 설정을 만들어줘:

1. frontend/Dockerfile
   - node:20-alpine 빌드 스테이지
   - nginx:alpine 서빙 스테이지
   - base path: /hufs-timetable/

2. frontend/nginx.conf
   - SPA 라우팅 지원
   - gzip 압축

3. backend/Dockerfile
   - node:20-alpine
   - SQLite data 디렉토리
   - BASE_PATH 환경변수

4. .github/workflows/ci.yml
   - ICE GitOps 풀스택 CI 템플릿 적용
   - 프론트/백 이미지 각각 빌드 & 푸시

5. .env.production 파일들 확인

각 Dockerfile이 로컬에서 빌드 성공하는지 확인해줘.
```

---

## Phase 8: 디자인 폴리싱

### 프롬프트 8-1: UI 다듬기
```
전체 UI를 다듬어줘:

1. 색상 팔레트 통일 (대학 느낌의 깔끔한 블루 계열)
2. 시간표 그리드 디자인 개선
   - 셀 호버 효과
   - 강의 카드 그림자 + 둥근 모서리
   - 드래그 시 하이라이트
3. 검색 패널 디자인
   - 깔끔한 입력 필드
   - 필터 칩 스타일
4. 반응형 대응
   - 데스크탑 (1024px+): 2컬럼
   - 태블릿 (768px~1023px): 시간표 스크롤
   - 모바일 (767px-): 검색/시간표 탭 전환
5. 로딩 스켈레톤 + 빈 상태 UI
6. 트랜지션/애니메이션
   - 강의 추가/제거 시 fade 효과
   - 페이지 전환 트랜지션
```

---

## 디버깅/유지보수 프롬프트

### API 디버깅
```
백엔드 API를 테스트해줘:
1. GET /api/lectures 가 정상 동작하는지 curl로 확인
2. 필터 파라미터 조합별로 테스트
3. 에러 케이스 (잘못된 파라미터, 존재하지 않는 ID 등) 테스트
결과를 정리해서 알려줘.
```

### 프론트엔드 디버깅
```
프론트엔드에서 발생하는 문제를 진단해줘:
1. 브라우저 콘솔에 에러가 없는지 확인
2. API 호출이 정상적으로 이루어지는지 확인
3. 시간표에 강의가 올바른 위치에 렌더링되는지 확인
문제가 있으면 수정해줘.
```

---

## 팁: Claude Code 사용 시 주의사항

1. **CLAUDE.md를 항상 먼저 읽게 하세요**
   - 새 대화 시작 시: "CLAUDE.md와 .claude/rules/ 파일들을 읽어줘"
   
2. **한 번에 너무 많이 시키지 마세요**
   - Phase별로 나누어 진행
   - 각 Phase 완료 후 동작 확인

3. **에러 발생 시**
   - 에러 메시지 전체를 복사하여 제공
   - "이 에러를 수정해줘" + 에러 내용

4. **코드 리뷰 요청**
   - "현재 코드를 검토하고 개선점을 알려줘"
   - "보안 취약점이 있는지 확인해줘"
