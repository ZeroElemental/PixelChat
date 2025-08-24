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
export const addFriend = (username: string) => API.post('/friends/add', { username });
export const uploadFile = (formData: FormData) => API.post('/messages/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

export default API;