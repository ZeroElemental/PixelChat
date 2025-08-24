import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Import our new API service
import { loginUser } from '@/services/api';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null); // State to hold error messages
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError(null); // Clear previous errors
    try {
      const { data } = await loginUser({ email, password });
      
      // The backend sends back user data and a token upon successful login
      console.log('Login successful:', data);

      // Store the token to keep the user logged in
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userInfo', JSON.stringify(data));

      // Redirect to the chat page
      navigate('/');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      // If the backend sends an error (e.g., wrong password), display it
      console.error('Login failed:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in to continue to PixelChat</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-center text-destructive mb-4">{error}</p>}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button className="w-full" onClick={handleLogin}>
            Login
          </Button>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signUp" className="text-primary hover:underline">
              Sign Up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;