FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package.json ./
COPY bun.lock* ./package-lock.json* ./

# Copy prisma schema before npm install (needed for postinstall prisma generate)
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the app
RUN npm run build

# Expose port
EXPOSE 8080

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Start command
CMD ["sh", "-c", "npx prisma db push --skip-generate && node .next/standalone/server.js"]
