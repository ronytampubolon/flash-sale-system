FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build the app
RUN npm run build

# Expose port
EXPOSE 3300

# Start preview server
CMD ["npm", "run", "preview", "--", "--host", "--port", "3300"]