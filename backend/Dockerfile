FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

ENV PORT=8080
ENV BASE_PATH=/hufs-time-back

EXPOSE 8080
CMD ["node", "src/index.js"]
