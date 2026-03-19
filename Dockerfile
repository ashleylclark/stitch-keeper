ARG NODE_VERSION=22.14.0-bookworm-slim
FROM node:${NODE_VERSION} AS build
WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .
RUN npm run build

FROM node:${NODE_VERSION} AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev
COPY server ./server
COPY --from=build /app/dist ./dist

ENV PORT=3001
ENV SQLITE_PATH=/app/data/stash-keeper.db

EXPOSE 3001

CMD ["npm", "run", "start:server"]
