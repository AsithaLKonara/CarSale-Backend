import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../lib/env';
import { registerBookingHandlers } from './booking.socket';
import { registerNotificationHandlers } from './notifications.socket';

let io: SocketIOServer | null = null;

export interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'editor' | 'viewer';
  };
}

export const initSocket = (server: HttpServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: env.NODE_ENV === 'production' 
        ? undefined // Standard in production
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
    },
  });

  // JWT Verification Middleware for secure admin/editor handshakes
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token;
    
    if (!token) {
      // Allow general public sockets (for tracking views/notifications)
      return next();
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        id: string;
        email: string;
        role: 'admin' | 'editor' | 'viewer';
      };
      socket.user = decoded;
      next();
    } catch (err) {
      console.warn('Socket handshake auth token verification failed:', (err as Error).message);
      next(); // Do not crash, allow unauthenticated connection with restricted parameters
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`🔌 Socket connection established: ${socket.id} (Authenticated: ${!!socket.user}, Role: ${socket.user?.role || 'public'})`);

    // Assign authenticated editors and admins to a private operations channel
    if (socket.user && (socket.user.role === 'admin' || socket.user.role === 'editor')) {
      socket.join('ops_room');
      console.log(`🔒 Socket ${socket.id} assigned to VIP Operational Room [ops_room]`);
    }

    // Register modular feature handlers
    if (io) {
      registerBookingHandlers(io, socket);
      registerNotificationHandlers(io, socket);
    }

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO is not initialized! Please call initSocket(server) first.');
  }
  return io;
};

// Central helper to dispatch real-time events to admins
export const broadcastToAdmins = (event: string, payload: any) => {
  if (!io) return;
  io.to('ops_room').emit(event, payload);
};

// Global broadcast to all connected sessions (e.g. inventory alerts)
export const broadcastGlobal = (event: string, payload: any) => {
  if (!io) return;
  io.emit(event, payload);
};
