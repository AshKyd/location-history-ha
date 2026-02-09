FROM node:24-alpine

WORKDIR /app

# Install dependencies (only production)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Create volume/directory for database
RUN mkdir -p /data
VOLUME /data

# Default environment variables
ENV NODE_ENV=production
ENV DB_PATH=/data/location_history.db
ENV CRON_SCHEDULE="0 * * * *"
ENV HISTORY_DAYS=1
ENV TIMEZONE=UTC

CMD ["node", "index.js"]
