import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getFriends, getMessages, sendMessage, sendFriendRequest, uploadFile } from '@/services/api';import { Search, Paperclip, Send, UserPlus } from 'lucide-react';
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';

// --- Interfaces ---
interface Chat {
    _id: string;
    username: string;
}
interface Message {
    _id: string;
    sender: { _id: string; username: string; };
    receiver: string | { _id: string; username: string; };
    message: string;
    messageType: 'text' | 'image' | 'file';
    createdAt: string;
}

// --- Components ---
const ChatListItem = ({ username, onClick, isSelected, isOnline }: { username:string, onClick: () => void, isSelected: boolean, isOnline: boolean }) => (
    <div
        className={`flex items-center p-2 rounded-lg cursor-pointer ${isSelected ? 'bg-muted' : 'hover:bg-muted/50'}`}
        onClick={onClick}
    >
        <div className="relative">
            <Avatar className="h-9 w-9 mr-3">
                <AvatarImage src={`https://avatar.vercel.sh/${username}.png`} alt={username} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                    {username.charAt(0).toUpperCase()}
                </AvatarFallback>
            </Avatar>
            {isOnline && <div className="absolute bottom-0 right-3 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-muted" />}
        </div>
        <span className="font-medium">{username}</span>
    </div>
);

const ChatPage: React.FC = () => {
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [friendUsername, setFriendUsername] = useState('');
    const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const socket = useRef<Socket | null>(null);
    const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const messageEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Effect for initializing socket and fetching friends ONCE
    // This is the CORRECTED code to replace the block above

// Effect for initializing socket and fetching friends ONCE
useEffect(() => {
    const fetchFriends = async () => {
        try {
            const { data } = await getFriends();
            setChats(data);
        } catch (error) {
            console.error('Failed to fetch friends:', error);
        }
    };
    fetchFriends();
    
    socket.current = io('http://localhost:5000');
    
    socket.current.on('connect', () => {
        if (currentUser?._id) {
            socket.current?.emit('addUser', currentUser._id);
        }
    });
    
    socket.current.on('getOnlineUsers', (users: string[]) => {
        setOnlineUsers(users);
    });

    return () => {
        socket.current?.disconnect();
    };
}, []); // This runs only ONCE when the component mounts

// Effect for listening to real-time events that depend on the selected chat
useEffect(() => {
    if (!socket.current) return;

    const handleNewMessage = (arrivingMessage: Message) => {
        if (selectedChat && arrivingMessage.sender._id === selectedChat._id) {
            setMessages((prevMessages) => [...prevMessages, arrivingMessage]);
        }
    };
    
    const handleUserTyping = ({ from }: { from: string }) => {
        if (selectedChat && from === selectedChat._id) setIsTyping(true);
    };

    const handleUserStoppedTyping = ({ from }: { from: string }) => {
        if (selectedChat && from === selectedChat._id) setIsTyping(false);
    };
    
    socket.current.on('newMessage', handleNewMessage);
    socket.current.on('userTyping', handleUserTyping);
    socket.current.on('userStoppedTyping', handleUserStoppedTyping);
    
    return () => {
        socket.current?.off('newMessage', handleNewMessage);
        socket.current?.off('userTyping', handleUserTyping);
        socket.current?.off('userStoppedTyping', handleUserStoppedTyping);
    };
}, [selectedChat]); // This effect re-runs ONLY when you select a new chat // Empty dependency array means this runs only once on mount

    // Effect for listening to real-time events that depend on the selected chat
    useEffect(() => {
        if (!socket.current) return;

        const handleNewMessage = (arrivingMessage: Message) => {
            if (selectedChat && arrivingMessage.sender._id === selectedChat._id) {
                setMessages((prevMessages) => [...prevMessages, arrivingMessage]);
            }
        };
        
        const handleUserTyping = ({ from }: { from: string }) => {
            if (selectedChat && from === selectedChat._id) setIsTyping(true);
        };

        const handleUserStoppedTyping = ({ from }: { from: string }) => {
            if (selectedChat && from === selectedChat._id) setIsTyping(false);
        };
        
        socket.current.on('newMessage', handleNewMessage);
        socket.current.on('userTyping', handleUserTyping);
        socket.current.on('userStoppedTyping', handleUserStoppedTyping);
        
        return () => {
            socket.current?.off('newMessage', handleNewMessage);
            socket.current?.off('userTyping', handleUserTyping);
            socket.current?.off('userStoppedTyping', handleUserStoppedTyping);
        };
    }, [selectedChat]); // Re-run this effect when selectedChat changes

    // Effect for auto-scrolling
    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSelectChat = async (chat: Chat) => {
        setSelectedChat(chat);
        setIsTyping(false);
        try {
            const { data } = await getMessages(chat._id);
            setMessages(data);
        } catch (error) {
            console.error("Failed to fetch messages", error);
            setMessages([]);
        }
    };

    const handleTyping = () => {
        if (!socket.current || !selectedChat) return;
        socket.current.emit('typing', { to: selectedChat._id });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.current?.emit('stopTyping', { to: selectedChat._id });
        }, 2000);
    };
    
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !selectedChat) return;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('receiverId', selectedChat._id);
        try {
            toast.info("Uploading file...");
            const { data: savedMessage } = await uploadFile(formData);
            socket.current?.emit('sendMessage', savedMessage);
            setMessages((prev) => [...prev, savedMessage]);
            toast.success("File sent!");
        } catch (error) {
            console.error("File upload failed", error);
            toast.error("File upload failed.");
        }
    };

    const handleSendMessage = async () => {
        if (newMessage.trim() === '' || !selectedChat) return;
        try {
            const messageData = { receiverId: selectedChat._id, message: newMessage };
            const { data: savedMessage } = await sendMessage(messageData);
            
            socket.current?.emit('sendMessage', savedMessage);
            setMessages((prevMessages) => [...prevMessages, savedMessage]);
            setNewMessage('');
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };
    
    const handleAddFriend = async () => {
    if (friendUsername.trim() === '') return;
    try {
        const { data } = await sendFriendRequest(friendUsername);
        
        toast.success("Success!", {
            // Use the message from the server's response
            description: data.message,
        });
        setFriendUsername('');
        setIsAddFriendOpen(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        toast.error("Uh oh! Something went wrong.", {
            description: error.response?.data?.message || "Could not send friend request.",
        });
    }
};

    return (
        <div className="flex h-screen w-screen overflow-hidden text-sm bg-background text-foreground">
            {/* Sidebar */}
            <aside className="hidden md:flex md:flex-col md:w-80 bg-muted/40 border-r">
                <header className="p-4 border-b flex justify-between items-center">
                    <h1 className="text-xl font-bold">PixelChat</h1>
                    <Dialog open={isAddFriendOpen} onOpenChange={setIsAddFriendOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon"> <UserPlus className="h-5 w-5" /> </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Add Friend</DialogTitle>
                                <DialogDescription>Enter the username of the user you want to add as a friend.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="username" className="text-right">Username</Label>
                                    <Input id="username" value={friendUsername} onChange={(e) => setFriendUsername(e.target.value)} className="col-span-3" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" onClick={handleAddFriend}>Add Friend</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
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
                            isOnline={onlineUsers.includes(chat._id)}
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
                            <div className="text-xs h-4">
                                {isTyping ? (
                                    <span className="italic text-muted-foreground">typing...</span>
                                ) : onlineUsers.includes(selectedChat._id) ? (
                                    <span className="text-green-500">Online</span>
                                ) : (
                                    <span className="text-muted-foreground">Offline</span>
                                )}
                            </div>
                        </div>
                    </header>
                    <div className="flex-grow p-6 overflow-y-auto flex flex-col space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg._id}
                                className={`p-2 rounded-lg max-w-lg w-fit ${
                                    msg.sender._id === currentUser._id
                                        ? 'bg-primary text-primary-foreground self-end'
                                        : 'bg-muted self-start'
                                }`}
                            >
                                {msg.messageType === 'image' ? (
                                    <img src={msg.message} alt="uploaded content" className="rounded-md max-w-xs cursor-pointer" onClick={() => window.open(msg.message, '_blank')}/>
                                ) : msg.messageType === 'file' ? (
                                    <a href={msg.message} target="_blank" rel="noopener noreferrer" className="underline flex items-center p-2">
                                        <Paperclip className="h-4 w-4 mr-2 flex-shrink-0" />
                                        <span className="truncate">{msg.message.split('/').pop()}</span>
                                    </a>
                                ) : (
                                    <p className="px-1">{msg.message}</p>
                                )}
                            </div>
                        ))}
                        <div ref={messageEndRef} />
                    </div>
                    <footer className="p-4 border-t">
                        <div className="relative">
                            <Input
                                type="text"
                                placeholder="Type a message..."
                                className="pr-24"
                                value={newMessage}
                                onChange={(e) => {
                                    setNewMessage(e.target.value);
                                    handleTyping();
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                            <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center space-x-1">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    aria-label="Upload file"

                                />
                                <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
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
                    <p>No friends yet. Add a friend to start chatting!</p>
                </div>
            )}
        </div>
    );
};

export default ChatPage;