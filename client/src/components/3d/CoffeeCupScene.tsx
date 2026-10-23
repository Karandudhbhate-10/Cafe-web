import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export const CoffeeCupScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webGlSupported, setWebGlSupported] = useState<boolean>(true);

  useEffect(() => {
    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGlSupported(false);
        return;
      }
    } catch {
      setWebGlSupported(false);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 1.8, 5.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.replaceChildren(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffedd5, 2.2);
    keyLight.position.set(4, 6, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xc58b54, 1.8);
    rimLight.position.set(-5, 3, -3);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0xfef3c7, 1.2, 10);
    fillLight.position.set(0, -1, 3);
    scene.add(fillLight);

    // 3. Central Cup Group
    const cupGroup = new THREE.Group();
    scene.add(cupGroup);

    // Ceramic materials
    const ceramicMaterial = new THREE.MeshStandardMaterial({
      color: 0x2b1d17, // Espresso Brown
      roughness: 0.22,
      metalness: 0.08,
    });

    const saucerMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f1410,
      roughness: 0.3,
      metalness: 0.05,
    });

    const innerCupMaterial = new THREE.MeshStandardMaterial({
      color: 0xf7f0e5, // Warm cream interior
      roughness: 0.18,
    });

    const coffeeLiquidMaterial = new THREE.MeshStandardMaterial({
      color: 0x24160d, // Dark coffee
      roughness: 0.15,
      metalness: 0.2,
    });

    const cremaRingMaterial = new THREE.MeshStandardMaterial({
      color: 0xc58b54, // Caramel crema ring
      roughness: 0.4,
    });

    // Saucer
    const saucerGeo = new THREE.CylinderGeometry(1.5, 1.1, 0.12, 48);
    const saucer = new THREE.Mesh(saucerGeo, saucerMaterial);
    saucer.position.y = -0.7;
    saucer.receiveShadow = true;
    cupGroup.add(saucer);

    // Saucer rim ridge
    const rimGeo = new THREE.TorusGeometry(1.42, 0.04, 16, 48);
    rimGeo.rotateX(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, saucerMaterial);
    rim.position.y = -0.64;
    cupGroup.add(rim);

    // Cup Body (tapered cylinder)
    const cupOuterGeo = new THREE.CylinderGeometry(1.05, 0.72, 1.2, 48, 1, true);
    const cupOuter = new THREE.Mesh(cupOuterGeo, ceramicMaterial);
    cupOuter.position.y = -0.1;
    cupOuter.castShadow = true;
    cupGroup.add(cupOuter);

    // Cup Bottom base
    const cupBaseGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.08, 48);
    const cupBase = new THREE.Mesh(cupBaseGeo, ceramicMaterial);
    cupBase.position.y = -0.66;
    cupGroup.add(cupBase);

    // Cup Rim lip (smooth torus)
    const lipGeo = new THREE.TorusGeometry(1.05, 0.045, 16, 48);
    lipGeo.rotateX(Math.PI / 2);
    const lip = new THREE.Mesh(lipGeo, innerCupMaterial);
    lip.position.y = 0.5;
    cupGroup.add(lip);

    // Cup Inner cream layer
    const cupInnerGeo = new THREE.CylinderGeometry(1.01, 0.69, 1.16, 48, 1, true);
    const cupInner = new THREE.Mesh(cupInnerGeo, innerCupMaterial);
    cupInner.position.y = -0.08;
    cupGroup.add(cupInner);

    // Coffee Liquid Surface
    const liquidGeo = new THREE.CircleGeometry(0.96, 48);
    liquidGeo.rotateX(-Math.PI / 2);
    const liquid = new THREE.Mesh(liquidGeo, coffeeLiquidMaterial);
    liquid.position.y = 0.38;
    cupGroup.add(liquid);

    // Crema Latte Art Swirl (decorative concentric rings)
    const cremaRingGeo = new THREE.RingGeometry(0.65, 0.88, 48);
    cremaRingGeo.rotateX(-Math.PI / 2);
    const cremaRing = new THREE.Mesh(cremaRingGeo, cremaRingMaterial);
    cremaRing.position.y = 0.385;
    cupGroup.add(cremaRing);

    const cremaCenterGeo = new THREE.CircleGeometry(0.28, 32);
    cremaCenterGeo.rotateX(-Math.PI / 2);
    const cremaCenter = new THREE.Mesh(cremaCenterGeo, cremaRingMaterial);
    cremaCenter.position.y = 0.386;
    cupGroup.add(cremaCenter);

    // Cup Handle (torus curve positioned on the side)
    const handleGeo = new THREE.TorusGeometry(0.42, 0.09, 16, 32, Math.PI * 1.15);
    handleGeo.rotateZ(-Math.PI / 1.7);
    const handle = new THREE.Mesh(handleGeo, ceramicMaterial);
    handle.position.set(1.15, -0.1, 0);
    handle.castShadow = true;
    cupGroup.add(handle);

    // 4. Floating Coffee Beans
    const beanGroup = new THREE.Group();
    scene.add(beanGroup);

    const beanMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d271d,
      roughness: 0.5,
      metalness: 0.1,
    });

    const beanCreaseMaterial = new THREE.MeshStandardMaterial({
      color: 0x1b110c,
      roughness: 0.8,
    });

    // Bean mesh builder
    const createBean = () => {
      const beanSingle = new THREE.Group();
      const bodyGeo = new THREE.SphereGeometry(0.18, 16, 16);
      bodyGeo.scale(1.4, 0.85, 0.85);
      const body = new THREE.Mesh(bodyGeo, beanMaterial);
      beanSingle.add(body);

      // Center seam line
      const seamGeo = new THREE.BoxGeometry(0.38, 0.03, 0.06);
      const seam = new THREE.Mesh(seamGeo, beanCreaseMaterial);
      seam.position.z = 0.14;
      beanSingle.add(seam);

      return beanSingle;
    };

    const beans: { mesh: THREE.Group; orbitRadius: number; speed: number; yBase: number; angle: number }[] = [];
    const beanConfigs = [
      { radius: 2.2, y: 0.4, speed: 0.6, angle: 0 },
      { radius: 2.6, y: -0.5, speed: -0.4, angle: 1.2 },
      { radius: 1.9, y: 1.1, speed: 0.5, angle: 2.5 },
      { radius: 2.4, y: 0.8, speed: -0.7, angle: 3.8 },
      { radius: 2.8, y: -0.2, speed: 0.45, angle: 4.9 },
    ];

    beanConfigs.forEach((cfg) => {
      const bean = createBean();
      beanGroup.add(bean);
      beans.push({
        mesh: bean,
        orbitRadius: cfg.radius,
        speed: cfg.speed,
        yBase: cfg.y,
        angle: cfg.angle,
      });
    });

    // 5. Rising Steam Particles
    const steamParticleCount = 28;
    const steamGeo = new THREE.BufferGeometry();
    const steamPositions = new Float32Array(steamParticleCount * 3);
    const steamLifetimes = new Float32Array(steamParticleCount);
    const steamVelocities = new Float32Array(steamParticleCount);

    for (let i = 0; i < steamParticleCount; i++) {
      steamPositions[i * 3] = (Math.random() - 0.5) * 0.5; // X
      steamPositions[i * 3 + 1] = 0.4 + Math.random() * 1.5; // Y
      steamPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.5; // Z
      steamLifetimes[i] = Math.random();
      steamVelocities[i] = 0.008 + Math.random() * 0.008;
    }

    steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPositions, 3));

    // Custom circular steam texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      grad.addColorStop(0.5, 'rgba(247, 240, 229, 0.25)');
      grad.addColorStop(1, 'rgba(247, 240, 229, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    const steamTexture = new THREE.CanvasTexture(canvas);

    const steamMaterial = new THREE.PointsMaterial({
      size: 0.45,
      map: steamTexture,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const steamPoints = new THREE.Points(steamGeo, steamMaterial);
    scene.add(steamPoints);

    // Initial orientation
    cupGroup.rotation.x = 0.22;
    cupGroup.rotation.y = -0.4;

    // 6. Interactive Cursor Parallax
    let targetRotationX = 0.22;
    let targetRotationY = -0.4;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseX = x;
      mouseY = y;
      targetRotationY = -0.4 + mouseX * 0.35;
      targetRotationX = 0.22 - mouseY * 0.2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    // 7. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth interpolation for parallax
      cupGroup.rotation.x += (targetRotationX - cupGroup.rotation.x) * 0.05;
      cupGroup.rotation.y += (targetRotationY - cupGroup.rotation.y) * 0.05;

      // Gentle floating bob
      cupGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.06;

      // Animate floating coffee beans
      beans.forEach((b, idx) => {
        b.angle += b.speed * 0.015;
        b.mesh.position.x = Math.cos(b.angle) * b.orbitRadius;
        b.mesh.position.z = Math.sin(b.angle) * b.orbitRadius;
        b.mesh.position.y = b.yBase + Math.sin(elapsedTime * 2 + idx) * 0.12;

        b.mesh.rotation.x += 0.02;
        b.mesh.rotation.y += 0.03;
      });

      // Animate rising steam particles
      const posArray = steamGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < steamParticleCount; i++) {
        // Y rises
        posArray[i * 3 + 1] += steamVelocities[i];
        // Slight organic drift
        posArray[i * 3] += Math.sin(elapsedTime * 2 + i) * 0.002;
        posArray[i * 3 + 2] += Math.cos(elapsedTime * 2 + i) * 0.002;

        // Reset if too high
        if (posArray[i * 3 + 1] > 2.2) {
          posArray[i * 3 + 1] = 0.4;
          posArray[i * 3] = (Math.random() - 0.5) * 0.4;
          posArray[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
        }
      }
      steamGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      steamTexture.dispose();
    };
  }, []);

  if (!webGlSupported) {
    // Graceful static fallback with smooth CSS animation
    return (
      <div className="relative w-full h-[380px] sm:h-[460px] flex items-center justify-center select-none pointer-events-none">
        <div className="relative">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-28 bg-gradient-to-t from-white/20 to-transparent blur-md rounded-full animate-steam" />
          <img
            src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80"
            alt="Artisanal Espresso Coffee"
            className="w-64 h-64 sm:w-80 sm:h-80 object-cover rounded-full shadow-2xl border-4 border-caramel/30 animate-float"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-[380px] sm:h-[480px] relative pointer-events-none cursor-grab active:cursor-grabbing select-none"
      title="BREW & BEAN Artisanal 3D Coffee Cup"
    />
  );
};
