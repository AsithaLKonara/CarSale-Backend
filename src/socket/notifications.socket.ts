import { Server, Socket } from 'socket.io';

export const registerNotificationHandlers = (io: Server, socket: Socket) => {
  // Synchronize dynamic read indicators across all open admin browsers
  socket.on('notification:read_all', () => {
    socket.to('ops_room').emit('notification:synced_read_all');
  });

  socket.on('notification:read_item', (data: { notificationId: string }) => {
    socket.to('ops_room').emit('notification:synced_read_item', { id: data.notificationId });
  });
};
