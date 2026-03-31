# 06 - 배포 규칙 (ICE GitOps + Docker)

## 배포 환경 개요
- 플랫폼: ICE GitOps (한국외대 정보통신공학과 자체 K8s 클러스터)
- 도메인: `https://iceweb.hufs.ac.kr/`
- CI: GitHub Actions
- CD: ArgoCD (자동)

## URL 구조
| 구분 | URL |
|------|-----|
| Frontend | `https://iceweb.hufs.ac.kr/hufs-timetable/` |
| Backend | `https://iceweb.hufs.ac.kr/hufs-timetable-back/` |

> ⚠️ 프로젝트명은 팀과 협의하여 결정. 위는 예시.

## Frontend Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
# 커스텀 nginx 설정 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf (프론트엔드)
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location /hufs-timetable/ {
        alias /usr/share/nginx/html/;
        try_files $uri $uri/ /hufs-timetable/index.html;
    }

    # gzip 압축
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
}
```

### Vue 설정 (vite.config.js)
```js
export default defineConfig({
  base: '/hufs-timetable/',  // ← 배포 경로와 일치 필수!
})
```

## Backend Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app

# data 디렉토리 생성 (SQLite용)
RUN mkdir -p /app/data

COPY package*.json ./
RUN npm ci --production
COPY . .

ENV PORT=8080
ENV BASE_PATH=/hufs-timetable-back
ENV DB_PATH=/app/data/timetable.db

EXPOSE 8080
CMD ["node", "src/index.js"]
```

## GitHub Actions CI (.github/workflows/ci.yml)

풀스택 배포 템플릿 사용:
- FRONT_IMAGE: `ghcr.io/icegitops/hufs-timetable`
- BACK_IMAGE: `ghcr.io/icegitops/hufs-timetable-back`
- GitOps 레포 경로:
  - 프론트: `gitops/projects/hufs-timetable`
  - 백엔드: `gitops/projects/hufs-timetable-back`

## 환경변수 관리

### 프론트엔드
```
# .env.development
VITE_API_URL=http://localhost:8080

# .env.production  
VITE_API_URL=/hufs-timetable-back
```

### 백엔드
```
# 로컬
PORT=8080
BASE_PATH=
DB_PATH=./data/timetable.db

# 배포 (Dockerfile ENV으로 설정)
PORT=8080
BASE_PATH=/hufs-timetable-back
DB_PATH=/app/data/timetable.db
```

## 리소스 제한
- CPU: 2코어
- 메모리: 4Gi
- Pod: 최대 5개
→ SQLite는 가벼우므로 충분. 단, 스크래핑 시 메모리 사용량 주의.

## 로컬 개발 환경

### 동시 실행
```bash
# 터미널 1: 백엔드
cd backend && npm run dev

# 터미널 2: 프론트엔드  
cd frontend && npm run dev
```

### Vite 프록시로 API 연결
개발 시 프론트엔드(5173)에서 백엔드(8080)로 프록시:
```js
// vite.config.js
server: {
  proxy: {
    '/api': 'http://localhost:8080'
  }
}
```

## .gitignore
```
# Dependencies
node_modules/

# Build
dist/
build/

# Database
*.db
*.db-journal
*.db-wal

# Environment
.env.local
.env.*.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
```

## 배포 전 체크리스트
- [ ] `vite.config.js`의 `base` 경로 확인
- [ ] `.env.production`의 `VITE_API_URL` 확인
- [ ] Backend `BASE_PATH` 환경변수 확인
- [ ] Frontend Dockerfile의 nginx.conf 경로 확인
- [ ] GitHub Actions ci.yml의 PROJECT_NAME 확인
- [ ] 로컬에서 `docker build` 성공 확인
- [ ] CORS 설정에 배포 도메인 포함 확인
