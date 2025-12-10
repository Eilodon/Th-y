import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface OrbProps {
  analyser: AnalyserNode | null;
  emotion: string;
}

const EMOTION_COLORS: Record<string, THREE.Color> = {
  anxious: new THREE.Color(1.0, 0.4, 0.0), // Fire Orange
  sad: new THREE.Color(0.2, 0.3, 0.8),     // Deep Ocean Blue
  joyful: new THREE.Color(1.0, 0.8, 0.2),  // Golden Sunshine
  calm: new THREE.Color(0.2, 0.8, 0.5),    // Emerald Forest
  neutral: new THREE.Color(0.8, 0.8, 0.8), // Soft Gray
};

const QuantumOrb: React.FC<OrbProps> = ({ analyser, emotion }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const dataArray = useMemo(() => new Uint8Array(32), []);
  
  // Target values for smooth transitions
  const targetScale = useRef(1);
  const targetColor = useRef(new THREE.Color(EMOTION_COLORS.neutral));

  useEffect(() => {
    const c = EMOTION_COLORS[emotion] || EMOTION_COLORS.neutral;
    targetColor.current.copy(c);
  }, [emotion]);

  useFrame((state, delta) => {
    if (!meshRef.current || !materialRef.current) return;

    const time = state.clock.elapsedTime;

    // 1. Audio Reactivity (Scale)
    if (analyser) {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < 8; i++) sum += dataArray[i];
      const avg = sum / 8;
      const audioScale = 1 + (avg / 255) * 0.6;
      targetScale.current = audioScale;
    } else {
      // Breathing idle animation
      targetScale.current = 1 + Math.sin(time) * 0.05;
    }

    // Spring physics for scale
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale.current, targetScale.current, targetScale.current), 0.1);
    
    // Manual Floating and Rotation (replacing Drei)
    meshRef.current.position.y = Math.sin(time * 0.5) * 0.2; // Float up/down
    meshRef.current.rotation.y += 0.002;
    meshRef.current.rotation.z = Math.sin(time * 0.3) * 0.1;

    // 2. Color Transition
    materialRef.current.color.lerp(targetColor.current, 0.05);
    materialRef.current.emissive.lerp(targetColor.current, 0.05);
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.5, 2]} />
      <meshPhysicalMaterial
        ref={materialRef}
        metalness={0.4}
        roughness={0.2}
        transmission={0.6}
        thickness={2.0}
        clearcoat={1.0}
        clearcoatRoughness={0.1}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
};

const Particles = ({ color }: { color: string }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Create random particles
  const positions = useMemo(() => {
    const count = 50;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 3 + Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y -= 0.001;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="white"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default function OrbViz({ analyser, emotion }: OrbProps) {
  return (
    <div className="w-full h-full absolute inset-0 z-0 pointer-events-none">
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <QuantumOrb analyser={analyser} emotion={emotion} />
        <Particles color={emotion} />
      </Canvas>
    </div>
  );
}