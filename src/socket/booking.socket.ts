import { Server, Socket } from 'socket.io';

export const registerBookingHandlers = (io: Server, socket: Socket) => {
  // Listen for active workspace tracking (e.g. "admin is viewing booking #X")
  socket.on('booking:viewing', (data: { bookingId: string; adminEmail: string }) => {
    // Broadcast to other operational members to avoid race conditions or double confirmations
    socket.to('ops_room').emit('booking:active_view', {
      bookingId: data.bookingId,
      adminEmail: data.adminEmail,
      socketId: socket.id,
    });
  });

  socket.on('booking:stop_viewing', (data: { bookingId: string }) => {
    socket.to('ops_room').emit('booking:inactive_view', {
      bookingId: data.bookingId,
      socketId: socket.id,
    });
  });
};
