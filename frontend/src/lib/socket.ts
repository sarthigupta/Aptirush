import { io, Socket } from 'socket.io-client';

export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') ||
  'http://localhost:5000';

export const getSocket = (): Socket => {
  return io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
  });
};
