import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

const AnimatedPoints = () => {
  const pointsRef = useRef<THREE.Points>(null);
  
  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.getElapsedTime() * 0.1;
      pointsRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.2) * 0.1;
    }
  });

  const count = 5000; // Aumentando pontos para maior densidade
  const radius = 2.8; // Ajustando raio para forma de cérebro

  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      // Modificando a distribuição para se parecer mais com um cérebro
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta) * 0.8; // Achatando verticalmente
      const z = radius * Math.cos(phi) * 0.9; // Ajustando profundidade
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    return positions;
  }, []);

  const colors = useMemo(() => {
    const colors = new Float32Array(count * 3);
    const color1 = new THREE.Color('#2A15EB');
    const color2 = new THREE.Color('#05D7FB');
    const color3 = new THREE.Color('#DE1CFB'); // Adicionando cor roxa
    
    for (let i = 0; i < count; i++) {
      const mixFactor = Math.random();
      const mixedColor = color1.clone()
        .lerp(mixFactor > 0.5 ? color2 : color3, Math.random());
      
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }
    return colors;
  }, []);

  return (
    <Points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <PointMaterial
        transparent
        vertexColors
        size={0.03}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
};

const NeuralGlobe = () => {
  return (
    <div className="neural-globe-container">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        style={{ 
          background: 'transparent',
          width: '100%',
          height: '100%'
        }}
      >
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} color="#05D7FB" intensity={2} />
        <pointLight position={[-10, -10, -10]} color="#DE1CFB" intensity={1} />
        <AnimatedPoints />
      </Canvas>
    </div>
  );
};

export default NeuralGlobe;