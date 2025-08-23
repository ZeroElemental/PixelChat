// import React from 'react';

// // Placeholder components - you will replace these with actual Shadcn UI components
// const Sidebar = () => <div className="hidden md:flex md:flex-col md:w-1/3 bg-background border-r"> {/* Sidebar Content */} </div>;
// const ChatArea = () => <div className="flex flex-col flex-1"> {/* Main Chat Area Content */} </div>;

// const ChatPage: React.FC = () => {
//   return (
//     <div className="flex h-screen w-screen overflow-hidden">
//       <Sidebar />
//       <ChatArea />
//     </div>
//   );
// };

// export default ChatPage;
import React from 'react';
import { Search, Paperclip, Send } from 'lucide-react';

// Import the real Shadcn UI components
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


// A simple component for a chat list item
const ChatListItem = ({ name, avatarColor }: { name: string, avatarColor: string }) => (
    <div className="flex items-center p-2 rounded-lg cursor-pointer hover:bg-muted">
        <Avatar className="h-9 w-9 mr-3">
            <AvatarImage src={`https://avatar.vercel.sh/${name}.png`} alt={name} />
            <AvatarFallback style={{ backgroundColor: avatarColor, color: 'white' }}>
                {name.charAt(0).toUpperCase()}
            </AvatarFallback>
        </Avatar>
        <span className="font-medium">{name}</span>
    </div>
);


const ChatPage: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden text-sm bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-80 bg-muted/40 border-r">
        <header className="p-4 border-b">
          <h1 className="text-xl font-bold">Link-Up</h1>
        </header>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search chats..." className="pl-8" />
          </div>
        </div>
        <div className="flex-grow p-4 overflow-y-auto space-y-2">
            <ChatListItem name="Grace Miller" avatarColor="#48bb78" />
            <ChatListItem name="Liam Anderson" avatarColor="#3b82f6" />
            <ChatListItem name="Sophia Chen" avatarColor="#8b5cf6" />
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col">
        {/* Chat Header */}
        <header className="bg-background p-4 border-b flex items-center">
            <Avatar className="h-10 w-10 mr-4">
                <AvatarImage src="https://avatar.vercel.sh/grace.png" alt="Grace Miller" />
                <AvatarFallback style={{ backgroundColor: '#48bb78', color: 'white' }}>GM</AvatarFallback>
            </Avatar>
          <div>
            <div className="font-semibold">Grace Miller</div>
            <div className="text-xs text-green-500">Online</div>
          </div>
        </header>

        {/* Message Area */}
        <div className="flex-grow p-6 overflow-y-auto flex flex-col space-y-4">
          <div className="p-3 rounded-lg bg-muted max-w-lg self-start">
            Hey Jack! I'm doing well, thanks. Can't wait for the weekend!
          </div>
          <div className="p-3 rounded-lg bg-primary text-primary-foreground max-w-lg self-end">
            Hey Grace, how's it going?
          </div>
        </div>

        {/* Message Input */}
        <footer className="p-4 border-t">
          <div className="relative">
            <Input
              type="text"
              placeholder="Type a message..."
              className="pr-24"
            />
            <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center space-x-1">
                <Button variant="ghost" size="icon">
                    <Paperclip className="h-4 w-4" />
                </Button>
                <Button size="icon">
                    <Send className="h-4 w-4" />
                </Button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default ChatPage;