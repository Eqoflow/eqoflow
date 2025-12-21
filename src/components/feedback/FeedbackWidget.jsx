
import React, { useState } from "react";
import { Feedback } from "@/entities/Feedback";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, ThumbsUp, Send, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Helper function to get color scheme safely, with a fallback
const getColorScheme = (schemeName) => {
  const colorSchemes = {
    purple: { primary: '#8b5cf6', secondary: '#ec4899', accent: '#2d1b69' },
    blue: { primary: '#3b82f6', secondary: '#06b6d4', accent: '#1e3a8a' },
    green: { primary: '#10b981', secondary: '#059669', accent: '#064e3b' },
    orange: { primary: '#f97316', secondary: '#eab308', accent: '#92400e' },
    red: { primary: '#ef4444', secondary: '#ec4899', accent: '#991b1b' },
    pink: { primary: '#ec4899', secondary: '#f472b6', accent: '#be185d' },
    cyan: { primary: '#06b6d4', secondary: '#3b82f6', accent: '#0e7490' },
    yellow: { primary: '#eab308', secondary: '#f97316', accent: '#a16207' },
    indigo: { primary: '#6366f1', secondary: '#8b5cf6', accent: '#4338ca' },
    emerald: { primary: '#10b981', secondary: '#059646', accent: '#065f46' },
  };
  // The 'colorblind' theme is not present in the colorSchemes object.
  // The current fallback mechanism already handles undefined scheme names by defaulting to 'purple'.
  return colorSchemes[schemeName] || colorSchemes.purple;
};

export default function FeedbackWidget({ user, pageName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState("change");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Safely determine userColorScheme with a fallback
  const userColorScheme = getColorScheme(user?.color_scheme);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    try {
      await Feedback.create({
        content: feedback,
        page_name: pageName || "Unknown",
        feedback_type: feedbackType
      });
      setIsSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        // Reset state after a delay to allow for closing animation
        setTimeout(() => {
          setIsSubmitted(false);
          setFeedback("");
        }, 500);
      }, 2000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hexToRgba = (hex, alpha) => {
    if (!hex) hex = '#8b5cf6'; // Fallback to default purple if hex is undefined
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  if (!user) {
    return null; // Don't render if there's no user
  }

  const headerGradient = `linear-gradient(to right, ${userColorScheme.primary}, ${userColorScheme.secondary})`;
  
  const headerTextColor = 'text-white';

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-80 mb-4"
          >
            <div
              className="dark-card border-2 rounded-xl overflow-hidden shadow-2xl"
              style={{
                borderColor: userColorScheme.primary,
                boxShadow: `0 0 30px ${hexToRgba(userColorScheme.primary, 0.3)}`
              }}
            >
              <div
                className={`p-4 flex justify-between items-center ${headerTextColor}`}
                style={{ background: headerGradient }}
              >
                <h3 className="font-bold">Provide Feedback</h3>
                <button onClick={() => setIsOpen(false)} className={'text-white/70 hover:text-white transition-colors'}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isSubmitted ? (
                <div className="p-6 text-center text-white">
                  <ThumbsUp className="w-12 h-12 mx-auto mb-3" style={{ color: userColorScheme.primary }} />
                  <h4 className="font-bold text-lg mb-2">Thank you!</h4>
                  <p className="text-gray-300">Your feedback helps us improve EqoFlow.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                  <div>
                    <label className="text-white text-sm font-medium mb-2 block">
                      What would you like us to know?
                    </label>
                    <Select value={feedbackType} onValueChange={setFeedbackType}>
                      <SelectTrigger className="bg-black/20 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-gray-600">
                        <SelectItem value="add" className="text-white hover:bg-slate-700">
                          ➕ Add a feature
                        </SelectItem>
                        <SelectItem value="change" className="text-white hover:bg-slate-700">
                          🔄 Change something
                        </SelectItem>
                        <SelectItem value="remove" className="text-white hover:bg-slate-700">
                          ❌ Remove something
                        </SelectItem>
                        <SelectItem value="other" className="text-white hover:bg-slate-700">
                          💬 Other feedback
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Tell us what's on your mind..."
                    className="bg-black/20 border-gray-600 text-white placeholder:text-gray-400 h-24 resize-none"
                    maxLength={500}
                  />

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      {feedback.length}/500 characters
                    </span>
                    <Button
                      type="submit"
                      disabled={!feedback.trim() || isSubmitting}
                      className="bg-gradient-to-r hover:opacity-90 transition-opacity disabled:opacity-50"
                      style={{ 
                        background: `linear-gradient(to right, ${userColorScheme.primary}, ${userColorScheme.secondary})`
                      }}
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Submit
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen(true)}
        className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border-2"
        style={{
          background: `linear-gradient(to right, ${userColorScheme.primary}, ${userColorScheme.secondary})`,
          borderColor: userColorScheme.primary
        }}
      >
        <MessageSquare className={`w-6 h-6 text-white`} />
      </Button>
    </>
  );
}
