import { io } from 'socket.io-client';
import { buildUrl } from '../api/frontend/client.js';

// Singleton Socket.IO client for the whole app
// Derive backend origin from VITE_API_BASE_URL if provided, else default to localhost
const apiBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || buildUrl('');
const backendOrigin = apiBase.replace(/\/api\/?$/, '');

const socket = io(backendOrigin, {
  withCredentials: true,
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 5000,
});

export default socket;
