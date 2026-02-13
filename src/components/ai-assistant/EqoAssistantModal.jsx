import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, MicOff, Volume2, VolumeX, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function EqoAssistantModal({ isOpen, onClose, userColorScheme }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm the EqoFlow AI Assistant. How can I help you today? You can speak or type your question.",
      timestamp: new Date()
    }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputText, setInputText] = useState("");
  const [autoSpeak, setAutoSpeak] = useState(true);
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInputText(transcript);
          handleSendMessage(transcript);
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }

      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speak = (text) => {
    if (synthRef.current && autoSpeak) {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      synthRef.current.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSendMessage = async (text = inputText) => {
    if (!text.trim() || isLoading) return;

    const userMessage = {
      role: "user",
      content: text.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const conversationHistory = messages.slice(-5).map(m => 
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
      ).join('\n');

      const prompt = `You are the EqoFlow AI Assistant, a helpful and friendly guide for the EqoFlow platform. EqoFlow is a decentralized social media and content creation platform that emphasizes privacy, community governance, and creator rewards.

Key features of EqoFlow:
- Social feed with posts (called "Echoes")
- Communities (EqoChambers) for topic-based discussions
- Knowledge hub with courses and tutorials
- DAO governance for platform decisions
- Token-based rewards system ($EQOFLO)
- NFT integration and creator tools
- Privacy-first design with Nillion integration
- Skills marketplace for freelance services

Previous conversation:
${conversationHistory}

User's question: ${text}

Provide a helpful, concise response (2-3 sentences max). Be friendly and conversational.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      const assistantMessage = {
        role: "assistant",
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      speak(response);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = {
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}>
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-2xl h-[600px] rounded-2xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${userColorScheme.accent}E6, ${userColorScheme.primary}40, #000000)`,
            border: `2px solid ${userColorScheme.primary}60`
          }}
          onClick={(e) => e.stopPropagation()}>
          
          {/* Header */}
          <div 
            className="flex items-center justify-between p-4 border-b"
            style={{ borderColor: `${userColorScheme.primary}30` }}>
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/7f44056eb_generated-image-removebg.png"
                alt="EqoFlow Assistant"
                className="w-12 h-12 object-contain"
              />
              <div>
                <h2 className="text-xl font-bold text-white">EqoFlow Assistant</h2>
                <p className="text-sm text-white/60">Ask me anything about EqoFlow</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAutoSpeak(!autoSpeak)}
                className="text-white hover:bg-white/10">
                {autoSpeak ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/10">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(600px-180px)]">
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-white/10 text-white'
                      : 'text-white'
                  }`}
                  style={
                    message.role === 'assistant'
                      ? { background: `${userColorScheme.primary}30` }
                      : {}
                  }>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs text-white/40 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start">
                <div 
                  className="p-3 rounded-2xl"
                  style={{ background: `${userColorScheme.primary}30` }}>
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div 
            className="p-4 border-t"
            style={{ borderColor: `${userColorScheme.primary}30` }}>
            <div className="flex items-center gap-2">
              <Button
                onClick={isListening ? stopListening : startListening}
                disabled={isLoading}
                className="flex-shrink-0"
                style={{
                  background: isListening 
                    ? `linear-gradient(135deg, #ef4444, #dc2626)` 
                    : `linear-gradient(135deg, ${userColorScheme.primary}, ${userColorScheme.secondary})`
                }}>
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type or speak your question..."
                disabled={isLoading}
                className="flex-1 bg-white/10 text-white placeholder:text-white/40 px-4 py-2 rounded-xl focus:outline-none focus:ring-2"
                style={{ focusRing: userColorScheme.primary }}
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isLoading}
                className="flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${userColorScheme.primary}, ${userColorScheme.secondary})`
                }}>
                <Send className="w-5 h-5" />
              </Button>
            </div>
            {isListening && (
              <p className="text-xs text-white/60 mt-2 text-center animate-pulse">
                Listening... Speak now
              </p>
            )}
            {isSpeaking && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <Volume2 className="w-4 h-4 text-white/60 animate-pulse" />
                <p className="text-xs text-white/60">Speaking...</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}