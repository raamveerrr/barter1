import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import supabase from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import ChatWindow from './ChatWindow';
import { FaComments, FaTimes, FaSearch } from 'react-icons/fa';

const MessagesList = ({ onClose }) => {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOtherUserId, setSelectedOtherUserId] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!currentUser) return;

    const loadChats = async () => {
      try {
        const { data: chatsData, error } = await supabase
          .from('chats')
          .select('*')
          .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
          .order('updated_at', { ascending: false });

        if (error) throw error;

        const chatsWithDetails = await Promise.all(
          (chatsData || []).map(async (chat) => {
            const otherUserId = chat.user1_id === currentUser.id ? chat.user2_id : chat.user1_id;
            
            let userData = { data: { display_name: null, email: 'User' } };
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

            const { count: unreadCount } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('chat_id', chat.id)
              .or('is_read.is.null,is_read.eq.false')
              .neq('sender_id', currentUser.id);

            const { data: lastMessage } = await supabase
              .from('messages')
              .select('text, image_url, voice_url, created_at')
              .eq('chat_id', chat.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            const { data: firstMessage } = await supabase
              .from('messages')
              .select('sender_id')
              .eq('chat_id', chat.id)
              .order('created_at', { ascending: true })
              .limit(1)
              .single();

            const chatType = firstMessage?.sender_id === currentUser.id ? 'sent' : 'received';

            return {
              ...chat,
              otherUserId,
              otherUser: userData,
              unreadCount: unreadCount || 0,
              lastMessage,
              chatType,
            };
          })
        );

        setChats(chatsWithDetails);
        
        const counts = {};
        chatsWithDetails.forEach((chat) => {
          counts[chat.id] = chat.unreadCount;
        });
        setUnreadCounts(counts);
        setLoading(false);
      } catch (error) {
        console.error('Error loading chats:', error);
        setLoading(false);
      }
    };

    loadChats();

    const channel = supabase
      .channel('all-chats-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadChats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chats',
        },
        () => {
          loadChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const handleChatClick = async (chat) => {
    setSelectedOtherUserId(chat.otherUserId);
    if (chat.unreadCount > 0) {
      await supabase.rpc('mark_messages_read', { p_chat_id: chat.id });
      setUnreadCounts((prev) => ({ ...prev, [chat.id]: 0 }));
    }
  };

  const getPreviewText = (message) => {
    if (!message) return 'No messages yet';
    if (message.text) return message.text.length > 50 ? message.text.substring(0, 50) + '...' : message.text;
    if (message.image_url) return '📷 Image';
    if (message.voice_url) return '🎤 Voice message';
    return 'Message';
  };

  const filteredChats = chats.filter((chat) => {
    if (activeTab === 'sent') {
      if (chat.chatType !== 'sent') return false;
    } else if (activeTab === 'received') {
      if (chat.chatType !== 'received') return false;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const userName = (chat.otherUser?.display_name || chat.otherUser?.email || '').toLowerCase();
      const messageText = (chat.lastMessage?.text || '').toLowerCase();
      return userName.includes(query) || messageText.includes(query);
    }

    return true;
  });

  if (selectedOtherUserId) {
    return (
      <ChatWindow
        otherUserId={selectedOtherUserId}
        onClose={() => {
          setSelectedOtherUserId(null);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 via-gray-900 to-black">
      <div className="border-b border-white/10 bg-gray-900/50 backdrop-blur p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Messages</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <div className="relative mb-4">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800/60 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        <div className="flex gap-2">
          {['all', 'sent', 'received'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                  : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/60'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading chats...</p>
            </div>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FaComments className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-300">
                {searchQuery ? 'No chats found matching your search' : 'No messages yet'}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {!searchQuery && 'Start a conversation by clicking the chat icon on any item'}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            <AnimatePresence>
              {filteredChats.map((chat) => (
                <motion.button
                  key={chat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onClick={() => handleChatClick(chat)}
                  className="w-full p-4 hover:bg-gray-800/30 transition-colors text-left relative"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {chat.otherUser?.display_name?.charAt(0)?.toUpperCase() ||
                          chat.otherUser?.email?.charAt(0)?.toUpperCase() ||
                          '?'}
                      </div>
                      {unreadCounts[chat.id] > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {unreadCounts[chat.id] > 9 ? '9+' : unreadCounts[chat.id]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-white font-semibold truncate">
                          {chat.otherUser?.display_name || chat.otherUser?.email || 'Unknown'}
                        </h3>
                        {chat.lastMessage && (
                          <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                            {new Date(chat.lastMessage.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 truncate">{getPreviewText(chat.lastMessage)}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

const FloatingMessagesButton = () => {
  const { currentUser } = useAuth();
  const [showMessages, setShowMessages] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    const loadUnreadCount = async () => {
      const { data: chats } = await supabase
        .from('chats')
        .select('id')
        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`);

      if (!chats || chats.length === 0) {
        setTotalUnread(0);
        return;
      }

      const chatIds = chats.map((c) => c.id);
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('chat_id', chatIds)
        .or('is_read.is.null,is_read.eq.false')
        .neq('sender_id', currentUser.id);

      setTotalUnread(count || 0);
    };

    loadUnreadCount();

    const channel = supabase
      .channel('unread-count')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadUnreadCount();
        }
      )
      .subscribe();

    const interval = setInterval(loadUnreadCount, 5000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  if (!currentUser) return null;

  return (
    <>
      <AnimatePresence>
        {showMessages && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowMessages(false)}
          >
            <motion.div
              className="w-full h-full max-w-2xl max-h-[85vh] bg-gray-900 rounded-lg overflow-hidden shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <MessagesList onClose={() => setShowMessages(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setShowMessages(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <FaComments className="w-6 h-6" />
        {totalUnread > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-gray-900"
          >
            {totalUnread > 9 ? '9+' : totalUnread}
          </motion.div>
        )}
      </motion.button>
    </>
  );
};

export { MessagesList };
export default FloatingMessagesButton;
