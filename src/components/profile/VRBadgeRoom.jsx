
import React, { useRef, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, RotateCcw, Trophy } from "lucide-react";
import * as THREE from "three";

export default function VRBadgeRoom({ user, onClose }) {
  const mountRef = useRef(null);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const controlsRef = useRef(null);

  // Refs for interactive controls state
  const isMouseDown = useRef(false);
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  // rotationVelocity stores the current rotational speed and direction from user input (flick/drag)
  const rotationVelocity = useRef(new THREE.Vector2(0, 0));
  // currentCabinetRotation stores the actual rotation values for the cabinet, allowing for direct manipulation
  const currentCabinetRotation = useRef(new THREE.Vector2(0, 0)); // x for pitch (up/down), y for yaw (left/right)

  // Get all badges from user
  const getAllBadges = () => {
    const badges = [];

    if (user?.subscription_tier === 'pro') {
      badges.push({
        name: 'Eqo+ Pro',
        icon: 'Sparkles',
        color: 'from-amber-500 to-orange-500',
        textColor: 'text-white',
        type: 'subscription'
      });
    }
    if (user?.subscription_tier === 'creator') {
      badges.push({
        name: 'Eqo+ Creator',
        icon: 'Sparkles',
        color: 'from-purple-500 to-pink-500',
        textColor: 'text-white',
        type: 'subscription'
      });
    }
    if (user?.subscription_tier === 'lite') {
      badges.push({
        name: 'Eqo+ Lite',
        icon: 'Sparkles',
        color: 'from-blue-500 to-cyan-500',
        textColor: 'text-white',
        type: 'subscription'
      });
    }

    if (user?.custom_badges && user.custom_badges.length > 0) {
      user.custom_badges.forEach(badge => {
        badges.push({
          name: badge.name,
          icon: badge.icon,
          color: badge.color,
          textColor: badge.textColor,
          type: 'custom'
        });
      });
    }

    const creatorEmails = ['trevorhenry20@gmail.com', 'sirp.block.chain@gmail.com', 'keith@quantum3.tech'];
    if (creatorEmails.includes(user?.email?.toLowerCase())) {
      badges.push({
        name: 'Creator',
        icon: 'Crown',
        color: 'from-yellow-400 to-orange-500',
        textColor: 'text-black',
        type: 'role'
      });
    }

    const coCEOEmails = ['sirp.block.chain@gmail.com', 'trevorhenry20@gmail.com'];
    if (coCEOEmails.includes(user?.email?.toLowerCase())) {
      badges.push({
        name: 'Co-CEO',
        icon: 'Crown',
        color: 'from-red-500 to-orange-500',
        textColor: 'text-white',
        type: 'role'
      });
    }

    const coFounderEmails = ['sirp.block.chain@gmail.com', 'trevorhenry20@gmail.com', 'keith@quantum3.tech'];
    if (coFounderEmails.includes(user?.email?.toLowerCase())) {
      badges.push({
        name: 'Co-Founder',
        icon: 'Users',
        color: 'from-purple-500 to-indigo-500',
        textColor: 'text-white',
        type: 'role'
      });
    }

    const excludedEmails = ['sirp.block.chain@gmail.com', 'stokes1127@gmail.com', 'trevorhenry20@gmail.com', 'keith@quantum3.tech'];
    if (user?.is_pioneer === true && !excludedEmails.includes(user?.email?.toLowerCase())) {
      badges.push({
        name: 'Pioneer',
        icon: 'Rocket',
        color: 'from-emerald-500 to-teal-500',
        textColor: 'text-white',
        type: 'achievement'
      });
    }

    if (user?.professional_credentials?.is_verified && user?.professional_credentials?.verification_status === 'verified') {
      badges.push({
        name: 'Verified Professional',
        icon: 'Award',
        color: 'from-blue-600 to-cyan-600',
        textColor: 'text-white',
        type: 'verification'
      });
    }

    const identity = user?.cross_platform_identity;
    if (identity) {
      const verifiedPlatforms = identity.web2_verifications?.filter(v => v.verified) || [];
      if (verifiedPlatforms.length > 0) {
        badges.push({
          name: `${verifiedPlatforms.length} Verified`,
          icon: 'Check',
          color: 'from-blue-400 to-blue-600',
          textColor: 'text-white',
          type: 'social'
        });
      }

      const hasWeb3 = (identity.web3_connections?.length || 0) > 0;
      if (hasWeb3) {
        badges.push({
          name: 'Web3 Connected',
          icon: 'Sparkles',
          color: 'from-purple-400 to-purple-600',
          textColor: 'text-white',
          type: 'social'
        });
      }
    }

    return badges;
  };

  const badges = getAllBadges();

  useEffect(() => {
    if (!mountRef.current || !badges || badges.length === 0) return;

    let renderer, scene, camera, cabinetGroup; // Declare cabinetGroup here so it's accessible within useEffect closure
    let frameId;

    const init = () => {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a2e);
      scene.fog = new THREE.Fog(0x1a1a2e, 15, 30);

      // Camera positioned to view front of cabinet
      camera = new THREE.PerspectiveCamera(60, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
      camera.position.set(0, 2, 6);
      camera.lookAt(0, 2, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      mountRef.current.appendChild(renderer.domElement);

      // Mouse controls for rotation
      const onMouseDown = (e) => {
        isMouseDown.current = true;
        mouseX.current = e.clientX;
        mouseY.current = e.clientY;
        rotationVelocity.current.set(0, 0); // Stop any ongoing rotation when user starts dragging
      };

      const onMouseMove = (e) => {
        if (!isMouseDown.current) return;
        
        const deltaX = e.clientX - mouseX.current;
        const deltaY = e.clientY - mouseY.current;
        
        mouseX.current = e.clientX;
        mouseY.current = e.clientY;
        
        // Add to rotation velocity for a "flicking" feel.
        // The outline specified `=`, but `+=` is standard for building up velocity in a drag.
        rotationVelocity.current.y += deltaX * 0.005; // Horizontal mouse movement affects Y-axis rotation
        rotationVelocity.current.x += deltaY * 0.005; // Vertical mouse movement affects X-axis rotation
      };

      const onMouseUp = () => {
        isMouseDown.current = false;
      };

      // Touch controls for mobile
      const onTouchStart = (e) => {
        if (e.touches.length === 1) {
          isMouseDown.current = true;
          mouseX.current = e.touches[0].clientX;
          mouseY.current = e.touches[0].clientY;
          rotationVelocity.current.set(0, 0); // Stop any ongoing rotation
        }
      };

      const onTouchMove = (e) => {
        if (!isMouseDown.current || e.touches.length !== 1) return;
        
        const deltaX = e.touches[0].clientX - mouseX.current;
        const deltaY = e.touches[0].clientY - mouseY.current;
        
        mouseX.current = e.touches[0].clientX;
        mouseY.current = e.touches[0].clientY;
        
        rotationVelocity.current.y += deltaX * 0.005;
        rotationVelocity.current.x += deltaY * 0.005;
      };

      const onTouchEnd = () => {
        isMouseDown.current = false;
      };

      // Mouse wheel for zoom
      const onWheel = (e) => {
        e.preventDefault(); // Prevent page scrolling
        const zoomSpeed = 0.5;
        camera.position.z += e.deltaY * 0.01 * zoomSpeed;
        camera.position.z = Math.max(5, Math.min(20, camera.position.z)); // Clamped range from outline
      };

      // Add event listeners
      renderer.domElement.addEventListener('mousedown', onMouseDown);
      renderer.domElement.addEventListener('mousemove', onMouseMove);
      renderer.domElement.addEventListener('mouseup', onMouseUp);
      renderer.domElement.addEventListener('mouseleave', onMouseUp); // Added for consistency
      renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
      
      // Add touch event listeners for mobile
      renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: true });
      renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: true });
      renderer.domElement.addEventListener('touchend', onTouchEnd, { passive: true });

      controlsRef.current = {
        reset: () => {
          camera.position.set(0, 2, 6);
          camera.lookAt(0, 2, 0);
          // Reset cabinet rotation and velocity
          if (cabinetGroup) {
            cabinetGroup.rotation.set(0, 0, 0);
            currentCabinetRotation.current.set(0, 0);
            rotationVelocity.current.set(0, 0);
          }
        }
      };

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(ambientLight);

      const topLight1 = new THREE.SpotLight(0xffffff, 1.5, 10, Math.PI * 0.3, 0.5);
      topLight1.position.set(-0.8, 4.2, 0);
      topLight1.target.position.set(-0.8, 0, 0);
      topLight1.castShadow = true;
      scene.add(topLight1);
      scene.add(topLight1.target);

      const topLight2 = new THREE.SpotLight(0xffffff, 1.5, 10, Math.PI * 0.3, 0.5);
      topLight2.position.set(0.8, 4.2, 0);
      topLight2.target.position.set(0.8, 0, 0);
      topLight2.castShadow = true;
      scene.add(topLight2);
      scene.add(topLight2.target);

      const accentLight1 = new THREE.PointLight(0x8b5cf6, 0.6, 8);
      accentLight1.position.set(-2, 2, 2);
      scene.add(accentLight1);

      const accentLight2 = new THREE.PointLight(0xec4899, 0.6, 8);
      accentLight2.position.set(2, 2, 2);
      scene.add(accentLight2);

      // Create cabinet group
      cabinetGroup = new THREE.Group();
      scene.add(cabinetGroup);
      // Initialize cabinet's rotation from stored ref values
      cabinetGroup.rotation.set(currentCabinetRotation.current.x, currentCabinetRotation.current.y, 0);

      // Cabinet dimensions
      const cabinetWidth = 2.4;
      const cabinetHeight = 4;
      const cabinetDepth = 1;
      const frameThickness = 0.05;

      // Materials
      const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        metalness: 0.8,
        roughness: 0.2,
      });

      const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.1,
        roughness: 0.1,
        transparent: true,
        opacity: 0.15,
        transmission: 0.9,
        thickness: 0.5,
      });

      // Base
      const baseGeometry = new THREE.BoxGeometry(cabinetWidth, 0.4, cabinetDepth);
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
        metalness: 0.6,
        roughness: 0.3,
      });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.y = 0.2;
      base.castShadow = true;
      base.receiveShadow = true;
      cabinetGroup.add(base);

      // Frame edges
      const frameGeometry = new THREE.BoxGeometry(frameThickness, cabinetHeight, frameThickness);
      const corners = [
        [-cabinetWidth/2, cabinetHeight/2 + 0.4, -cabinetDepth/2],
        [cabinetWidth/2, cabinetHeight/2 + 0.4, -cabinetDepth/2],
        [-cabinetWidth/2, cabinetHeight/2 + 0.4, cabinetDepth/2],
        [cabinetWidth/2, cabinetHeight/2 + 0.4, cabinetDepth/2],
      ];

      corners.forEach(pos => {
        const post = new THREE.Mesh(frameGeometry, frameMaterial);
        post.position.set(...pos);
        post.castShadow = true;
        cabinetGroup.add(post);
      });

      // Top frame
      const topFrameGeometry = new THREE.BoxGeometry(cabinetWidth, frameThickness, cabinetDepth);
      const topFrame = new THREE.Mesh(topFrameGeometry, frameMaterial);
      topFrame.position.y = cabinetHeight + 0.4;
      topFrame.castShadow = true;
      cabinetGroup.add(topFrame);

      // Glass front
      const glassFrontGeometry = new THREE.BoxGeometry(cabinetWidth - frameThickness * 2, cabinetHeight, 0.02);
      const glassFront = new THREE.Mesh(glassFrontGeometry, glassMaterial);
      glassFront.position.set(0, cabinetHeight/2 + 0.4, cabinetDepth/2 + 0.01);
      cabinetGroup.add(glassFront);

      // Glass back (matching front for full transparency)
      const glassBack = new THREE.Mesh(glassFrontGeometry, glassMaterial);
      glassBack.position.set(0, cabinetHeight/2 + 0.4, -cabinetDepth/2 - 0.01);
      cabinetGroup.add(glassBack);

      // Glass sides
      const glassSideGeometry = new THREE.BoxGeometry(0.02, cabinetHeight, cabinetDepth - 0.1);
      const glassLeft = new THREE.Mesh(glassSideGeometry, glassMaterial);
      glassLeft.position.set(-cabinetWidth/2, cabinetHeight/2 + 0.4, 0);
      cabinetGroup.add(glassLeft);

      const glassRight = new THREE.Mesh(glassSideGeometry, glassMaterial);
      glassRight.position.set(cabinetWidth/2, cabinetHeight/2 + 0.4, 0);
      cabinetGroup.add(glassRight);

      // Shelves - make them more visible
      const numShelves = 4;
      const shelfSpacing = (cabinetHeight - 0.2) / numShelves;
      const shelves = [];

      const solidShelfMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.5,
        roughness: 0.3,
        transparent: true,
        opacity: 0.8, // More opaque so shelves are visible
      });

      for (let i = 0; i < numShelves; i++) {
        const shelfGeometry = new THREE.BoxGeometry(cabinetWidth - 0.2, 0.05, cabinetDepth - 0.2);
        const shelf = new THREE.Mesh(shelfGeometry, solidShelfMaterial);
        const shelfY = 0.6 + (i * shelfSpacing);
        shelf.position.y = shelfY;
        shelf.receiveShadow = true;
        shelf.castShadow = true;
        cabinetGroup.add(shelf);
        shelves.push(shelfY);
      }

      // Icon mapping
      const iconSymbols = {
        'Sparkles': '✨',
        'Crown': '👑',
        'Users': '👥',
        'Award': '🏆',
        'Check': '✓',
        'Rocket': '🚀',
        'DollarSign': '$'
      };

      // Position badges on shelves - CENTER THEM for visibility from both sides
      const badgesPerShelf = Math.ceil(badges.length / numShelves);

      badges.forEach((badge, index) => {
        const shelfIndex = Math.floor(index / badgesPerShelf);
        const positionOnShelf = index % badgesPerShelf;
        const totalOnThisShelf = Math.min(badgesPerShelf, badges.length - shelfIndex * badgesPerShelf);
        
        if (shelfIndex >= numShelves) return;

        const shelfY = shelves[shelfIndex] + 0.2; // Slightly above shelf
        const spacing = (cabinetWidth - 0.8) / Math.max(totalOnThisShelf, 1);
        const startX = -(spacing * (totalOnThisShelf - 1)) / 2;
        const x = startX + (positionOnShelf * spacing);
        const z = 0; // CENTER of cabinet - visible from both front and back

        // Create badge canvas with larger size for better visibility
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Get gradient colors
        const gradientMatch = badge.color.match(/from-(\w+)-(\d+)\s+to-(\w+)-(\d+)/);
        let color1 = '#8b5cf6';
        let color2 = '#ec4899';
        
        if (gradientMatch) {
          const colorMap = {
            'amber': '#f59e0b', 'orange': '#f97316', 'purple': '#a855f7', 'pink': '#ec4899',
            'blue': '#3b82f6', 'cyan': '#06b6d4', 'yellow': '#eab308', 'red': '#ef4444',
            'emerald': '#10b981', 'teal': '#14b8a6', 'indigo': '#6366f1'
          };
          color1 = colorMap[gradientMatch[1]] || color1;
          color2 = colorMap[gradientMatch[3]] || color2;
        }

        const threeColor1 = new THREE.Color(color1);

        // Draw gradient background with ROUNDED EDGES
        const gradient = ctx.createLinearGradient(0, 0, 512, 256);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        ctx.fillStyle = gradient;
        
        const cornerRadius = 50; // Even larger corner radius for very round edges
        ctx.beginPath();
        ctx.moveTo(cornerRadius, 0);
        ctx.lineTo(512 - cornerRadius, 0);
        ctx.quadraticCurveTo(512, 0, 512, cornerRadius);
        ctx.lineTo(512, 256 - cornerRadius);
        ctx.quadraticCurveTo(512, 256, 512 - cornerRadius, 256);
        ctx.lineTo(cornerRadius, 256);
        ctx.quadraticCurveTo(0, 256, 0, 256 - cornerRadius);
        ctx.lineTo(0, cornerRadius);
        ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
        ctx.closePath();
        ctx.fill();

        // Draw icon and text - BRIGHT BRIGHT WHITE with strong outline
        const textColor = badge.textColor === 'text-black' ? '#000000' : '#FFFFFF';
        
        // Add strong white outline/stroke for maximum visibility
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 8;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        const iconSymbol = iconSymbols[badge.icon] || '★';
        ctx.font = 'bold 110px Arial'; // Even bigger icon
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw icon with stroke first, then fill
        ctx.strokeText(iconSymbol, 90, 128);
        ctx.fillStyle = textColor;
        ctx.fillText(iconSymbol, 90, 128);

        // Draw text with stroke first, then fill
        ctx.font = 'bold 55px Arial'; // Even bigger text
        ctx.strokeText(badge.name, 310, 128);
        ctx.fillStyle = textColor;
        ctx.fillText(badge.name, 310, 128);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Create badge mesh - HIGHLY VISIBLE
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        const badgeWidth = 0.6;
        const badgeHeight = 0.3;
        const badgeGeometry = new THREE.PlaneGeometry(badgeWidth, badgeHeight);
        const badgeMaterial = new THREE.MeshStandardMaterial({ 
          map: texture,
          transparent: false, // Make it solid, not transparent
          side: THREE.DoubleSide, // Visible from both sides
          emissive: threeColor1,
          emissiveIntensity: 0.5, // More glow
          metalness: 0.3,
          roughness: 0.7
        });
        const badgeMesh = new THREE.Mesh(badgeGeometry, badgeMaterial);
        badgeMesh.position.set(x, shelfY, z);
        badgeMesh.castShadow = true;
        badgeMesh.receiveShadow = true;
        badgeMesh.userData = badge;
        cabinetGroup.add(badgeMesh);

        // Add BRIGHT glow behind badge
        const glowGeometry = new THREE.PlaneGeometry(badgeWidth + 0.15, badgeHeight + 0.15);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: threeColor1,
          transparent: true,
          opacity: 0.5, // Brighter glow
          side: THREE.DoubleSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.set(x, shelfY, z - 0.01);
        cabinetGroup.add(glow);
      });
      
      // Raycaster for clicking badges
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const onClick = (event) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(cabinetGroup.children, true);
        const badgeObject = intersects.find(i => i.object.userData.name);
        
        if (badgeObject) {
          setSelectedBadge(badgeObject.object.userData);
        }
      };

      renderer.domElement.addEventListener('click', onClick);

      // Animation loop
      const animate = () => {
        frameId = requestAnimationFrame(animate);
        
        // Apply rotation velocity to the cabinet
        cabinetGroup.rotation.y += rotationVelocity.current.y;
        cabinetGroup.rotation.x += rotationVelocity.current.x;

        // Clamp vertical rotation (X-axis) to prevent flipping
        cabinetGroup.rotation.x = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, cabinetGroup.rotation.x));

        // Decay rotation velocity for inertia effect
        rotationVelocity.current.multiplyScalar(0.92); // Damping factor

        // Store current rotation for next frame/reset
        currentCabinetRotation.current.x = cabinetGroup.rotation.x;
        currentCabinetRotation.current.y = cabinetGroup.rotation.y;
        
        renderer.render(scene, camera);
      };
      animate();

      const onResize = () => {
        camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      };

      window.addEventListener('resize', onResize);

      return () => {
        window.removeEventListener('resize', onResize);
        // Remove mouse event listeners
        renderer.domElement.removeEventListener('mousedown', onMouseDown);
        renderer.domElement.removeEventListener('mouseup', onMouseUp);
        renderer.domElement.removeEventListener('mousemove', onMouseMove);
        renderer.domElement.removeEventListener('mouseleave', onMouseUp);
        renderer.domElement.removeEventListener('wheel', onWheel);
        
        // Remove touch event listeners
        renderer.domElement.removeEventListener('touchstart', onTouchStart);
        renderer.domElement.removeEventListener('touchmove', onTouchMove);
        renderer.domElement.removeEventListener('touchend', onTouchEnd);
        
        renderer.domElement.removeEventListener('click', onClick);
        cancelAnimationFrame(frameId);
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    };

    return init();

  }, [badges]);

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="dark-card w-full max-w-5xl h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between flex-shrink-0">
          <CardTitle className="text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            3D Badge Trophy Cabinet
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" onClick={resetCamera}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-grow p-0 relative">
          <div 
            ref={mountRef} 
            className="w-full h-full rounded-b-xl overflow-hidden bg-black cursor-grab active:cursor-grabbing"
          />
          
          {selectedBadge && (
            <div className="absolute bottom-4 left-4 right-4">
              <Card className="dark-card p-4 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={`px-4 py-2 rounded-lg bg-gradient-to-r ${selectedBadge.color} flex items-center justify-center`}>
                  <span className={`font-bold ${selectedBadge.textColor}`}>{selectedBadge.name}</span>
                </div>
                <div className="flex-grow">
                  <h4 className="text-lg font-bold text-white">{selectedBadge.name}</h4>
                  <p className="text-sm text-gray-400 capitalize">{selectedBadge.type} Badge</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedBadge(null)}>
                  <X className="w-4 h-4"/>
                </Button>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
