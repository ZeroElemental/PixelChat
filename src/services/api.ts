import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// This interceptor adds the auth token to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// --- Type Definitions for Payloads ---
type LoginData = {
  email?: string;
  password?: string;
};

type RegisterData = {
  username?: string;
  email?: string;
  password?: string;
};

// --- Exported API Functions ---
export const loginUser = (userData: LoginData) => API.post('/auth/login', userData);
export const registerUser = (userData: RegisterData) => API.post('/auth/register', userData);
export const getFriends = () => API.get('/users');
export const getMessages = (userId: string) => API.get(`/messages/${userId}`);
export const sendMessage = (messageData: { receiverId: string; message: string }) => API.post('/messages', messageData);
export const uploadFile = (formData: FormData) => API.post('/messages/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// --- New Friend Request Functions ---
export const sendFriendRequest = (username: string) => API.post('/friends/send-request', { username });
export const acceptFriendRequest = (requestFromId: string) => API.post('/friends/accept-request', { requestFromId });
// Add a function to get pending requests
export const getFriendRequests = () => API.get('/friends/requests'); // We will build this backend route next

export default API;