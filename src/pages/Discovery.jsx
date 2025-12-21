import React, { useState, useEffect, useContext, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, Users, Lock, Search, Filter, UserPlus, UserCheck, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserContext } from '../components/contexts/UserContext';
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

// Color schemes
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
  emerald: { primary: '#10b981', secondary: '#059646', accent: '#065f46' }
};

const getColorScheme = (schemeName) => {
  return colorSchemes[schemeName] || colorSchemes.purple;
};

export default function Discovery() {
  const { user } = useContext(UserContext);
  const userColorScheme = getColorScheme(user?.color_scheme);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [interestFilter, setInterestFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef(null);
  // This state variable now holds a direct reference to a bubble object from bubblesMutableRef.current
  const [hoveredBubble, setHoveredBubble] = useState(null);
  // bubblesMutableRef holds the actual mutable bubble objects for animation
  const bubblesMutableRef = useRef([]);
  // bubbles state is primarily used to ensure `hoveredBubble` references objects that exist in a React state context
  const [bubbles, setBubbles] = useState([]); // This state is updated once when new bubbles are created
  const [followingList, setFollowingList] = useState([]);
  const animationRef = useRef(null);
  const [isHoverCardHovered, setIsHoverCardHovered] = useState(false);
  const containerRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 }); // Stores mouse position relative to canvas
  const [cardPosition, setCardPosition] = useState({ left: '0px', top: '0px', transform: 'none' }); // New state for card position

  useEffect(() => {
    loadUsers();
    loadFollowing();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const publicUsers = await base44.entities.PublicUserDirectory.filter({ is_public: true });
      setUsers(publicUsers);
      setFilteredUsers(publicUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFollowing = async () => {
    if (!user) return;
    try {
      const follows = await base44.entities.Follow.filter({ follower_email: user.email });
      setFollowingList(follows.map((f) => f.following_email));
    } catch (error) {
      console.error("Error loading following:", error);
    }
  };

  const handleFollow = async (targetUserEmail) => {
    if (!user) return;

    try {
      const isFollowing = followingList.includes(targetUserEmail);

      if (isFollowing) {
        const follows = await base44.entities.Follow.filter({
          follower_email: user.email,
          following_email: targetUserEmail
        });
        if (follows.length > 0) {
          await base44.entities.Follow.delete(follows[0].id);
        }
        setFollowingList((prev) => prev.filter((email) => email !== targetUserEmail));
      } else {
        await base44.entities.Follow.create({
          follower_email: user.email,
          following_email: targetUserEmail
        });
        setFollowingList((prev) => [...prev, targetUserEmail]);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  useEffect(() => {
    let filtered = users;

    if (searchQuery) {
      filtered = filtered.filter((u) =>
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (skillFilter) {
      filtered = filtered.filter((u) =>
      u.skills && u.skills.some((s) => s.toLowerCase().includes(skillFilter.toLowerCase()))
      );
    }

    if (interestFilter) {
      filtered = filtered.filter((u) =>
      u.interests && u.interests.some((i) => i.toLowerCase().includes(interestFilter.toLowerCase()))
      );
    }

    setFilteredUsers(filtered);
  }, [searchQuery, skillFilter, interestFilter, users]);

  // Bubble visualization effect
  useEffect(() => {
    if (!canvasRef.current || filteredUsers.length === 0) {
      // Clear bubbles if no users are filtered or canvas is not ready
      bubblesMutableRef.current = [];
      setBubbles([]); // Update React state as well
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Create bubble objects with slower movement
    const newBubbles = filteredUsers.slice(0, 15).map((user, index) => {
      const radius = 45 + Math.random() * 25;
      
      // Convert hex to HSL for gradient variation
      const hexToHsl = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max === min) {
          h = s = 0;
        } else {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
          }
        }
        return [h * 360, s * 100, l * 100];
      };
      
      const baseColor = index % 2 === 0 ? userColorScheme.primary : userColorScheme.secondary;
      const [h, s, l] = hexToHsl(baseColor);
      const hueVariation = (Math.random() - 0.5) * 20;
      
      const bubble = {
        x: Math.random() * (canvas.width - radius * 2) + radius,
        y: Math.random() * (canvas.height - radius * 2) + radius,
        radius,
        vx: (Math.random() - 0.5) * 0.3, // Slower velocity
        vy: (Math.random() - 0.5) * 0.3, // Slower velocity
        user,
        color: `hsl(${h + hueVariation}, ${s}%, ${l}%)`,
        isHovered: false, // This will be mutated by event handlers
        avatarImage: null,
        avatarLoaded: false
      };

      // Load avatar image
      if (user.avatar_url) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          bubble.avatarImage = img;
          bubble.avatarLoaded = true;
        };
        img.onerror = () => {
          bubble.avatarLoaded = false;
        };
        img.src = user.avatar_url;
      }

      return bubble;
    });

    bubblesMutableRef.current = newBubbles; // Update mutable ref
    setBubbles(newBubbles); // Update React state (for hoveredBubble to reference)

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const currentBubbles = bubblesMutableRef.current; // Use the ref for animation

      // Update bubble positions and handle collisions
      currentBubbles.forEach((bubble, i) => {
        // Only move if not hovered
        if (!bubble.isHovered) {
          bubble.x += bubble.vx;
          bubble.y += bubble.vy;

          // Bounce off walls and correct position
          if (bubble.x - bubble.radius < 0) {
            bubble.vx *= -1;
            bubble.x = bubble.radius; // Correct position
          } else if (bubble.x + bubble.radius > canvas.width) {
            bubble.vx *= -1;
            bubble.x = canvas.width - bubble.radius; // Correct position
          }

          if (bubble.y - bubble.radius < 0) {
            bubble.vy *= -1;
            bubble.y = bubble.radius; // Correct position
          } else if (bubble.y + bubble.radius > canvas.height) {
            bubble.vy *= -1;
            bubble.y = canvas.height - bubble.radius; // Correct position
          }
        } else {
          // If hovered, ensure it's static
          bubble.vx = 0;
          bubble.vy = 0;
        }


        // Check collisions with other bubbles
        for (let j = i + 1; j < currentBubbles.length; j++) {
          const otherBubble = currentBubbles[j];

          const dx = otherBubble.x - bubble.x;
          const dy = otherBubble.y - bubble.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = bubble.radius + otherBubble.radius;

          // If bubbles are overlapping
          if (distance < minDistance) {
            // Calculate angle and overlap
            const angle = Math.atan2(dy, dx);
            const overlap = minDistance - distance;

            // Separate bubbles
            const moveX = overlap / 2 * Math.cos(angle);
            const moveY = overlap / 2 * Math.sin(angle);

            // Only move if not hovered
            if (!bubble.isHovered) {
              bubble.x -= moveX;
              bubble.y -= moveY;
            }
            if (!otherBubble.isHovered) {
              otherBubble.x += moveX;
              otherBubble.y += moveY;
            }

            // Collision response (elastic collision with damping)
            const v1 = { x: bubble.vx, y: bubble.vy };
            const v2 = { x: otherBubble.vx, y: otherBubble.vy };

            // Normal vector
            const nx = dx / distance;
            const ny = dy / distance;

            // Tangent vector
            const tx = -ny;
            const ty = nx;

            // Dot product of velocity and tangent vector for each bubble
            const dp_tan1 = v1.x * tx + v1.y * ty;
            const dp_tan2 = v2.x * tx + v2.y * ty;

            // Dot product of velocity and normal vector for each bubble
            const dp_norm1 = v1.x * nx + v1.y * ny;
            const dp_norm2 = v2.x * nx + v2.y * ny;

            // Conservation of momentum for normal velocities
            const m1 = bubble.radius; // Using radius as a proxy for mass
            const m2 = otherBubble.radius;
            const momentumConservationFactor = (dp_norm1 * (m1 - m2) + 2 * m2 * dp_norm2) / (m1 + m2);
            const momentumConservationFactor2 = (dp_norm2 * (m2 - m1) + 2 * m1 * dp_norm1) / (m1 + m2);

            // Update velocities with damping
            const damping = 0.8; // Energy loss during collision
            if (!bubble.isHovered) {
              bubble.vx = (tx * dp_tan1 + nx * momentumConservationFactor) * damping;
              bubble.vy = (ty * dp_tan1 + ny * momentumConservationFactor) * damping;
            }
            if (!otherBubble.isHovered) {
              otherBubble.vx = (tx * dp_tan2 + nx * momentumConservationFactor2) * damping;
              otherBubble.vy = (ty * dp_tan2 + ny * momentumConservationFactor2) * damping;
            }
          }
        }
      });

      // Draw connections with user's color scheme
      const primaryRgb = {
        r: parseInt(userColorScheme.primary.slice(1, 3), 16),
        g: parseInt(userColorScheme.primary.slice(3, 5), 16),
        b: parseInt(userColorScheme.primary.slice(5, 7), 16)
      };
      ctx.strokeStyle = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.15)`;
      ctx.lineWidth = 1;
      currentBubbles.forEach((bubble, i) => {
        for (let j = i + 1; j < currentBubbles.length; j++) {
          const otherBubble = currentBubbles[j];
          const dx = bubble.x - otherBubble.x;
          const dy = bubble.y - otherBubble.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 200) {// Connect if close enough
            ctx.beginPath();
            ctx.moveTo(bubble.x, bubble.y);
            ctx.lineTo(otherBubble.x, otherBubble.y);
            ctx.stroke();
          }
        }
      });

      // Update and draw bubbles
      currentBubbles.forEach((bubble) => {
        // Draw bubble with glow
        const gradient = ctx.createRadialGradient(
          bubble.x - bubble.radius / 3,
          bubble.y - bubble.radius / 3,
          0,
          bubble.x,
          bubble.y,
          bubble.radius
        );
        gradient.addColorStop(0, bubble.color);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw border with hover effect using user's color scheme
        const secondaryRgb = {
          r: parseInt(userColorScheme.secondary.slice(1, 3), 16),
          g: parseInt(userColorScheme.secondary.slice(3, 5), 16),
          b: parseInt(userColorScheme.secondary.slice(5, 7), 16)
        };
        ctx.strokeStyle = bubble.isHovered ? `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 1)` : `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.6)`;
        ctx.lineWidth = bubble.isHovered ? 3 : 2;
        ctx.stroke();

        // Add glow on hover with user's color scheme
        if (bubble.isHovered) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = `rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.8)`;
          ctx.beginPath();
          ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Draw avatar or fallback icon
        if (bubble.avatarLoaded && bubble.avatarImage) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(bubble.x, bubble.y - bubble.radius * 0.15, bubble.radius * 0.5, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(
            bubble.avatarImage,
            bubble.x - bubble.radius * 0.5,
            bubble.y - bubble.radius * 0.15 - bubble.radius * 0.5,
            bubble.radius,
            bubble.radius
          );
          ctx.restore();
        } else {
          // Fallback icon
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.font = `${bubble.radius * 0.4}px Arial`; // Adjusted size
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('👤', bubble.x, bubble.y - bubble.radius * 0.2); // Adjusted position
        }

        // Draw name
        ctx.fillStyle = 'white';
        ctx.font = 'bold 13px Arial'; // Fixed font size for name
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(
          bubble.user.full_name || bubble.user.username || 'Anonymous',
          bubble.x,
          bubble.y + bubble.radius * 0.2
        );
        ctx.shadowBlur = 0;

        // Draw role/skill
        if (bubble.user.skills && bubble.user.skills.length > 0) {
          ctx.fillStyle = 'rgba(168, 85, 247, 0.9)';
          ctx.font = '11px Arial'; // Fixed font size for skill
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx.shadowBlur = 3;
          ctx.fillText(bubble.user.skills[0], bubble.x, bubble.y + bubble.radius * 0.5); // Adjusted position
          ctx.shadowBlur = 0;
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [filteredUsers]); // Re-run effect if filteredUsers change, creating new bubbles

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    bubblesMutableRef.current.forEach((bubble) => {// Use the mutable ref for interaction
      const dx = x - bubble.x;
      const dy = y - bubble.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < bubble.radius) {
        window.location.href = createPageUrl('PublicProfile') + `?username=${bubble.user.username}`;
      }
    });
  };

  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update mouse position for card placement calculation
    setMousePosition({ x, y });

    let foundBubble = null;

    // Iterate over mutable bubbles to update their isHovered state
    bubblesMutableRef.current.forEach((bubble) => {
      const dx = x - bubble.x;
      const dy = y - bubble.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < bubble.radius) {
        foundBubble = bubble;
        bubble.isHovered = true; // Set directly
      } else {
        bubble.isHovered = false; // Set directly
      }
    });

    if (!foundBubble && !isHoverCardHovered) {
      canvas.style.cursor = 'default';
      // Only set null if it's currently a bubble, to prevent unnecessary re-renders
      if (hoveredBubble !== null) {
        setHoveredBubble(null);
      }
    } else if (foundBubble) {
      canvas.style.cursor = 'pointer';
      // Only update hoveredBubble state if it's a new bubble or it was null
      if (hoveredBubble !== foundBubble) {
        setHoveredBubble(foundBubble);
      }

      // --- Smart Positioning Logic START (Updated as per outline) ---
      const cardWidth = 320; // w-80 in tailwind
      const cardHeight = 300; // approximate height for the card (adjust as needed for content)
      const padding = 20; // Padding from canvas edges

      const canvasRect = canvas.getBoundingClientRect();
      const canvasWidth = canvasRect.width; // Use clientRect dimensions
      const canvasHeight = canvasRect.height; // Use clientRect dimensions

      let left = x;
      let top = y;
      let transform = 'translate(-50%, -50%)'; // Default: center on mouse

      // Check if card would overflow right edge
      if (x + cardWidth / 2 > canvasWidth - padding) {
        // Position card with its right edge at the left of mouse
        left = x - cardWidth - padding;
        transform = 'translateY(-50%)';
      }
      // Check if card would overflow left edge
      else if (x - cardWidth / 2 < padding) {
        // Position card with its left edge at the right of mouse
        left = x + padding;
        transform = 'translateY(-50%)';
      }

      // Check if card would overflow bottom edge
      if (y + cardHeight / 2 > canvasHeight - padding) {
        // Position card above mouse
        top = y - cardHeight - padding;
        if (transform === 'translateY(-50%)') {
          transform = 'none';
        } else {
          transform = 'translateX(-50%)';
        }
      }
      // Check if card would overflow top edge
      else if (y - cardHeight / 2 < padding) {
        // Position card below mouse
        top = y + padding;
        if (transform === 'translateY(-50%)') {
          transform = 'none';
        } else {
          transform = 'translateX(-50%)';
        }
      }

      setCardPosition({
        left: `${left}px`,
        top: `${top}px`,
        transform
      });
      // --- Smart Positioning Logic END ---

    } else {
      // If mouse is over canvas but not a bubble, and not over hover card, then default
      canvas.style.cursor = 'default';
      if (hoveredBubble && !isHoverCardHovered) {// Only clear if not hovering over card
        setHoveredBubble(null);
      }
    }
  };

  const handleCanvasMouseLeave = () => {
    // Only clear if not hovering over the card
    if (!isHoverCardHovered) {
      bubblesMutableRef.current.forEach((bubble) => {// Use the mutable ref
        // When mouse leaves canvas, unhover all bubbles
        bubble.isHovered = false; // Set directly
      });
      setHoveredBubble(null);
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'default'; // Reset cursor
      }
    }
  };

  const handleHoverCardMouseEnter = () => {
    setIsHoverCardHovered(true);
    // Keep canvas cursor as pointer if a bubble was hovered when entering the card
    if (canvasRef.current && hoveredBubble) {
      canvasRef.current.style.cursor = 'pointer';
    }
  };

  const handleHoverCardMouseLeave = () => {
    setIsHoverCardHovered(false);
    setHoveredBubble(null);
    bubblesMutableRef.current.forEach((bubble) => {// Use the mutable ref
      // When mouse leaves card, unhover all bubbles
      bubble.isHovered = false; // Set directly
    });
    // Important: if mouse is still over canvas but not a bubble, cursor should be default
    if (canvasRef.current) {// Added null check
      canvasRef.current.style.cursor = 'default';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 mt-32 md:mt-6">
      {/* Confidential Connection Engine Header */}
      <Card className="bg-gradient-to-r text-card-foreground rounded-lg border shadow-sm dark-card border-purple-500/30 from-purple-900/20 to-pink-900/20">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-white">Confidential Connection Engine</h2>
                  <span className="text-xs px-2 py-1 bg-purple-600/30 text-purple-300 rounded-full border border-purple-500/30">
                    Powered by Nillion
                  </span>
                </div>
                <p className="text-sm text-gray-300">
                  Find users with matching interests using privacy-preserving computation
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link to={createPageUrl("Privacy")}>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">
                  <Shield className="w-4 h-4 mr-2" />
                  Find Confidential Connections
                </Button>
              </Link>
              <Link to={createPageUrl("Privacy")}>
                <Button variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
                  <Lock className="w-4 h-4 mr-2" />
                  Manage Private Interests
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 p-3 bg-blue-600/10 border border-blue-500/20 rounded-lg">
            <Shield className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-200">
              Your privacy is guaranteed: Private interests are encrypted and never revealed. Matches are computed using secure multi-party computation (MPC) — only mutual connections are shown, and neither party learns the other's specific interests unless they match.
            </p>
          </div>
        </div>
      </Card>

      {/* Search and Filters */}
      <Card className="dark-card p-6">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/20 border-purple-500/20 text-white" />

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Filter by skill..."
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                className="pl-10 bg-black/20 border-purple-500/20 text-white" />

            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Filter by interest..."
                value={interestFilter}
                onChange={(e) => setInterestFilter(e.target.value)}
                className="pl-10 bg-black/20 border-purple-500/20 text-white" />

            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Users className="w-4 h-4" />
              <span>{filteredUsers.length} users found</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadUsers}
              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10">

              Reputation
            </Button>
          </div>
        </div>
      </Card>

      {/* Interactive Bubble Visualization */}
      <div className="relative" ref={containerRef}>
        <Card className="dark-card overflow-hidden">
          <div className="relative" style={{ height: '600px' }}>
            {isLoading ?
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
              </div> :
            filteredUsers.length === 0 ?
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <Users className="w-16 h-16 text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No users found</h3>
                <p className="text-gray-400">Try adjusting your search or filters</p>
              </div> :

            <canvas
              ref={canvasRef}
              className="w-full h-full"
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={handleCanvasMouseLeave} />

            }
          </div>
        </Card>

        {/* Hover Card */}
        <AnimatePresence>
          {hoveredBubble &&
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute z-10 pointer-events-none" // Outer div is non-interactive for mouse events
            style={cardPosition} // Use the calculated cardPosition
          >
              <div
              className="pointer-events-auto" // Inner div is interactive
              onMouseEnter={handleHoverCardMouseEnter}
              onMouseLeave={handleHoverCardMouseLeave}>

                <Card className="dark-card border-purple-500/50 w-80 shadow-2xl">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {hoveredBubble.user.avatar_url ?
                      <img src={hoveredBubble.user.avatar_url} alt={hoveredBubble.user.full_name} className="w-full h-full object-cover" /> :

                      <Users className="w-8 h-8 text-white" />
                      }
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-white text-lg">
                          {hoveredBubble.user.full_name || hoveredBubble.user.username}
                        </h3>
                        <p className="text-gray-400 text-sm">@{hoveredBubble.user.username}</p>
                      </div>
                    </div>

                    {hoveredBubble.user.bio &&
                  <p className="text-gray-300 text-sm line-clamp-2">
                        {hoveredBubble.user.bio}
                      </p>
                  }

                    {hoveredBubble.user.skills && hoveredBubble.user.skills.length > 0 &&
                  <div>
                        <p className="text-xs text-gray-500 mb-2">Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {hoveredBubble.user.skills.slice(0, 3).map((skill, idx) =>
                      <Badge key={idx} className="bg-purple-600/20 text-purple-400 border-purple-500/30 text-xs">
                              {skill}
                            </Badge>
                      )}
                        </div>
                      </div>
                  }

                    <div className="flex gap-2">
                      {user && user.email !== hoveredBubble.user.user_email &&
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollow(hoveredBubble.user.user_email);
                      }}
                      className={`flex-1 ${
                      followingList.includes(hoveredBubble.user.user_email) ?
                      "bg-gray-700 hover:bg-gray-600" :
                      "bg-gradient-to-r from-purple-600 to-pink-500"}`
                      }>

                          {followingList.includes(hoveredBubble.user.user_email) ?
                      <>
                              <UserCheck className="w-4 h-4 mr-2" />
                              Following
                            </> :

                      <>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Follow
                            </>
                      }
                        </Button>
                    }
                      <Link to={createPageUrl('PublicProfile') + `?username=${hoveredBubble.user.username}`} className="flex-1">
                        <Button variant="outline" className="w-full border-purple-500/30 text-white hover:bg-purple-500/10">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Profile
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          }
        </AnimatePresence>
      </div>

      {/* User count footer */}
      <div className="text-center">
        <p className="text-sm text-gray-400">
          Showing up to 15 users in the visualization. Use filters to refine your search.
        </p>
      </div>
    </div>);

}