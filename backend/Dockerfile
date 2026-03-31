FROM node:20-alpine
WORKDIR /app

RUN mkdir -p /app/data

COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

ENV PORT=8080
ENV BASE_PATH=/hufs-timetable-back
ENV DB_PATH=/app/data/timetable.db

EXPOSE 8080
CMD ["node", "src/index.js"]
