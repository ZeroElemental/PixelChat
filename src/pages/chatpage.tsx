import React, { useState, useEffect } from 'react';
import { getUsers } from '@/services/api';
import { Search, Paperclip, Send } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// The updated Chat interface to match our backend's User model
interface Chat {
    _id: string;
    username: string;
    email: string; // email is also available from the backend
}

// Updated ChatListItem component to use the correct props
const ChatListItem = ({ username, onClick, isSelected }: { username: string, onClick: () => void, isSelected: boolean }) => (
    <div
        className={`flex items-center p-2 rounded-lg cursor-pointer ${isSelected ? 'bg-muted' : 'hover:bg-muted/50'}`}
        onClick={onClick}
    >
        <Avatar className="h-9 w-9 mr-3">
            <AvatarImage src={`https://avatar.vercel.sh/${username}.png`} alt={username} />
            <AvatarFallback className="bg-primary text-primary-foreground">
                {username.charAt(0).toUpperCase()}
            </AvatarFallback>
        </Avatar>
        <span className="font-medium">{username}</span>
    </div>
);


const ChatPage: React.FC = () => {
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data } = await getUsers();
                setChats(data);
                if (data.length > 0) {
                    setSelectedChat(data[0]);
                }
            } catch (error) {
                console.error('Failed to fetch users:', error);
            }
        };

        fetchUsers();
    }, []);

    const handleSendMessage = () => {
        if (message.trim() === '') return;
        console.log(`Sending message to ${selectedChat?.username}: ${message}`);
        setMessage('');
    };

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
                    {/* CORRECTED: Use chat._id and chat.username */}
                    {chats.map((chat) => (
                        <ChatListItem
                            key={chat._id}
                            username={chat.username}
                            isSelected={selectedChat?._id === chat._id}
                            onClick={() => setSelectedChat(chat)}
                        />
                    ))}
                </div>
            </aside>

            {/* Main Chat Area */}
            {selectedChat ? (
                <main className="flex-1 flex flex-col">
                    {/* CORRECTED: Use selectedChat.username */}
                    <header className="bg-background p-4 border-b flex items-center">
                        <Avatar className="h-10 w-10 mr-4">
                            <AvatarImage src={`https://avatar.vercel.sh/${selectedChat.username}.png`} alt={selectedChat.username} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                                {selectedChat.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-semibold">{selectedChat.username}</div>
                            <div className="text-xs text-green-500">Online</div>
                        </div>
                    </header>

                    {/* Message Area */}
                    <div className="flex-grow p-6 overflow-y-auto flex flex-col space-y-4">
                        <div className="p-3 rounded-lg bg-muted max-w-lg self-start">
                           Hey! How's the project coming along?
                        </div>
                        <div className="p-3 rounded-lg bg-primary text-primary-foreground max-w-lg self-end">
                            It's going great! Just finished the user list.
                        </div>
                    </div>

                    {/* Message Input */}
                    <footer className="p-4 border-t">
                        <div className="relative">
                            <Input
                                type="text"
                                placeholder="Type a message..."
                                className="pr-24"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                            <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center space-x-1">
                                <Button variant="ghost" size="icon">
                                    <Paperclip className="h-4 w-4" />
                                </Button>
                                <Button size="icon" onClick={handleSendMessage}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </footer>
                </main>
            ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    Select a chat to start messaging
                </div>
            )}
        </div>
    );
};

export default ChatPage;