import http from 'http';
import app from './app';
import { config } from './config';
import { initializeDatabase } from './config/database';

const startServer = async () => {
  try {
    await initializeDatabase();

    const server = http.createServer(app);

    server.listen(config.port, config.host, () => {
      console.log(`🚀 OTA API server running at http://${config.host}:${config.port}`);
      console.log(`🌱 Environment: ${config.env}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
