FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

FROM node:18-alpine AS runner
WORKDIR /app
RUN apk add --no-cache curl
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY knexfile.js ./knexfile.js
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "src/index.js"]
