import http from 'http';
import app from './app';
import { initSocket } from './socket';
import { env } from './lib/env';
import { initializeNotificationSubscribers } from './events/subscribers/notification.subscriber';
import { workflowEngine } from './modules/workflows/workflow.service';

const server = http.createServer(app);

// Initialize real-time web socket layers
initSocket(server);

// Boot internal domain event bus subscribers
initializeNotificationSubscribers();

// Initialize dynamic workflows triggers engine
workflowEngine.initialize();

const PORT = env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 UltraDrive Enterprise API running on http://localhost:${PORT}`);
  console.log(`🩺 Health check endpoint active at http://localhost:${PORT}/health`);
  console.log(`📡 Live Socket.IO streams initialized under standard listeners`);
});
