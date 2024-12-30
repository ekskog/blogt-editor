# Use an official Node.js runtime as the base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy app source code
COPY . .

# Set environment variables
ENV NODE_ENV=production
# ENV PORT=3000
ENV DEBUG="*:,-express"

# Expose the port the app runs on
EXPOSE 3000

# Start the app
CMD ["npm", "run", "debug"]