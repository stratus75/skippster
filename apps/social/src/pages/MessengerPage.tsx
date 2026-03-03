import React from 'react';
import { Search, MoreVertical, Edit3, Video, Phone } from 'lucide-react';

export function MessengerPage() {
  const conversations = [
    {
      id: '1',
      name: 'Alice Johnson',
      avatar: '',
      lastMessage: 'Hey! Check out my new video on Tube',
      time: '2m',
      unread: 2,
      online: true,
    },
    {
      id: '2',
      name: 'Bob Developer',
      avatar: '',
      lastMessage: 'The code review is done, take a look!',
      time: '15m',
      unread: 0,
      online: true,
    },
    {
      id: '3',
      name: 'Charlie Tech',
      avatar: '',
      lastMessage: 'Thanks for the feedback!',
      time: '1h',
      unread: 0,
      online: false,
    },
    {
      id: '4',
      name: 'Diana Designs',
      avatar: '',
      lastMessage: 'Can we schedule a call tomorrow?',
      time: '3h',
      unread: 1,
      online: false,
    },
    {
      id: '5',
      name: 'Web3 Devs Group',
      avatar: '',
      lastMessage: 'Eve: Just deployed the new smart contract',
      time: '1d',
      unread: 15,
      online: true,
    },
  ];

  return (
    <div className="h-[calc(100vh-56px)] flex">
      {/* Conversations List */}
      <div className="w-full md:w-80 lg:w-96 border-r border-[#3e4042] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#3e4042]">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Messages</h1>
            <button className="p-2 hover:bg-[#3a3b3c] rounded-full transition-colors">
              <Edit3 className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search messages"
              className="pl-10 bg-[#3a3b3c] rounded-full py-2 px-4 text-sm"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className="flex items-center gap-3 p-4 hover:bg-[#3a3b3c] cursor-pointer transition-colors"
            >
              <div className="relative">
                <div className="w-14 h-14 bg-[#3a3b3c] rounded-full" />
                {conv.online && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-[#242526] rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium truncate">{conv.name}</h3>
                  <span className="text-xs text-gray-500">{conv.time}</span>
                </div>
                <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && (
                <div className="w-5 h-5 bg-social-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium">{conv.unread}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area - Desktop */}
      <div className="hidden md:flex flex-1 flex-col">
        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 bg-[#3a3b3c] rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Your Messages</h2>
            <p className="text-gray-500">Send private messages to a friend or group</p>
            <button className="mt-4 bg-social-500 hover:bg-social-600 px-6 py-3 rounded-lg font-medium transition-colors">
              Send Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Chat View Component (would be shown when a conversation is selected)
export function ChatView({ conversation }: { conversation: any }) {
  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-[#3e4042] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#3a3b3c] rounded-full" />
          <div>
            <h3 className="font-medium">{conversation.name}</h3>
            <p className="text-xs text-green-500">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-[#3a3b3c] rounded-full transition-colors">
            <Phone className="w-5 h-5 text-gray-500" />
          </button>
          <button className="p-2 hover:bg-[#3a3b3c] rounded-full transition-colors">
            <Video className="w-5 h-5 text-gray-500" />
          </button>
          <button className="p-2 hover:bg-[#3a3b3c] rounded-full transition-colors">
            <MoreVertical className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <MessageBubble content="Hey! Check out my new video on Tube" sent={false} time="2m" />
        <MessageBubble content="Wow, looks great! I'll watch it later" sent={true} time="1m" />
        <MessageBubble content="Let me know what you think!" sent={false} time="1m" />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-[#3e4042]">
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-[#3a3b3c] rounded-full transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
            </svg>
          </button>
          <input
            type="text"
            placeholder="Aa"
            className="flex-1 bg-[#3a3b3c] rounded-full px-4 py-2"
          />
          <button className="p-2 hover:bg-[#3a3b3c] rounded-full transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4l8 8m0-8l-8 8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ content, sent, time }: { content: string; sent: boolean; time: string }) {
  return (
    <div className={`flex ${sent ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          sent ? 'bg-social-500 text-white' : 'bg-[#3a3b3c]'
        }`}
      >
        <p>{content}</p>
        <p className={`text-xs mt-1 ${sent ? 'text-blue-200' : 'text-gray-500'}`}>{time}</p>
      </div>
    </div>
  );
}