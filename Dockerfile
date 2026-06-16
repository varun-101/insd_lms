# Single image used for both the Next.js server and the background worker.
FROM node:24-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

# ---- Dependencies ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- Build ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- Runtime ----
FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY package.json next.config.ts ./
COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json ./

EXPOSE 3000
# Override `command` in compose to run the worker instead.
CMD ["npm", "run", "start"]
