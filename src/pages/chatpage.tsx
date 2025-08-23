import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getUsers, getMessages, sendMessage } from '@/services/api';
import { Search, Paperclip, Send } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Define the shape of our User/Chat and Message objects
interface Chat {
    _id: string;
    username: string;
}

interface Message {
    _id: string;
    sender: { _id: string; username: string; };
    receiver: { _id: string; username: string; };
    message: string;
    createdAt: string;
}

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
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const socket = useRef<Socket | null>(null);
    const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');

    // Effect for initializing socket connection
    useEffect(() => {
        socket.current = io('http://localhost:5000'); // Your backend URL

        // Join a room specific to the current user
        if (currentUser?._id) {
            socket.current.emit('joinRoom', currentUser._id);
        }

        // Listen for new messages from the server
        socket.current.on('newMessage', (message) => {
            setMessages((prevMessages) => [...prevMessages, message]);
        });

        // Cleanup on component unmount
        return () => {
            socket.current?.disconnect();
        };
    }, [currentUser?._id]);

    // Effect for fetching users
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data } = await getUsers();
                setChats(data);
            } catch (error) {
                console.error('Failed to fetch users:', error);
            }
        };
        fetchUsers();
    }, []);
    
    // Function to handle selecting a chat
    const handleSelectChat = async (chat: Chat) => {
        setSelectedChat(chat);
        try {
            const { data } = await getMessages(chat._id);
            setMessages(data);
        } catch (error) {
            console.error("Failed to fetch messages", error);
            setMessages([]);
        }
    };

    // Function to handle sending a message
    const handleSendMessage = async () => {
        if (newMessage.trim() === '' || !selectedChat) return;
        try {
            const messageData = { receiverId: selectedChat._id, message: newMessage };
            const { data: savedMessage } = await sendMessage(messageData);
            
            // Add sent message to our own message list immediately
            setMessages((prevMessages) => [...prevMessages, savedMessage]);
            
            // Emit the message through the socket to the receiver
            socket.current?.emit('sendMessage', savedMessage);
            setNewMessage('');
        } catch (error) {
            console.error("Failed to send message", error);
        }
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
                    {chats.map((chat) => (
                        <ChatListItem
                            key={chat._id}
                            username={chat.username}
                            isSelected={selectedChat?._id === chat._id}
                            onClick={() => handleSelectChat(chat)}
                        />
                    ))}
                </div>
            </aside>

            {/* Main Chat Area */}
            {selectedChat ? (
                <main className="flex-1 flex flex-col">
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
                        {messages.map((msg) => (
                            <div
                                key={msg._id}
                                className={`p-3 rounded-lg max-w-lg ${
                                    msg.sender._id === currentUser._id
                                        ? 'bg-primary text-primary-foreground self-end'
                                        : 'bg-muted self-start'
                                }`}
                            >
                                {msg.message}
                            </div>
                        ))}
                    </div>

                    {/* Message Input */}
                    <footer className="p-4 border-t">
                        <div className="relative">
                            <Input
                                type="text"
                                placeholder="Type a message..."
                                className="pr-24"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
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