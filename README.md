# HUFS 수강 시간표 빌더 (HUFS Timetable Builder)

## 프로젝트 개요

한국외국어대학교(HUFS) 학생들을 위한 **수강 시간표 작성 웹 애플리케이션**.
학교 강의 데이터를 수집하여 DB화하고, 직관적인 UI로 시간표를 구성할 수 있다.

- **배포 URL**: `https://iceweb.hufs.ac.kr/hufs-time/`
- **배포 방식**: Docker + GitHub Actions + ArgoCD (ICE GitOps)

---

## 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| Frontend | **Vue 3** (Composition API) + Vite | SFC (.vue) 사용 |
| Backend | **Express.js** (Node.js) | Vue와 같은 JS 생태계 |
| Database | **Neon PostgreSQL** (pg) | 서버리스 클라우드 DB |
| Styling | Tailwind CSS | 유틸리티 퍼스트 |
| HTTP Client | Axios | Frontend ↔ Backend 통신 |
| 스크래핑 | Axios | HUFS API 강의 데이터 수집 |

---

## 프로젝트 구조

```
hufs-time/
├── README.md
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── nginx.conf
│   └── src/
│       ├── App.vue
│       ├── main.js
│       ├── router/index.js
│       ├── stores/                 # Pinia 상태관리
│       │   ├── timetable.js
│       │   └── lectures.js
│       ├── components/
│       │   ├── TimetableGrid.vue   # 시간표 그리드 (핵심)
│       │   ├── LectureSearchPanel.vue
│       │   ├── LectureCard.vue
│       │   ├── TimetableCell.vue
│       │   ├── FilterBar.vue       # 3탭 필터 (전공/교양/기초)
│       │   ├── ConflictAlert.vue
│       │   └── ExportButton.vue
│       ├── views/
│       │   ├── HomeView.vue        # 메인 시간표 편집
│       │   ├── SearchView.vue      # 강의 검색
│       │   └── SavedView.vue       # 저장된 시간표
│       ├── composables/
│       │   ├── useTimetable.js
│       │   ├── useConflictCheck.js
│       │   └── useLectureSearch.js
│       └── utils/
│           ├── timeParser.js
│           ├── colorAssigner.js
│           └── api.js              # Axios 인스턴스
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js                # Express 앱 진입점
│       ├── config/
│       │   └── database.js         # PostgreSQL Pool 연결
│       ├── routes/
│       │   ├── lectures.js
│       │   ├── departments.js
│       │   ├── scraper.js
│       │   └── metadata.js
│       ├── models/
│       │   ├── lecture.js
│       │   ├── department.js
│       │   ├── course-metadata.js
│       │   └── scrape-log.js
│       ├── services/
│       │   ├── lecture-service.js
│       │   ├── scraper-service.js
│       │   └── department-service.js
│       ├── scraper/
│       │   ├── hufs-scraper.js     # HUFS API 크롤러
│       │   └── data-parser.js      # 데이터 파싱
│       ├── middleware/
│       │   └── error-handler.js
│       └── db/
│           ├── schema.sql          # PostgreSQL DDL
│           ├── seed.js
│           └── seed-metadata.js
└── .github/
    └── workflows/
        └── ci.yml                  # GitHub Actions CI/CD
```

---

## 핵심 기능

### 1. 강의 데이터 수집 (Scraper)
- **소스**: HUFS 학사정보시스템 API (`wis.hufs.ac.kr`)
- 서울(H1) + 글로벌(H2) 캠퍼스 전체 학과 자동 수집
- 전공(gubun=1), 교양(gubun=2), 기초(gubun=3) 구분 수집
- 수집 항목: 과목코드, 과목명, 교수명, 학점, 강의시간, 강의실, 정원, 학과, 학년, 구분
- 현재 수집량: **3,720개 강의**, 192개 학과/영역

### 2. 강의 검색 및 필터링
- 3탭 필터: 전공/부전공 | 교양 | 기초
- 전공 탭: 학과 드롭다운 + 카테고리 + 학년 필터
- 교양/기초 탭: 영역 카테고리 필터
- 과목명/교수명 키워드 검색 (debounce 300ms)

### 3. 시간표 편집
- 클릭으로 강의 추가/제거
- **시간 충돌 자동 감지** 및 경고
- 과목별 자동 색상 배정 (16색 파스텔 팔레트)
- 월~금, 09:00~21:00 그리드

### 4. 시간표 저장/관리
- LocalStorage 기반 시간표 저장 (여러 개 관리 가능)
- 시간표 이름 지정
- 이미지(PNG) 내보내기 (html2canvas)

### 5. 수강 메타데이터
- 전공필수 과목 표시 (299건)
- 전공교류 과목 표시 (705건, 보라색 뱃지)
- 수강금지 교양 과목 표시 (192건)

---

## API 엔드포인트

### 강의 API
```
GET    /api/lectures                  # 강의 목록 (필터링 + 페이지네이션)
GET    /api/lectures/:id              # 강의 상세
GET    /api/lectures/search?q=...     # 키워드 검색
GET    /api/lectures/categories       # gubun별 카테고리 목록
```

### 학과 API
```
GET    /api/departments               # 학과 목록
```

### 메타데이터 API
```
GET    /api/metadata/cross-major      # 전공교류 강의 조회
```

### 스크래퍼 API
```
POST   /api/scraper/run              # 스크래핑 실행
GET    /api/scraper/status           # 스크래핑 상태 확인
```

### 쿼리 파라미터 (GET /api/lectures)
```
?department=정보통신공학과    # 학과 필터
&year=3                       # 학년 필터
&category=전공선택             # 구분 필터
&gubun=1                      # 1=전공, 2=교양, 3=기초
&day=월                       # 요일 필터
&keyword=프로그래밍            # 키워드 검색
&page=1&limit=50              # 페이지네이션
```

---

## 배포 설정 (ICE GitOps)

### URL 구조
| 구분 | URL |
|------|-----|
| Frontend | `https://iceweb.hufs.ac.kr/hufs-time/` |
| Backend | `https://iceweb.hufs.ac.kr/hufs-time-back/` |

### 리소스 제한
- CPU 2코어, 메모리 4Gi, Pod 최대 5개

### 데이터베이스
- **Neon PostgreSQL** (외부 클라우드 DB)
- K8s Pod 재시작 시에도 데이터 유지
- `DATABASE_URL` 환경변수로 연결 (K8s secret으로 주입)
- 사용자 시간표는 **프론트엔드 LocalStorage**에 저장

### Docker
- Frontend: `nginx:alpine` 기반, Vite 빌드 결과물 서빙 (base: `/hufs-time/`)
- Backend: `node:20-alpine` 기반, Express 서버 실행 (BASE_PATH: `/hufs-time-back`)

---

## 로컬 개발

```bash
# 백엔드
cd backend
npm install
DATABASE_URL=postgresql://... node src/index.js

# 프론트엔드 (별도 터미널)
cd frontend
npm install
npm run dev
```

- 프론트엔드: http://localhost:5173/hufs-timetable/
- 백엔드: http://localhost:8080
- Vite 프록시로 `/api` → `localhost:8080` 자동 연결

---

## 코딩 컨벤션

- 언어: JavaScript (ES2022+, ESM)
- 세미콜론 없음, 싱글 쿼트, 2 스페이스 들여쓰기
- Vue: Composition API + `<script setup>`, Pinia 상태관리
- Express: async/await, 라우트 → 서비스 → 모델 레이어 분리
- DB: pg (node-postgres) 비동기 Pool, prepared statement 사용
