import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Welcome to PixelChat</h1>
        <p className="text-muted-foreground">Fast, simple, and modern chat. Connect with friends, share files, and stay in sync in real time.</p>
        <div className="flex items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to="/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
