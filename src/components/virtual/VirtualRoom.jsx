
import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { VirtualSpaceChat } from "@/entities/VirtualSpaceChat";
import {
  X,
  Send,
  Users,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCw,
  MessageCircle,
  Minimize2,
  Maximize2
} from "lucide-react";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

export default function VirtualRoom({ space, currentUser, onClose }) {
  const mountRef = useRef(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const controlsRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 768);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    loadChatMessages();
  }, [space.id]);

  useEffect(() => {
    if (!mountRef.current) return;

    let renderer, scene, camera;
    let frameId;

    const init = () => {
      // Scene setup
      scene = new THREE.Scene();
      
      // Set environment-specific background
      const environmentColors = {
        space_station: 0x0a0a2e,
        forest: 0x1a3d1a,
        beach: 0x87ceeb,
        city: 0x2c3e50,
        abstract: 0x8b0087,
        neon_city: 0xff00ff,
        underwater: 0x006994,
        mountains: 0x8b7355
      };
      
      scene.background = new THREE.Color(environmentColors[space.environment] || 0x0a0a2e);
      scene.fog = new THREE.Fog(environmentColors[space.environment] || 0x0a0a2e, 10, 50);

      // Camera setup
      camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
      camera.position.set(0, 1.6, 5);

      // Renderer setup
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      mountRef.current.appendChild(renderer.domElement);

      // Controls
      let mouseDown = false;
      let mouseX = 0;
      let mouseY = 0;
      let targetX = 0;
      let targetY = 0;

      const onMouseDown = (event) => {
        mouseDown = true;
        mouseX = event.clientX;
        mouseY = event.clientY;
      };

      const onMouseUp = () => {
        mouseDown = false;
      };

      const onMouseMove = (event) => {
        if (!mouseDown) return;
        
        const deltaX = event.clientX - mouseX;
        const deltaY = event.clientY - mouseY;
        
        targetX += deltaX * 0.01;
        targetY += deltaY * 0.01;
        
        mouseX = event.clientX;
        mouseY = event.clientY;
      };

      const onWheel = (event) => {
        camera.position.z += event.deltaY * 0.01;
        camera.position.z = Math.max(2, Math.min(20, camera.position.z));
      };

      renderer.domElement.addEventListener('mousedown', onMouseDown);
      renderer.domElement.addEventListener('mouseup', onMouseUp);
      renderer.domElement.addEventListener('mousemove', onMouseMove);
      renderer.domElement.addEventListener('wheel', onWheel);

      // Store controls reference
      controlsRef.current = {
        reset: () => {
          camera.position.set(0, 1.6, 5);
          camera.lookAt(0, 1, 0);
          targetX = 0;
          targetY = 0;
        }
      };

      // Lighting setup based on environment
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 10, 5);
      directionalLight.castShadow = true;
      scene.add(directionalLight);

      // Environment-specific lighting
      if (space.environment === 'neon_city') {
        const neonLight1 = new THREE.PointLight(0xff00ff, 1, 20);
        neonLight1.position.set(-5, 3, -5);
        scene.add(neonLight1);
        
        const neonLight2 = new THREE.PointLight(0x00ffff, 1, 20);
        neonLight2.position.set(5, 3, 5);
        scene.add(neonLight2);
      }

      // Floor
      const floorGeometry = new THREE.PlaneGeometry(20, 20);
      const floorMaterial = new THREE.MeshLambertMaterial({ 
        color: space.environment === 'beach' ? 0xffd700 : 0x444444 
      });
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);

      // Add environment-specific objects
      if (space.environment === 'forest') {
        // Add trees
        for (let i = 0; i < 10; i++) {
          const treeGeometry = new THREE.ConeGeometry(0.5, 3, 8);
          const treeMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
          const tree = new THREE.Mesh(treeGeometry, treeMaterial);
          tree.position.set(
            (Math.random() - 0.5) * 15,
            1.5,
            (Math.random() - 0.5) * 15
          );
          tree.castShadow = true;
          scene.add(tree);
        }
      }

      // Add user avatars
      space.current_participants?.forEach((participant, index) => {
        const avatarGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const avatarMaterial = new THREE.MeshLambertMaterial({ 
          color: participant.email === currentUser.email ? 0x00ff00 : 0x0088ff 
        });
        const avatar = new THREE.Mesh(avatarGeometry, avatarMaterial);
        
        // Position avatars in a circle
        const angle = (index / space.current_participants.length) * Math.PI * 2;
        const radius = 3;
        avatar.position.set(
          Math.cos(angle) * radius,
          1,
          Math.sin(angle) * radius
        );
        avatar.castShadow = true;
        scene.add(avatar);

        // Add name label (simplified)
        const nameGeometry = new THREE.PlaneGeometry(2, 0.5);
        const nameTexture = new THREE.CanvasTexture(createNameCanvas(participant.full_name));
        const nameMaterial = new THREE.MeshBasicMaterial({ 
          map: nameTexture, 
          transparent: true 
        });
        const nameLabel = new THREE.Mesh(nameGeometry, nameMaterial);
        nameLabel.position.set(
          avatar.position.x,
          avatar.position.y + 0.8,
          avatar.position.z
        );
        nameLabel.lookAt(camera.position);
        scene.add(nameLabel);
      });

      // Add NFTs from space if any
      if (space.featured_nfts && space.featured_nfts.length > 0) {
        space.featured_nfts.forEach((nft, index) => {
          const frameGeometry = new THREE.BoxGeometry(1, 1, 0.1);
          const frameMaterial = new THREE.MeshLambertMaterial({ color: 0xffd700 });
          const frame = new THREE.Mesh(frameGeometry, frameMaterial);
          
          const angle = (index / space.featured_nfts.length) * Math.PI * 2;
          frame.position.set(
            Math.cos(angle) * 6,
            2,
            Math.sin(angle) * 6
          );
          frame.lookAt(0, 2, 0);
          scene.add(frame);
        });
      }

      // Animation loop
      const animate = () => {
        frameId = requestAnimationFrame(animate);
        
        // Smooth camera rotation
        camera.position.x = Math.sin(targetX) * 5;
        camera.position.z = Math.cos(targetX) * 5;
        camera.position.y = 1.6 + Math.sin(targetY) * 2;
        camera.lookAt(0, 1, 0);
        
        renderer.render(scene, camera);
      };
      animate();

      // Cleanup
      return () => {
        renderer.domElement.removeEventListener('mousedown', onMouseDown);
        renderer.domElement.removeEventListener('mouseup', onMouseUp);
        renderer.domElement.removeEventListener('mousemove', onMouseMove);
        renderer.domElement.removeEventListener('wheel', onWheel);
        cancelAnimationFrame(frameId);
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    };

    const createNameCanvas = (name) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const context = canvas.getContext('2d');
      context.fillStyle = 'rgba(0, 0, 0, 0.8)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = 'white';
      context.font = '20px Arial';
      context.textAlign = 'center';
      context.fillText(name, canvas.width / 2, canvas.height / 2 + 5);
      return canvas;
    };

    init();
  }, [space, currentUser]);

  const loadChatMessages = async () => {
    try {
      const messages = await VirtualSpaceChat.filter({ space_id: space.id }, "-created_date", 50);
      setChatMessages(messages.reverse());
    } catch (error) {
      console.error("Error loading chat messages:", error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await VirtualSpaceChat.create({
        space_id: space.id,
        message: newMessage,
        sender_name: currentUser.full_name,
        sender_avatar: currentUser.avatar_url
      });
      setNewMessage("");
      loadChatMessages();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mountRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex z-50">
      {/* 3D Scene */}
      <div className="flex-1 relative">
        <div ref={mountRef} className="w-full h-full cursor-move" />
        
        {/* Top Bar - Mobile Optimized */}
        <div className="absolute top-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-2 md:p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full bg-gradient-to-r ${
                space.environment === 'space_station' ? 'from-blue-600 to-purple-600' :
                space.environment === 'forest' ? 'from-green-600 to-emerald-600' :
                space.environment === 'beach' ? 'from-cyan-600 to-blue-600' :
                'from-purple-600 to-pink-600'
              }`} />
              <h3 className="text-white font-semibold text-sm md:text-base">{space.name}</h3>
            </div>
            <Badge className="bg-green-600/20 text-green-400 text-xs px-1.5 py-0.5">
              <Users className="w-3 h-3 mr-1" />
              {space.current_participants?.length || 0}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/10 w-8 h-8"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/10 w-8 h-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Controls - Mobile Optimized */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-xl p-2 md:p-4 flex items-center gap-2 md:gap-4"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
                className={`text-white hover:bg-white/10 ${isMuted ? 'bg-red-500/20' : ''}`}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDeafened(!isDeafened)}
                className={`text-white hover:bg-white/10 ${isDeafened ? 'bg-red-500/20' : ''}`}
              >
                {isDeafened ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => controlsRef.current?.reset()}
                className="text-white hover:bg-white/10"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChat(!showChat)}
                className={`text-white hover:bg-white/10 ${showChat ? 'bg-purple-500/20' : ''}`}
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions - Mobile Optimized */}
        <div className="hidden md:block absolute top-20 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
          <p className="font-medium mb-1">Navigation:</p>
          <p>• Click & drag to look around</p>
          <p>• Scroll to zoom in/out</p>
          <p>• Press H to toggle controls</p>
        </div>
      </div>

      {/* Chat Panel - Mobile Optimized */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            key="chat-panel"
            initial={isMobile ? { y: '100%' } : { x: '100%' }}
            animate={{ y: 0, x: 0 }}
            exit={isMobile ? { y: '100%' } : { x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="md:relative md:w-80 md:h-full md:flex-shrink-0
                       fixed bottom-0 left-0 right-0 h-[70vh]
                       bg-black/90 backdrop-blur-sm border-t md:border-t-0 md:border-l border-purple-500/20 flex flex-col z-50"
          >
            {/* Mobile Grab Handle */}
            <div className="md:hidden w-full p-2 flex justify-center items-center cursor-grab" onPointerDown={() => setShowChat(false)}>
              <div className="w-10 h-1.5 bg-gray-600 rounded-full"></div>
            </div>

            <div className="p-4 border-b border-purple-500/20 flex items-center justify-between">
              <h4 className="text-white font-semibold">Space Chat</h4>
              <button onClick={() => setShowChat(false)} className="md:hidden text-gray-400 hover:text-white">
                <X className="w-5 h-5"/>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((message, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    {message.sender_avatar ? (
                      <img src={message.sender_avatar} alt="" className="w-full h-full rounded-full" />
                    ) : (
                      <span className="text-xs text-white">{message.sender_name?.[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-purple-400">{message.sender_name}</span>
                      <span className="text-xs text-gray-500">now</span>
                    </div>
                    <p className="text-sm text-gray-200 break-words">{message.message}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <form onSubmit={handleSendMessage} className="p-4 border-t border-purple-500/20">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="bg-black/20 border-purple-500/20 text-white text-sm"
                />
                <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
