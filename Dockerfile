# Use the official Node.js 16 image as the base image
FROM node:16.18.0

# Install FFmpeg and Google Chrome
RUN apt-get update && apt-get install -y ffmpeg gnupg wget && \
  wget --quiet --output-document=- https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/google-archive.gpg && \
  echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list && \
  apt-get update && \
  apt-get install -y google-chrome-stable --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

# Install Redis
RUN apt-get update && apt-get install -y redis-server

# Set the working directory inside the container
WORKDIR /app

# Copy your Node.js application files (if any)
COPY package.json package-lock.json /app/

# Install Node.js dependencies (if any)
RUN npm install

# Copy the rest of your application code (if any)
COPY . /app/

RUN node node_modules/puppeteer/install.js

# Expose any ports your application may need (if any)
EXPOSE 3027

# Define the command to run your application
CMD ["node", "index.js"]
