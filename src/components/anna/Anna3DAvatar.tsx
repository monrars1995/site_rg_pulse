import { useRef, Suspense, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, OrbitControls } from '@react-three/drei';
import { motion } from 'framer-motion';
import ErrorBoundary from '../ErrorBoundary';
import * as THREE from 'three';

interface Anna3DAvatarProps {
  className?: string;
}

const AnnaParticles = () => {
  const particlesRef = useRef<THREE.Points>(null);
  const connectionLinesRef = useRef<THREE.LineSegments>(null);

  const count = 300; // Reduzindo número de pontos para melhor performance

  const { positions, indices } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const indices = new Uint16Array(count * count * 2);
    let indexCount = 0;

    for (let i = 0; i < count; i++) {
      const t = Math.random() * Math.PI * 2;
      const u = Math.random() * Math.PI;
      
      // Ajustando proporções para melhor visualização em tamanho menor
      const x = 1.0 * Math.sin(u) * Math.cos(t);
      const y = 1.2 * Math.sin(u) * Math.sin(t);
      const z = 0.7 * Math.cos(u);
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Aumentando densidade das conexões
      for (let j = i + 1; j < count; j++) {
        const distance = Math.sqrt(
          Math.pow(positions[j * 3] - positions[i * 3], 2) +
          Math.pow(positions[j * 3 + 1] - positions[i * 3 + 1], 2) +
          Math.pow(positions[j * 3 + 2] - positions[i * 3 + 2], 2)
        );

        if (distance < 1.0) { // Aumentando distância máxima das conexões
          indices[indexCount++] = i;
          indices[indexCount++] = j;
        }
      }
    }

    return { positions, indices: indices.slice(0, indexCount) };
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (particlesRef.current) {
      particlesRef.current.rotation.y = Math.sin(time * 0.2) * 0.3;
      particlesRef.current.rotation.x = Math.sin(time * 0.15) * 0.2;
    }
    if (connectionLinesRef.current) {
      connectionLinesRef.current.rotation.y = Math.sin(time * 0.2) * 0.3;
      connectionLinesRef.current.rotation.x = Math.sin(time * 0.15) * 0.2;
      connectionLinesRef.current.material.opacity = 0.3 + Math.sin(time * 0.5) * 0.2;
    }
  });

  return (
    <group>
      <Points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <PointMaterial
          transparent
          size={0.05}
          sizeAttenuation={true}
          color="#05D7FB"
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          alphaTest={0.001}
        />
      </Points>

      <lineSegments ref={connectionLinesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="index"
            array={indices}
            itemSize={1}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#2A15EB"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          alphaTest={0.001}
        />
      </lineSegments>
      <OrbitControls enableZoom={false} />
    </group>
  );
};

const Anna3DAvatar = ({ className = '' }: Anna3DAvatarProps) => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <motion.div
        className={`w-[200px] h-[200px] fixed bottom-24 right-8 z-50 cursor-pointer bg-white rounded-full shadow-lg ${className}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Canvas
            camera={{ position: [0, 0, 4], fov: 50 }}
            style={{ 
              background: 'transparent',
              width: '100%',
              height: '100%',
              borderRadius: '50%'
            }}
            gl={{ 
              alpha: true,
              antialias: true,
              powerPreference: 'high-performance'
            }}
          >
            <ambientLight intensity={1.5} />
            <pointLight position={[10, 10, 10]} intensity={2} />
            <AnnaParticles />
          </Canvas>
        </Suspense>
        <motion.div
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg whitespace-nowrap"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm font-medium text-[#2A15EB]">Fale com a Anna</p>
        </motion.div>
      </motion.div>
    </ErrorBoundary>
  );
};

export default Anna3DAvatar;

const LoadingFallback = () => (
  <div className="w-64 h-64 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 animate-pulse flex items-center justify-center">
    <p className="text-gray-500">Loading...</p>
  </div>
);

const ErrorFallback = () => (
  <div className="w-64 h-64 rounded-full bg-red-50 flex items-center justify-center">
    <p className="text-red-500 text-sm">Failed to load avatar</p>
  </div>
);