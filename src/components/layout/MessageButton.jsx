
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import { DirectMessage } from "@/entities/DirectMessage";
import { User } from "@/entities/User";

export default function MessageButton({ targetUserEmail, className }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [rateLimitBackoff, setRateLimitBackoff] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // This effect only runs for the header button (when targetUserEmail is not provided)
    if (targetUserEmail) return;

    const fetchUnreadCount = async () => {
      try {
        const now = Date.now();
        
        // Extended cooldown - don't fetch if we just fetched recently or if we're in backoff
        if (now - lastFetchTime < 30000 || now < rateLimitBackoff) { // Increased from 5000 to 30000
          return;
        }
        setLastFetchTime(now); // Mark the start of this fetch attempt

        const user = await User.me();
        if (user) {
          // Add delay before next API call
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const unreadMessages = await DirectMessage.filter({
            recipient_email: user.email,
            is_read: false,
          });
          setUnreadCount(unreadMessages.length);
          setRateLimitBackoff(0); // Reset backoff on successful fetch
        }
      } catch (error) {
        // Handle rate limiting with longer backoff
        if (error.response?.status === 429) {
          const backoffTime = Date.now() + 300000; // 5 minute backoff instead of 1 minute
          setRateLimitBackoff(backoffTime);
          console.warn(`MessageButton: Rate limit hit. Backing off until ${new Date(backoffTime).toLocaleTimeString()}`);
        }
        // User not logged in, or other error - silently handle
      }
    };

    fetchUnreadCount();
    // Increased polling interval from 60 to 120 seconds
    const interval = setInterval(fetchUnreadCount, 120000); 

    return () => clearInterval(interval);
  }, [targetUserEmail, lastFetchTime, rateLimitBackoff]);

  // If a target user is specified, this button will start a chat with them.
  if (targetUserEmail) {
    const handleStartChat = () => {
      const messagesUrl = createPageUrl("Messages");
      navigate(`${messagesUrl}?start_chat_with=${encodeURIComponent(targetUserEmail)}`);
    };

    return (
      <Button onClick={handleStartChat} className={className}>
        <MessageCircle className="w-4 h-4 mr-2" />
        Message
      </Button>
    );
  }

  // This is the default usage for the main layout header.
  return (
    <Link to={createPageUrl("Messages")}>
      <Button
        variant="ghost"
        size="icon"
        className="header-icon-btn"
      >
        <MessageCircle className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>
    </Link>
  );
}
