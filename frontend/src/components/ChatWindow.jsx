import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import supabase from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FaPaperPlane, FaImage, FaMicrophone, FaSpinner, FaCoins } from 'react-icons/fa';

const MessageList = ({ messages, currentUserId }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      <AnimatePresence>
        {messages.map((msg) => {
          const isSent = msg.sender_id === currentUserId;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] sm:max-w-[60%] rounded-2xl px-4 py-2.5 ${
                  isSent
                    ? 'bg-gradient-to-br from-indigo-600/90 to-purple-600/90 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] ring-1 ring-indigo-400/30'
                    : 'bg-gray-800/80 text-gray-100 shadow-[0_0_15px_rgba(0,0,0,0.3)] ring-1 ring-white/10'
                }`}
              >
                {msg.text && (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                )}
                {msg.image_url && (
                  <img
                    src={msg.image_url}
                    alt="Shared image"
                    className="mt-2 rounded-lg max-w-full h-auto shadow-lg"
                  />
                )}
                {msg.voice_url && (
                  <div className="mt-2">
                    <audio controls className="w-full max-w-xs">
                      <source src={msg.voice_url} type="audio/mpeg" />
                      <source src={msg.voice_url} type="audio/mp4" />
                    </audio>
                  </div>
                )}
                <p className={`text-xs mt-1.5 ${isSent ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      <div ref={messagesEndRef} />
    </div>
  );
};

const MessageInput = ({ chatId, onMessageSent, onMessageOptimistic }) => {
  const { currentUser } = useAuth();
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const voiceInputRef = useRef(null);

  const sendMessage = async (messageData) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      chat_id: chatId,
      sender_id: currentUser.id,
      created_at: new Date().toISOString(),
      ...messageData,
    };

    onMessageOptimistic?.(optimisticMessage);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: currentUser.id,
          ...messageData,
        })
        .select()
        .single();

      if (error) throw error;
      setText('');
      onMessageSent?.();
    } catch (error) {
      console.error('Error sending message:', error);
      onMessageOptimistic?.({ id: tempId, remove: true });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendText = async (e) => {
    e.preventDefault();
    if (!text.trim() || isUploading) return;
    await sendMessage({ text: text.trim() });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;
      const filePath = `chat-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('chat-images').getPublicUrl(filePath);
      await sendMessage({ image_url: data.publicUrl });
      e.target.value = '';
    } catch (error) {
      console.error('Error uploading image:', error);
      setIsUploading(false);
    }
  };

  const handleVoiceUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('audio/')) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;
      const filePath = `chat-voice/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-voice')
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('chat-voice').getPublicUrl(filePath);
      await sendMessage({ voice_url: data.publicUrl });
      e.target.value = '';
    } catch (error) {
      console.error('Error uploading voice:', error);
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSendText} className="border-t border-white/10 bg-gray-900/50 backdrop-blur p-4">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            rows={1}
            className="w-full px-4 py-2.5 bg-gray-800/60 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none max-h-32"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendText(e);
              }
            }}
            disabled={isUploading}
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          disabled={isUploading}
        />
        <input
          ref={voiceInputRef}
          type="file"
          accept="audio/*"
          onChange={handleVoiceUpload}
          className="hidden"
          disabled={isUploading}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="p-2.5 rounded-xl bg-gray-800/60 border border-white/10 text-gray-300 hover:text-white hover:bg-gray-700/60 transition-colors disabled:opacity-50"
        >
          <FaImage className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => voiceInputRef.current?.click()}
          disabled={isUploading}
          className="p-2.5 rounded-xl bg-gray-800/60 border border-white/10 text-gray-300 hover:text-white hover:bg-gray-700/60 transition-colors disabled:opacity-50"
        >
          <FaMicrophone className="w-5 h-5" />
        </button>
        <button
          type="submit"
          disabled={!text.trim() || isUploading}
          className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(99,102,241,0.3)]"
        >
          {isUploading ? (
            <FaSpinner className="w-5 h-5 animate-spin" />
          ) : (
            <FaPaperPlane className="w-5 h-5" />
          )}
        </button>
      </div>
    </form>
  );
};

const ChatWindow = ({ otherUserId, onClose }) => {
  const { currentUser } = useAuth();
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!currentUser || !otherUserId) return;

    let isMounted = true;

    const initializeChat = async () => {
      let userData = { data: { display_name: null, email: 'Loading...' } };
      try {
        const { data: userInfo } = await supabase.rpc('get_user_display_info', { p_user_id: otherUserId });
        if (userInfo) {
          userData = { data: userInfo };
        }
      } catch (err) {
        try {
          userData = await supabase
            .from('users')
            .select('display_name, email')
            .eq('id', otherUserId)
            .single();
        } catch {
          userData = { data: { display_name: null, email: 'User' } };
        }
      }

      const chatData = await supabase.rpc('get_or_create_chat', { other_user_id: otherUserId });

      if (userData.data && isMounted) {
        setOtherUser(userData.data);
      }

      if (chatData.error) {
        console.error('Chat error:', chatData.error);
        return;
      }

      if (chatData.data && isMounted) {
        setChatId(chatData.data);

        const { data: messagesData } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatData.data)
          .order('created_at', { ascending: true })
          .limit(50);

        if (messagesData && isMounted) {
          setMessages(messagesData);
          
          await supabase.rpc('mark_messages_read', { p_chat_id: chatData.data });
        }

        const presenceData = await supabase
          .from('user_presence')
          .select('is_online, last_seen')
          .eq('user_id', otherUserId)
          .single();

        if (presenceData.data && isMounted) {
          setIsOnline(presenceData.data.is_online);
          setLastSeen(presenceData.data.last_seen);
        }

        const channel = supabase
          .channel(`chat:${chatData.data}`, {
            config: { presence: { key: currentUser.id } },
          })
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `chat_id=eq.${chatData.data}`,
            },
            (payload) => {
              if (isMounted) {
                setMessages((prev) => {
                  const existing = prev.find((m) => m.id === payload.new.id);
                  if (existing) return prev;
                  const tempRemoved = prev.filter((m) => !m.id.startsWith('temp-'));
                  return [...tempRemoved, payload.new].sort(
                    (a, b) => new Date(a.created_at) - new Date(b.created_at)
                  );
                });
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_presence',
              filter: `user_id=eq.${otherUserId}`,
            },
            (payload) => {
              if (isMounted && payload.new) {
                setIsOnline(payload.new.is_online);
                setLastSeen(payload.new.last_seen);
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              channel.send({
                type: 'presence',
                event: 'track',
                payload: { user_id: currentUser.id },
              });
            }
          });

        channelRef.current = channel;
      }
    };

    initializeChat();

    const updatePresence = async () => {
      await supabase
        .from('user_presence')
        .upsert(
          {
            user_id: currentUser.id,
            is_online: true,
            last_seen: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
    };

    updatePresence();
    const presenceInterval = setInterval(updatePresence, 30000);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        supabase.rpc('set_user_offline');
      } else {
        updatePresence();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(presenceInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      supabase.rpc('set_user_offline');
    };
  }, [currentUser, otherUserId]);

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 via-gray-900 to-black relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 border-b border-white/10 bg-gray-900/50 backdrop-blur p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
              {otherUser?.display_name?.charAt(0)?.toUpperCase() || otherUser?.email?.charAt(0)?.toUpperCase() || '?'}
            </div>
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full ring-2 ring-gray-900" />
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold">
              {otherUser?.display_name || otherUser?.email || 'Loading...'}
            </h3>
            <p className={`text-xs ${isOnline ? 'text-green-400' : 'text-gray-400'}`}>
              {isOnline ? 'Online' : `Last seen ${formatLastSeen(lastSeen)}`}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
          >
            ×
          </button>
        )}
      </div>

      <MessageList messages={messages} currentUserId={currentUser?.id} />

      {chatId && (
        <MessageInput
          chatId={chatId}
          onMessageOptimistic={(msg) => {
            if (msg.remove) {
              setMessages((prev) => prev.filter((m) => m.id !== msg.id));
            } else {
              setMessages((prev) => {
                if (prev.some((m) => m.id === msg.id)) return prev;
                return [...prev, msg].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
              });
            }
          }}
        />
      )}
    </div>
  );
};

export default ChatWindow;
