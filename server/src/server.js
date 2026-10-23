import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/db.js';
import { PORT, CLIENT_URL } from './config/env.js';
import { initSocketIO } from './socket/socketHandler.js';

const httpServer = http.createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*', // Allow connections from Vite dev server and mobile devices
    methods: ['GET', 'POST', 'PATCH'],
    credentials: true,
  },
});

initSocketIO(io);

// Start server after connecting to database
const startServer = async () => {
  try {
    await connectDB();
    const serverInstance = httpServer.listen(PORT, () => {
      console.log(`☕ [BREW & BEAN] Server listening on http://localhost:${PORT}`);
      console.log(`⚡ [BREW & BEAN] WebSockets initialized for live order streaming`);
    });

    const shutdown = (signal) => {
      serverInstance.close(() => {
        if (signal === 'SIGUSR2') {
          process.kill(process.pid, 'SIGUSR2');
        } else {
          process.exit(0);
        }
      });
    };

    process.once('SIGUSR2', () => shutdown('SIGUSR2'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error(`Failed to launch server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
