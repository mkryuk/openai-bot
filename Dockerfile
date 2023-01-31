# Use an official Node.js runtime as the base image
FROM node:18.13.0-alpine

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the source code
COPY . .

# Start the app using pm2
CMD [ "npm", "run", "pm2" ]

# Expose the app's port
EXPOSE 3000