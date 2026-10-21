FROM node:20-alpine
WORKDIR /app

# package.json is now at root — copy and install
COPY package.json ./
RUN npm install --production

# Copy server/ folder — preserves the path index.js expects
COPY server/ ./server/
COPY SKILL.md ./SKILL.md

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "server/index.js"]
