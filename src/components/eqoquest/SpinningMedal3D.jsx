import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export default function SpinningMedal3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(200, 200);
    currentMount.appendChild(renderer.domElement);

    // Get theme color
    const primaryColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-primary')
      .trim();

    // Create medal
    const medalGroup = new THREE.Group();

    // Main medal disc
    const geometry = new THREE.CylinderGeometry(1.2, 1.2, 0.15, 32);
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(primaryColor),
      metalness: 1,
      roughness: 0,
      shininess: 200,
      specular: 0xffffff
    });
    const medal = new THREE.Mesh(geometry, material);
    medal.rotation.x = Math.PI / 2;
    medalGroup.add(medal);

    // Inner circle (lighter shade)
    const innerGeometry = new THREE.CylinderGeometry(0.9, 0.9, 0.16, 32);
    const innerColor = new THREE.Color(primaryColor);
    innerColor.multiplyScalar(1.2); // Lighter
    const innerMaterial = new THREE.MeshPhongMaterial({
      color: innerColor,
      metalness: 1,
      roughness: 0,
      shininess: 250,
      specular: 0xffffff
    });
    const innerCircle = new THREE.Mesh(innerGeometry, innerMaterial);
    innerCircle.rotation.x = Math.PI / 2;
    medalGroup.add(innerCircle);

    // Star in center
    const starShape = new THREE.Shape();
    const outerRadius = 0.5;
    const innerRadius = 0.25;
    const points = 5;
    
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) starShape.moveTo(x, y);
      else starShape.lineTo(x, y);
    }
    starShape.closePath();

    const starGeometry = new THREE.ExtrudeGeometry(starShape, {
      depth: 0.2,
      bevelEnabled: false
    });
    const starMaterial = new THREE.MeshPhongMaterial({
      color: 0xFFFFFF,
      metalness: 1,
      roughness: 0
    });
    const star = new THREE.Mesh(starGeometry, starMaterial);
    star.position.z = 0.1;
    medalGroup.add(star);

    scene.add(medalGroup);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xffffff, 1, 100);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffffff, 0.5, 100);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    camera.position.z = 3;

    // Animation - single rotation
    let rotation = 0;
    const targetRotation = Math.PI * 2; // One full rotation
    const rotationSpeed = 0.02;
    
    const animate = () => {
      if (rotation < targetRotation) {
        rotation += rotationSpeed;
        medalGroup.rotation.y = rotation;
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      } else {
        medalGroup.rotation.y = targetRotation;
        renderer.render(scene, camera);
      }
    };
    animate();

    // Cleanup
    return () => {
      currentMount.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      innerGeometry.dispose();
      innerMaterial.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="w-[200px] h-[200px]" />;
}