import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send } from 'lucide-react';
import clsx from 'clsx';

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([
    { role: 'bot', text: 'Hello! How can we help you with CapitalWave today?' }
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setChat((prev) => [...prev, { role: 'user', text: message }]);
    setMessage('');
    
    // Mock bot reply
    setTimeout(() => {
      setChat((prev) => [...prev, { 
        role: 'bot', 
        text: 'Thanks for reaching out! A support agent will be with you shortly. For immediate help, check out our FAQ.' 
      }]);
    }, 1000);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-80 sm:w-96 h-[450px] bg-navy-light border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-navy-lighter px-4 py-3 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-bold">CW</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Live Support</h3>
                  <p className="text-xs text-slate-400">Typically replies in a few minutes</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chat.map((msg, i) => (
                <div 
                  key={i} 
                  className={clsx(
                    "flex",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={clsx(
                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                    msg.role === 'user' 
                      ? "bg-primary text-white rounded-br-sm" 
                      : "bg-navy-lighter text-slate-200 border border-white/5 rounded-bl-sm"
                  )}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 bg-navy-lighter border-t border-white/10">
              <form onSubmit={handleSend} className="relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full bg-navy-light border border-white/10 rounded-full px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors pr-10"
                />
                <button 
                  type="submit"
                  disabled={!message.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-primary-hover disabled:opacity-50 disabled:hover:text-primary p-1 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary-hover text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/25 transition-transform hover:scale-105 active:scale-95 z-50 flex-shrink-0"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    </>
  );
}
