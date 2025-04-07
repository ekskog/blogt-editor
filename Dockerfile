# Use an official Node.js runtime as the base image
FROM node:lts-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy app source code
COPY app.js .
COPY public/ ./public
COPY routes ./routes
COPY utils ./utils
COPY views ./views
COPY bin ./bin

# Set environment variables
ENV NODE_ENV=production
# ENV PORT=3000
ENV DEBUG="blogt-editor*"

# Expose the port the app runs on
EXPOSE 3000

# Start the app
CMD ["npm", "start"]