
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { InvokeLLM } from '@/integrations/Core';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Send, BrainCircuit, Sparkles, Loader2, Crown, ArrowRight } from 'lucide-react';
import { User } from '@/entities/User';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import QuantumFlowLoader from '../components/layout/QuantumFlowLoader';

// Special access email lists
const adminEmails = [
  'trevorhenry20@gmail.com',
  'sirp.block.chain@gmail.com', 
  'keith@quantum3.tech'
];

const coCEOEmails = [
  'sirp.block.chain@gmail.com',
  'trevorhenry20@gmail.com'
];

const cmoEmails = [
  'stokes1127@gmail.com'
];

const cfoEmails = [
  'keith@quantum3.tech'
];

// Helper function to check if user has special access
const hasSpecialAccess = (userEmail) => {
  if (!userEmail) return false;
  const email = userEmail.toLowerCase();
  return adminEmails.includes(email) || 
         coCEOEmails.includes(email) || 
         cmoEmails.includes(email) || 
         cfoEmails.includes(email);
};

// Helper function to get daily message limit based on subscription tier
const getDailyMessageLimit = (user) => {
  if (hasSpecialAccess(user?.email)) {
    return 1000; // Special access gets higher limit
  }
  
  switch (user?.subscription_tier) {
    case 'Pro':
      return 500; // Quantum Pro gets 500 messages per day
    case 'Creator':
    case 'Standard':
    default:
      return 0; // No access for other tiers
  }
};

// Helper function to check and update daily AI message count
const updateDailyAIMessageCount = async (user) => {
  const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
  
  let currentCount = user.daily_ai_message_count || 0;
  const lastResetDate = user.last_ai_message_reset_date;
  
  // Reset count if it's a new day
  if (lastResetDate !== today) {
    currentCount = 0;
    await User.updateMyUserData({
      daily_ai_message_count: 0,
      last_ai_message_reset_date: today
    });
  }
  
  return currentCount;
};

export default function QuantumChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useInternet, setUseInternet] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [dailyMessageCount, setDailyMessageCount] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setIsCheckingAuth(true);
    User.me().then(user => {
      setCurrentUser(user);
      if (user) {
        setMessages([
          { 
              role: 'assistant', 
              content: `Welcome back to FlowAI, ${user.full_name}! How can I help you shape the future today?`
          }
        ]);
      } else {
        setMessages([
          { 
              role: 'assistant', 
              content: "Welcome to FlowAI! I'm your personal AI assistant. How can I help you shape the future today?" 
          }
        ]);
      }
    }).catch(() => {
      setCurrentUser(null);
      setMessages([
          { 
              role: 'assistant', 
              content: "Welcome to FlowAI! I'm your personal AI assistant. How can I help you shape the future today?" 
          }
      ]);
    }).finally(() => {
      setIsCheckingAuth(false);
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const constructFullPrompt = (currentMessages, newPrompt) => {
    let context = "You are FlowAI, a helpful and very intelligent AI assistant integrated into the QuantumFlow decentralized social platform. Be concise and helpful. Format your responses in markdown.\n\n";
    currentMessages.forEach(msg => {
      context += `**${msg.role === 'user' ? 'User' : 'FlowAI'}**: ${msg.content}\n\n`;
    });
    context += `**User**: ${newPrompt}\n\n**FlowAI**:`;
    return context;
  };

  const handleSend = async () => {
    if (isLoading || !input.trim() || !currentUser) return;

    // Check daily message limit
    const dailyLimit = getDailyMessageLimit(currentUser);
    if (dailyLimit === 0) {
      // This shouldn't happen as the component would redirect, but just in case
      return;
    }

    const updatedCount = await updateDailyAIMessageCount(currentUser);
    
    if (updatedCount >= dailyLimit) {
      // User has reached their daily limit
      // Optionally, you can add a message to the chat here indicating the limit
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `You've reached your daily limit of ${dailyLimit} FlowAI messages. Your limit resets tomorrow!`
      }]);
      setIsLoading(false); // Ensure loading state is false if stopped here
      return;
    }

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');

    try {
      const fullPrompt = constructFullPrompt(messages, input);
      const response = await InvokeLLM({
        prompt: fullPrompt,
        add_context_from_internet: useInternet,
      });

      const assistantMessage = { role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMessage]);

      // Increment the daily AI message count
      const newCount = updatedCount + 1;
      setDailyMessageCount(newCount);
      await User.updateMyUserData({
        daily_ai_message_count: newCount
      });

    } catch (error) {
      console.error("Error invoking LLM:", error);
      const errorMessage = { role: 'assistant', content: "Sorry, I encountered an error. Please try again." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load daily message count on component mount or when currentUser changes
  useEffect(() => {
    const loadDailyCount = async () => {
      if (currentUser) {
        const count = await updateDailyAIMessageCount(currentUser);
        setDailyMessageCount(count);
      }
    };
    loadDailyCount();
  }, [currentUser]);

  if (isCheckingAuth) {
    return (
      <div className="flex flex-col h-screen bg-black text-white items-center justify-center">
        <QuantumFlowLoader message="Authenticating..." />
      </div>
    );
  }
  
  const isAllowed = currentUser?.subscription_tier === 'Pro' || hasSpecialAccess(currentUser?.email);
  const dailyLimit = getDailyMessageLimit(currentUser);
  const remainingMessages = Math.max(0, dailyLimit - dailyMessageCount);
  const isAtLimit = dailyMessageCount >= dailyLimit;

  if (!isAllowed) {
    return (
      <div className="flex flex-col h-screen bg-black text-white items-center justify-center p-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md p-8 bg-slate-900/50 border border-purple-500/20 rounded-2xl shadow-2xl shadow-purple-500/10"
        >
          <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center">
            <Crown className="w-8 h-8 text-yellow-300" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">FlowAI is a Pro Feature</h1>
          <p className="text-gray-400 mb-6">
            Upgrade to Quantum Pro to unlock your personal AI-powered creative partner, with full web access and contextual memory.
          </p>
          <Button asChild size="lg" className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">
            <Link to={createPageUrl('QuantumPlus')}>
              Upgrade to Pro <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <header className="p-4 border-b border-purple-500/20 bg-black/50 backdrop-blur-sm z-10">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <BrainCircuit className="w-8 h-8 text-purple-400" />
            <div>
              <h1 className="text-xl font-bold text-white">FlowAI</h1>
              <p className="text-sm text-gray-400">Your AI-powered creative partner</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Message Counter */}
            <div className="text-sm text-gray-400 bg-slate-800/50 px-3 py-1 rounded-full">
              {remainingMessages} messages remaining today
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className={`w-4 h-4 transition-colors ${useInternet ? 'text-cyan-400' : 'text-gray-600'}`} />
              <Label htmlFor="internet-toggle" className="text-sm text-gray-300">Search the Web</Label>
              <Switch
                id="internet-toggle"
                checked={useInternet}
                onCheckedChange={setUseInternet}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <AnimatePresence>
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className={`max-w-xl p-4 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-blue-600/80 rounded-br-none' 
                    : 'bg-slate-900/80 border border-purple-500/20 rounded-bl-none'
                }`}>
                  <article className="prose prose-invert prose-sm max-w-none prose-p:text-white prose-headings:text-white prose-strong:text-white prose-pre:bg-slate-800 prose-pre:p-3 prose-pre:rounded-lg">
                    <ReactMarkdown>
                      {msg.content}
                    </ReactMarkdown>
                  </article>
                </div>
                 {msg.role === 'user' && currentUser?.avatar_url && (
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <img src={currentUser.avatar_url} alt="You" className="w-full h-full rounded-full object-cover"/>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
             <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-4"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div className="max-w-xl p-4 rounded-2xl bg-slate-900/80 border border-purple-500/20 rounded-bl-none">
                    <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        <span className="text-sm text-gray-400">Thinking...</span>
                    </div>
                </div>
             </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="p-4 bg-black border-t border-purple-500/20">
        <div className="max-w-3xl mx-auto">
          {isAtLimit ? (
            <div className="text-center p-6 bg-slate-900/50 border border-purple-500/20 rounded-xl">
              <Crown className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white mb-2">Daily Message Limit Reached</h3>
              <p className="text-gray-400 mb-4">
                You've used all {dailyLimit} of your daily FlowAI messages. Your limit resets tomorrow!
              </p>
              <p className="text-sm text-gray-500">
                Quantum Pro subscribers get {dailyLimit} messages per day to power their creative work.
              </p>
              <Button asChild size="lg" className="mt-4 w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">
                <Link to={createPageUrl('QuantumPlus')}>
                  Learn About Quantum Pro <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask me anything..."
                className="bg-slate-900/50 border-slate-700 text-white rounded-xl pr-20 resize-none"
                rows={1}
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="absolute right-2 bottom-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 rounded-lg"
                size="sm"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
