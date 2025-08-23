import React from 'react';
import { MessageSquare } from 'lucide-react'; // A popular icon library used with Shadcn

const Welcome: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center bg-background">
      <MessageSquare size={64} className="text-muted-foreground mb-4" />
      <h2 className="text-2xl font-bold mb-2">Welcome to Link-Up</h2>
      <p className="text-muted-foreground">
        Select a chat from the sidebar to start messaging.
      </p>
    </div>
  );
};

export default Welcome;