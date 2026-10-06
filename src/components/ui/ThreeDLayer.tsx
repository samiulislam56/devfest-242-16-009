import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Lightweight, restrained Three.js visual layer for the application shell brand badge.
 * Non-blocking, fails gracefully, respects prefers-reduced-motion.
 */
export const ThreeDLayer: React.FC<{ className?: string }> = ({ className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const container = mountRef.current;
    if (!container) return;

    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer | null = null;

    try {
      const width = container.clientWidth || 54;
      const height = container.clientHeight || 54;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(0, 0, 5.2);

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      container.appendChild(renderer.domElement);

      // Create subtle document sheets stack
      const group = new THREE.Group();

      const docGeometry = new THREE.BoxGeometry(1.8, 2.4, 0.05);
      
      // Bottom sheet (navy/slate)
      const matBack = new THREE.MeshBasicMaterial({ color: 0x3b82f6, wireframe: false });
      const meshBack = new THREE.Mesh(docGeometry, matBack);
      meshBack.position.set(-0.15, -0.1, -0.15);
      meshBack.rotation.z = -0.12;
      group.add(meshBack);

      // Top sheet (white/accent border)
      const matFront = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const meshFront = new THREE.Mesh(docGeometry, matFront);
      group.add(meshFront);

      // Wireframe overlay for crisp architectural blueprint look
      const wireMat = new THREE.LineBasicMaterial({ color: 0x1d4ed8 });
      const wireGeom = new THREE.WireframeGeometry(docGeometry);
      const wireMesh = new THREE.LineSegments(wireGeom, wireMat);
      meshFront.add(wireMesh);

      scene.add(group);

      if (prefersReducedMotion) {
        group.rotation.y = 0.25;
        group.rotation.x = 0.15;
        renderer.render(scene, camera);
      } else {
        const render = () => {
          group.rotation.y += 0.008;
          group.rotation.x = Math.sin(Date.now() * 0.001) * 0.1;
          renderer?.render(scene, camera);
          animationFrameId = requestAnimationFrame(render);
        };
        render();
      }
    } catch (e) {
      console.warn('Three.js visual layer initialization skipped:', e);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (renderer) {
        try {
          renderer.dispose();
          if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
          }
        } catch {}
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`w-12 h-12 flex items-center justify-center pointer-events-none select-none ${className}`}
      aria-hidden="true"
    />
  );
};
