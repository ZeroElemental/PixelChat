import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const isAuthed = !!localStorage.getItem('authToken');
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center p-8">
      <h1 className="text-5xl font-extrabold">404</h1>
      <p className="text-muted-foreground">We couldn’t find that page.</p>
      <div className="flex items-center gap-3">
        <Button asChild>
          <Link to="/">Go Home</Link>
        </Button>
        {isAuthed ? (
          <Button asChild variant="secondary">
            <Link to="/chat">Open Chat</Link>
          </Button>
        ) : (
          <Button asChild variant="secondary">
            <Link to="/login">Login</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
