# HUFS 수강 시간표 빌더 (HUFS Timetable Builder)

## 프로젝트 개요

한국외국어대학교(HUFS) 학생들을 위한 **수강 시간표 작성 웹 애플리케이션**.
학교 강의 데이터를 수집하여 DB화하고, 직관적인 UI로 시간표를 구성할 수 있다.

- **배포 URL**: `https://iceweb.hufs.ac.kr/{프로젝트명}/`
- **배포 방식**: Docker + GitHub Actions + ArgoCD (ICE GitOps)

---

## 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| Frontend | **Vue 3** (Composition API) + Vite | SFC (.vue) 사용 |
| Backend | **Express.js** (Node.js) | Vue와 같은 JS 생태계 |
| Database | **SQLite3** (better-sqlite3) | 경량, 서버리스 DB |
| Styling | Tailwind CSS 또는 UnoCSS | 유틸리티 퍼스트 |
| HTTP Client | Axios | Frontend ↔ Backend 통신 |
| 스크래핑 | Cheerio + Axios | 강의 데이터 수집 |

---

## 프로젝트 구조

```
hufs-timetable/
├── CLAUDE.md                    # ← 이 파일 (프로젝트 전체 명세)
├── .claude/
│   └── rules/
│       ├── 01-project.md        # 전체 프로젝트 규칙
│       ├── 02-frontend.md       # Vue 프론트엔드 규칙
│       ├── 03-backend.md        # Express 백엔드 규칙
│       ├── 04-database.md       # SQLite DB 규칙
│       ├── 05-scraper.md        # 데이터 스크래핑 규칙
│       └── 06-deployment.md     # 배포 규칙
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── src/
│   │   ├── App.vue
│   │   ├── main.js
│   │   ├── router/
│   │   │   └── index.js
│   │   ├── stores/              # Pinia 상태관리
│   │   │   ├── timetable.js
│   │   │   └── lectures.js
│   │   ├── components/
│   │   │   ├── TimetableGrid.vue       # 시간표 그리드 (핵심)
│   │   │   ├── LectureSearchPanel.vue  # 강의 검색 패널
│   │   │   ├── LectureCard.vue         # 강의 카드 컴포넌트
│   │   │   ├── TimetableCell.vue       # 시간표 셀
│   │   │   ├── FilterBar.vue           # 필터 (학과, 학년, 요일 등)
│   │   │   ├── ConflictAlert.vue       # 시간 충돌 경고
│   │   │   ├── ExportButton.vue        # 이미지/PDF 내보내기
│   │   │   └── common/
│   │   │       ├── BaseButton.vue
│   │   │       ├── BaseInput.vue
│   │   │       └── BaseModal.vue
│   │   ├── views/
│   │   │   ├── HomeView.vue            # 메인 시간표 편집 화면
│   │   │   ├── SearchView.vue          # 강의 검색 전용 화면
│   │   │   └── SavedView.vue           # 저장된 시간표 목록
│   │   ├── composables/
│   │   │   ├── useTimetable.js         # 시간표 로직
│   │   │   ├── useConflictCheck.js     # 충돌 검사 로직
│   │   │   └── useLectureSearch.js     # 검색 로직
│   │   ├── utils/
│   │   │   ├── timeParser.js           # 시간 파싱 유틸
│   │   │   ├── colorAssigner.js        # 과목별 색상 배정
│   │   │   └── api.js                  # Axios 인스턴스
│   │   └── assets/
│   │       └── styles/
│   │           └── main.css
│   └── nginx.conf                      # Nginx 설정 (배포용)
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── index.js                    # Express 앱 진입점
│   │   ├── config/
│   │   │   └── database.js             # SQLite 연결 설정
│   │   ├── routes/
│   │   │   ├── lectures.js             # GET /api/lectures
│   │   │   ├── departments.js          # GET /api/departments
│   │   │   ├── timetables.js           # CRUD /api/timetables
│   │   │   └── scraper.js              # POST /api/scraper/run
│   │   ├── models/
│   │   │   ├── Lecture.js
│   │   │   ├── Department.js
│   │   │   └── Timetable.js
│   │   ├── services/
│   │   │   ├── lectureService.js
│   │   │   ├── scraperService.js       # 스크래핑 비즈니스 로직
│   │   │   └── timetableService.js
│   │   ├── scraper/
│   │   │   ├── hufsScraper.js          # HUFS 강의 데이터 크롤러
│   │   │   └── dataParser.js           # HTML → 구조화 데이터
│   │   ├── middleware/
│   │   │   ├── errorHandler.js
│   │   │   └── validator.js
│   │   └── db/
│   │       ├── schema.sql              # 테이블 생성 DDL
│   │       ├── seed.js                 # 초기 데이터 시딩
│   │       └── migrations/
│   └── data/
│       └── timetable.db               # SQLite DB 파일
├── .github/
│   └── workflows/
│       └── ci.yml                      # GitHub Actions CI/CD
└── .gitignore
```

---

## 핵심 기능 명세

### 1. 강의 데이터 수집 (Scraper)
- **소스**: `https://wis.hufs.ac.kr/src08/jsp/lecture/LECTURE2020L.jsp`
- POST 요청으로 학과/학년/학기별 강의 목록을 가져옴
- HTML 테이블을 파싱하여 구조화된 데이터로 변환
- 수집 항목: 과목코드, 과목명, 교수명, 학점, 강의시간, 강의실, 정원, 학과, 학년, 구분(전공/교양)

### 2. 강의 검색 및 필터링
- 학과별, 학년별, 구분별(전공필수/전공선택/교양 등) 필터
- 과목명/교수명 키워드 검색
- 요일/시간대 필터
- 검색 결과를 카드 형태로 표시

### 3. 시간표 편집
- 드래그 앤 드롭 또는 클릭으로 강의 추가/제거
- **시간 충돌 자동 감지** 및 경고
- 과목별 자동 색상 배정 (파스텔 톤)
- 월~금, 09:00~21:00 그리드

### 4. 시간표 저장/관리
- LocalStorage 기반 시간표 저장 (여러 개 관리 가능)
- 시간표 이름 지정
- 이미지(PNG) 또는 PDF 내보내기

### 5. 총 학점 계산
- 현재 시간표의 총 학점 실시간 표시
- 전공/교양 구분 학점 표시

---

## API 엔드포인트

### 강의 API
```
GET    /api/lectures                  # 전체 강의 목록 (쿼리 파라미터로 필터링)
GET    /api/lectures/:id              # 특정 강의 상세
GET    /api/lectures/search?q=...     # 키워드 검색
```

### 학과 API
```
GET    /api/departments               # 학과 목록
```

### 시간표 API (선택사항 - 서버사이드 저장 시)
```
POST   /api/timetables               # 시간표 생성
GET    /api/timetables/:id           # 시간표 조회
PUT    /api/timetables/:id           # 시간표 수정
DELETE /api/timetables/:id           # 시간표 삭제
```

### 스크래퍼 API
```
POST   /api/scraper/run              # 스크래핑 실행 (관리자용)
GET    /api/scraper/status           # 스크래핑 상태 확인
```

### 쿼리 파라미터 (GET /api/lectures)
```
?department=정보통신공학과    # 학과 필터
&year=3                       # 학년 필터
&category=전공선택             # 구분 필터
&day=월                       # 요일 필터
&keyword=프로그래밍            # 키워드 검색
&page=1&limit=50              # 페이지네이션
```

---

## 배포 설정 (ICE GitOps)

### 핵심 제약 조건
- **리소스**: CPU 2코어, 메모리 4Gi, Pod 최대 5개
- **Base Path**: 프론트/백 각각 다르게 설정 필수
  - Frontend: `/hufs-timetable/`
  - Backend: `/hufs-timetable-back/`
- **API 호출 시**: `/hufs-timetable-back/api/...` 형태로 호출
- **환경변수**로 로컬/배포 환경 API URL 분기

### Docker
- Frontend: `nginx:alpine` 기반, Vite 빌드 결과물 서빙
- Backend: `node:20-alpine` 기반, Express 서버 실행
- SQLite DB 파일은 컨테이너 내부 `/app/data/` 에 저장

### ⚠️ SQLite 주의사항
ICE GitOps 클러스터는 예고 없이 재시작될 수 있어 **컨테이너 내 SQLite 데이터가 유실될 수 있음**.
→ 스크래퍼를 통해 언제든 데이터를 재수집할 수 있도록 설계.
→ 사용자 시간표는 **프론트엔드 LocalStorage**에 저장하여 서버 의존성 최소화.

---

## 개발 우선순위

1. **Phase 1**: 프로젝트 초기 설정 (Vue + Express + SQLite 세팅)
2. **Phase 2**: DB 스키마 설계 + 스크래퍼 구현
3. **Phase 3**: 백엔드 API 구현
4. **Phase 4**: 프론트엔드 UI (시간표 그리드 + 검색 패널)
5. **Phase 5**: 시간표 편집 로직 (충돌 감지, 색상 배정)
6. **Phase 6**: 저장/내보내기 기능
7. **Phase 7**: Docker + CI/CD 배포 설정
8. **Phase 8**: 디자인 폴리싱 + 반응형

---

## 코딩 컨벤션

### 공통
- 언어: JavaScript (ES2022+)
- 세미콜론 없음 (no-semi)
- 싱글 쿼트 사용
- 들여쓰기: 2 스페이스
- 한국어 주석 사용 가능

### Vue (Frontend)
- Composition API + `<script setup>` 사용
- Pinia로 상태 관리
- 컴포넌트명: PascalCase
- props/emits 명시적 정의
- `defineProps()`, `defineEmits()` 사용

### Express (Backend)
- async/await 패턴
- 에러는 미들웨어에서 중앙 처리
- 라우트 → 서비스 → 모델 레이어 분리
- better-sqlite3 동기 API 사용 (성능상 유리)

---

## 참고 자료
- ICE GitOps 배포 가이드: 프로젝트 루트의 `deployment-guide.md` 참조
- HUFS 강의 데이터 소스: `https://wis.hufs.ac.kr/src08/jsp/lecture/LECTURE2020L.jsp`
