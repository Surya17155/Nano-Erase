# Deployment Guide

## Prerequisites
- Ensure you have [Node.js](https://nodejs.org/en/) installed (version X.X.X).
- Install a package manager like npm or yarn.
- Make sure you have git installed.

## Local Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/Surya17155/Nano-Erase.git
   cd Nano-Erase
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

## Environment Configuration
- Create a `.env` file based on the `.env.example` file provided in the root of the project.
- Configure the required environment variables as needed.

## Running Locally
- To run the application locally, use the following command:
  ```bash
  npm start
  # or
  yarn start
  ```
- Open your browser and navigate to `http://localhost:3000` (or the port specified in your configuration).

## Deployment Options

### Vercel
1. Go to [Vercel](https://vercel.com).
2. Import your GitHub repository.
3. Follow the prompts to configure Build Settings and Environment Variables.
4. Deploy your application.

### Netlify
1. Go to [Netlify](https://www.netlify.com).
2. Link your GitHub repository.
3. Set your build command and publish directory:
   - Build command: `npm run build`  
   - Publish directory: `build`  
4. Click on Deploy.

### Custom Servers
To deploy on a custom server, use the following method:
1. Ensure your server has Node.js installed.
2. Transfer your application files to the server.
3. Run `npm install` to install dependencies.
4. Start your application using a process manager like PM2:
   ```bash
   pm2 start npm --name "my-app" -- run start
   ```

### Docker
1. Create a `Dockerfile` at the root of your project:
   ```dockerfile
   FROM node:X.X.X
   WORKDIR /app
   COPY . .
   RUN npm install
   CMD ["npm", "start"]
   ```
2. Build your Docker image:
   ```bash
   docker build -t my-app .
   ```
3. Run the Docker container:
   ```bash
   docker run -p 3000:3000 my-app
   ```

## Conclusion
This guide provides an overview of how to deploy the application using various hosting options. Make sure to customize settings according to your specific deployment needs.