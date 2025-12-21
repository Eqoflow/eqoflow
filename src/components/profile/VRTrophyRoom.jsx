import React, { useRef, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { View, X, RotateCcw } from "lucide-react";
import * as THREE from "three";

export default function VRTrophyRoom({ nfts, onClose }) {
  const mountRef = useRef(null);
  const [selectedNft, setSelectedNft] = useState(null);
  const controlsRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    let renderer, scene, camera, controls;
    let frameId;

    const init = () => {
      // Scene setup
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0a2e);
      scene.fog = new THREE.Fog(0x0a0a2e, 10, 50);

      // Camera setup
      camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
      camera.position.set(0, 1.6, 8);

      // Renderer setup
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      mountRef.current.appendChild(renderer.domElement);

      // Simple controls without OrbitControls
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
        camera.position.z = Math.max(3, Math.min(15, camera.position.z));
      };

      renderer.domElement.addEventListener('mousedown', onMouseDown);
      renderer.domElement.addEventListener('mouseup', onMouseUp);
      renderer.domElement.addEventListener('mousemove', onMouseMove);
      renderer.domElement.addEventListener('wheel', onWheel);

      // Store controls reference for reset function
      controlsRef.current = {
        reset: () => {
          camera.position.set(0, 1.6, 8);
          camera.lookAt(0, 1, 0);
          targetX = 0;
          targetY = 0;
        }
      };

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const spotLight = new THREE.SpotLight(0xffffff, 1.5, 30, Math.PI * 0.2, 0.5);
      spotLight.position.set(0, 15, 0);
      spotLight.castShadow = true;
      spotLight.shadow.mapSize.width = 1024;
      spotLight.shadow.mapSize.height = 1024;
      scene.add(spotLight);

      // Additional point lights for better illumination
      const pointLight1 = new THREE.PointLight(0x8b5cf6, 0.8, 20);
      pointLight1.position.set(5, 5, 5);
      scene.add(pointLight1);

      const pointLight2 = new THREE.PointLight(0xec4899, 0.8, 20);
      pointLight2.position.set(-5, 5, -5);
      scene.add(pointLight2);

      // Floor
      const floorGeometry = new THREE.CircleGeometry(10, 32);
      const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        metalness: 0.8,
        roughness: 0.4,
      });
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);
      
      const textureLoader = new THREE.TextureLoader();

      // Create NFT displays
      nfts.forEach((nft, index) => {
        const angle = (index / nfts.length) * Math.PI * 2;
        const radius = 5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        // Enhanced pedestal with glow effect
        const pedestalGeometry = new THREE.CylinderGeometry(0.5, 0.6, 1.5, 12);
        const pedestalMaterial = new THREE.MeshStandardMaterial({
          color: 0x333333,
          metalness: 0.9,
          roughness: 0.2,
          emissive: 0x8b5cf6,
          emissiveIntensity: 0.1
        });
        const pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
        pedestal.position.set(x, 0.75, z);
        pedestal.castShadow = true;
        scene.add(pedestal);

        // Enhanced NFT frame with better materials
        const frameSize = 1.5;
        const frameGeometry = new THREE.BoxGeometry(frameSize + 0.1, frameSize + 0.1, 0.1);
        const frameMaterial = new THREE.MeshStandardMaterial({
          color: 0xffd700,
          metalness: 1.0,
          roughness: 0.1,
          emissive: 0xffd700,
          emissiveIntensity: 0.2
        });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.set(x, 2.3, z);
        frame.lookAt(0, 2.3, 0);
        scene.add(frame);

        // NFT image plane with better materials
        const imageGeometry = new THREE.PlaneGeometry(frameSize, frameSize);
        const imageTexture = textureLoader.load(nft.image_url, (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
        });
        const imageMaterial = new THREE.MeshStandardMaterial({ 
          map: imageTexture,
          transparent: true
        });
        const imagePlane = new THREE.Mesh(imageGeometry, imageMaterial);
        imagePlane.position.set(x, 2.3, z + 0.051);
        imagePlane.lookAt(0, 2.3, 0);
        scene.add(imagePlane);

        // Add glow effect around the frame
        const glowGeometry = new THREE.RingGeometry(frameSize * 0.7, frameSize * 0.8, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: 0x8b5cf6,
          transparent: true,
          opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.set(x, 2.3, z - 0.1);
        glow.lookAt(0, 2.3, 0);
        scene.add(glow);

        // Add to raycaster objects
        imagePlane.userData = nft;
      });
      
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const onClick = (event) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(scene.children, true);
        const nftObject = intersects.find(i => i.object.userData.token_id);
        
        if (nftObject) {
          setSelectedNft(nftObject.object.userData);
        }
      };

      renderer.domElement.addEventListener('click', onClick);

      // Animation loop
      const animate = () => {
        frameId = requestAnimationFrame(animate);
        
        // Smooth camera movement
        camera.position.x += (Math.sin(targetX) * 8 - camera.position.x) * 0.05;
        camera.position.z += (Math.cos(targetX) * 8 - camera.position.z) * 0.05;
        camera.position.y += (1.6 + Math.sin(targetY) * 2 - camera.position.y) * 0.05;
        camera.lookAt(0, 1, 0);
        
        renderer.render(scene, camera);
      };
      animate();

      const onResize = () => {
        camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      };

      window.addEventListener('resize', onResize);

      // Cleanup
      return () => {
        window.removeEventListener('resize', onResize);
        renderer.domElement.removeEventListener('mousedown', onMouseDown);
        renderer.domElement.removeEventListener('mouseup', onMouseUp);
        renderer.domElement.removeEventListener('mousemove', onMouseMove);
        renderer.domElement.removeEventListener('wheel', onWheel);
        renderer.domElement.removeEventListener('click', onClick);
        cancelAnimationFrame(frameId);
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    };

    init();

  }, [nfts]);
  
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
            <View className="w-6 h-6 text-cyan-400" />
            3D NFT Gallery
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
          
          {/* Controls Instructions */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
            <p className="font-medium mb-1">Controls:</p>
            <p>• Click & drag to rotate</p>
            <p>• Scroll to zoom</p>
            <p>• Click NFTs for details</p>
          </div>
          
          {selectedNft && (
            <div className="absolute bottom-4 left-4 right-4">
              <Card className="dark-card p-4 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <img src={selectedNft.image_url} alt={selectedNft.name} className="w-20 h-20 rounded-lg object-cover" />
                <div className="flex-grow">
                  <h4 className="text-lg font-bold text-white">{selectedNft.name}</h4>
                  <p className="text-sm text-gray-400">{selectedNft.collection_name}</p>
                  <p className="text-sm text-purple-400">Rank: #{selectedNft.rarity_rank}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedNft(null)}>
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