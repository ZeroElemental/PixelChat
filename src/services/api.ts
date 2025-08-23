import axios from 'axios';
export const getMessages = (userId: string) => API.get(`/messages/${userId}`);
export const sendMessage = (messageData: { receiverId: string; message: string }) => API.post('/messages', messageData);


const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Define the shape of our data payloads
type LoginData = {
  email?: string;
  password?: string;
};

type RegisterData = {
  username?: string;
  email?: string;
  password?: string;
};

// Apply the types to the function parameters
export const loginUser = (userData: LoginData) => API.post('/auth/login', userData);
export const registerUser = (userData: RegisterData) => API.post('/auth/register', userData);
export const getUsers = () => API.get('/users');

export default API;