// src/components/NeuralNetworkVisual.tsx
import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Vector3 } from 'three';

const NUM_NODES_PER_RING = 60; // Mantido
const NUM_RINGS = 4;          // Mantido
const TOTAL_NODES = NUM_NODES_PER_RING * NUM_RINGS;
const RING_SPACING = 0.58;    // Um pouco mais compacto
const BASE_NODE_SIZE = 0.04;  // Levemente menor para não poluir muito
const CORE_NODE_SIZE = BASE_NODE_SIZE * 0.65; // Core um pouco maior em proporção
const SYNAPSE_COUNT = 110; 
const SYNAPSE_LIFETIME = 3.0; 
const MIN_SYNAPSE_LENGTH = RING_SPACING * 1.4;
const MAX_SYNAPSE_LENGTH = RING_SPACING * (NUM_RINGS + 0.5); // Ajustado

const NODE_PULSE_SPEED = 1.6;
const NODE_ACTIVE_DURATION = 0.7;
// Usar cores da ID Visual para ativação, mais vibrantes
const NODE_ACTIVE_COLOR_PRIMARY = new THREE.Color('#05D7FB');   // Ciano RG Pulse para ativação principal
const NODE_ACTIVE_COLOR_SECONDARY = new THREE.Color('#FFFFFF'); // Branco para um brilho extra

interface NodeState {
  id: number;
  basePosition: Vector3;
  baseColor: THREE.Color;
  currentColor: THREE.Color;
  isPulsingRandomly: boolean;
  randomPulseOffset: number;
  lastActiveTime: number;
}

interface Synapse {
  id: number;
  points: [Vector3, Vector3];
  opacity: number; 
  startTime: number;
  color: THREE.Color;
}

const AnimatedNeuralNetwork = () => {
  const groupRef = useRef<THREE.Group>(null!);
  const [nodes, setNodes] = useState<NodeState[]>([]);
  const [synapses, setSynapses] = useState<Synapse[]>([]);

  useEffect(() => {
    const initialNodes: NodeState[] = [];
    const colorRgBlue = new THREE.Color('#2A15EB'); // Azul principal da RG Pulse
    const colorRgCyan = new THREE.Color('#05D7FB'); // Ciano da RG Pulse
    const colorRgPurple = new THREE.Color('#A855F7'); // Roxo mais claro, pode ser #DE1CFB se preferir mais escuro

    for (let i = 0; i < TOTAL_NODES; i++) {
      const ringIndex = Math.floor(i / NUM_NODES_PER_RING);
      const nodeInRingIndex = i % NUM_NODES_PER_RING;
      
      const radius = ringIndex * RING_SPACING + 0.75; // Ajuste do raio inicial dos anéis
      const angle = (nodeInRingIndex / NUM_NODES_PER_RING) * Math.PI * 2;
      
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      const z = (Math.random() - 0.5) * 0.3 + (ringIndex - (NUM_RINGS-1)/2) * 0.12;

      let baseColor;
      const rand = Math.random();
      if (rand < 0.5) baseColor = colorRgBlue.clone(); // Mais nós azuis escuros
      else if (rand < 0.85) baseColor = colorRgCyan.clone().lerp(colorRgBlue, 0.6); // Ciano mesclado com azul
      else baseColor = colorRgPurple.clone().lerp(colorRgBlue, 0.5); // Roxo mesclado com azul

      if (Math.random() > 0.98) baseColor = new THREE.Color('#FFFFFF'); // Pouquíssimos nós totalmente brancos para brilho extra

      initialNodes.push({
        id: i,
        basePosition: new THREE.Vector3(x, y, z),
        baseColor: baseColor,
        currentColor: baseColor.clone(),
        isPulsingRandomly: Math.random() < 0.12,
        randomPulseOffset: Math.random() * Math.PI * 2,
        lastActiveTime: 0,
      });
    }
    setNodes(initialNodes);
  }, []);

  const { nodeFloatPositions, nodeFloatColors } = useMemo(() => {
    if (nodes.length === 0) {
      return { nodeFloatPositions: new Float32Array(0), nodeFloatColors: new Float32Array(0) };
    }
    const positions = new Float32Array(TOTAL_NODES * 3);
    const colors = new Float32Array(TOTAL_NODES * 3);
    nodes.forEach((node, i) => {
      positions[i * 3] = node.basePosition.x;
      positions[i * 3 + 1] = node.basePosition.y;
      positions[i * 3 + 2] = node.basePosition.z;
      colors[i * 3] = node.currentColor.r; 
      colors[i * 3 + 1] = node.currentColor.g;
      colors[i * 3 + 2] = node.currentColor.b;
    });
    return { nodeFloatPositions: positions, nodeFloatColors: colors };
  }, [nodes]);

  useFrame(({ clock }) => {
    const elapsedTime = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = elapsedTime * 0.03;
      groupRef.current.rotation.x = Math.sin(elapsedTime * 0.07) * 0.015;
      groupRef.current.rotation.z = Math.cos(elapsedTime * 0.06) * 0.02;
    }

    if (nodes.length > 0) {
        setNodes(prevNodes => 
            prevNodes.map(node => {
                let newColor = node.baseColor.clone();
                const timeSinceActive = elapsedTime - node.lastActiveTime;

                if (timeSinceActive < NODE_ACTIVE_DURATION) {
                    const activeProgress = timeSinceActive / NODE_ACTIVE_DURATION;
                    // Interpola entre duas cores de ativação e depois para a baseColor
                    const intermediateActiveColor = NODE_ACTIVE_COLOR_PRIMARY.clone().lerp(NODE_ACTIVE_COLOR_SECONDARY, Math.sin(activeProgress * Math.PI * 2)); // Efeito de piscar entre ciano e branco
                    newColor.lerpColors(intermediateActiveColor, node.baseColor, Math.sqrt(activeProgress)); // sqrt para um fade out mais rápido no início
                } else if (node.isPulsingRandomly) {
                    const pulseFactor = (Math.sin((elapsedTime + node.randomPulseOffset) * NODE_PULSE_SPEED) * 0.5 + 0.5) * 0.55;
                    newColor.lerp(new THREE.Color(0xffffff), pulseFactor);
                }
                return { ...node, currentColor: newColor };
            })
        );
    }

    const currentActiveSynapses = synapses.filter(s => (elapsedTime - s.startTime) < SYNAPSE_LIFETIME);
    const updatedSynapsesWithOpacity = currentActiveSynapses.map(s => {
        const timeProgress = (elapsedTime - s.startTime) / SYNAPSE_LIFETIME;
        const pulseOpacity = Math.sin(Math.min(timeProgress, 1.0) * Math.PI) * (1 - timeProgress * 0.4);
        return { ...s, opacity: Math.max(0, pulseOpacity) };
    });
    
    let synapsesToAddThisFrame: Synapse[] = [];
    if (nodes.length > 0 && updatedSynapsesWithOpacity.length < SYNAPSE_COUNT && Math.random() < 0.22) {
      let node1Index = Math.floor(Math.random() * TOTAL_NODES);
      let node2Index = Math.floor(Math.random() * TOTAL_NODES);
      let p1 = nodes[node1Index]?.basePosition;
      let p2 = nodes[node2Index]?.basePosition;
      let attempts = 0;

      while ((node1Index === node2Index || !p1 || !p2 || p1.distanceTo(p2) < MIN_SYNAPSE_LENGTH || p1.distanceTo(p2) > MAX_SYNAPSE_LENGTH) && attempts < 50) {
        // Lógica de re-seleção de nós (mantida)
        node1Index = Math.floor(Math.random() * TOTAL_NODES);
        node2Index = Math.floor(Math.random() * TOTAL_NODES);
        p1 = nodes[node1Index]?.basePosition;
        p2 = nodes[node2Index]?.basePosition;
        attempts++;
      }
      
      if(node1Index !== node2Index && p1 && p2 && p1.distanceTo(p2) >= MIN_SYNAPSE_LENGTH && p1.distanceTo(p2) <= MAX_SYNAPSE_LENGTH){
        let synapseColor;
        const randColor = Math.random();
        if (randColor < 0.5) synapseColor = new THREE.Color('#05D7FB');      // Ciano (ID Visual)
        else if (randColor < 0.85) synapseColor = new THREE.Color('#A855F7'); // Roxo claro
        else synapseColor = new THREE.Color(0xffffff);                       // Branco

        synapsesToAddThisFrame.push({
          id: Math.random() * Date.now(),
          points: [p1.clone(), p2.clone()],
          opacity: 0, 
          startTime: elapsedTime,
          color: synapseColor,
        });

        setNodes(prevNodes => prevNodes.map(n => {
            if (n.id === node1Index || n.id === node2Index) {
                return { ...n, lastActiveTime: elapsedTime };
            }
            return n;
        }));
      }
    }

    if (synapsesToAddThisFrame.length > 0 || updatedSynapsesWithOpacity.length !== synapses.length) {
        setSynapses(prev => {
            const existingIds = new Set(prev.map(s => s.id));
            const trulyNewToAdd = synapsesToAddThisFrame.filter(s => !existingIds.has(s.id));
            const filteredOld = prev.filter(s => (elapsedTime - s.startTime) < SYNAPSE_LIFETIME)
                                     .map(s => ({...s, opacity: Math.sin(Math.min((elapsedTime - s.startTime) / SYNAPSE_LIFETIME, 1.0) * Math.PI) * (1 - ((elapsedTime - s.startTime) / SYNAPSE_LIFETIME) * 0.4)}));
            return [...filteredOld, ...trulyNewToAdd];
        });
    }
    
  });

  if (nodes.length === 0 || nodeFloatPositions.length === 0) {
    return null;
  }

  return (
    <group ref={groupRef} scale={[1.0, 1.0, 1.0]}>
      <Points key="outer-nodes" positions={nodeFloatPositions} colors={nodeFloatColors} frustumCulled={false}>
        <PointMaterial
          transparent
          vertexColors
          size={BASE_NODE_SIZE}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.95} // Mais opaco para se destacar no fundo claro
        />
      </Points>

       <Points key="core-nodes" positions={nodeFloatPositions} frustumCulled={false}>
        <PointMaterial
          transparent
          // Não usar vertexColors aqui se quisermos forçar uma cor de brilho
          color="#FFFFFF" // Core branco e brilhante
          size={CORE_NODE_SIZE}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.75} // Opacidade do core para um brilho intenso
        />
      </Points>
      
        {synapses.map((synapse) => (
            <Line
              key={synapse.id} 
              points={synapse.points}
              lineWidth={1.1} 
            >
              <lineBasicMaterial 
                  attach="material"
                  color={synapse.color} 
                  transparent={true}
                  opacity={synapse.opacity * 0.7} // Sinapses um pouco mais intensas
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                  toneMapped={false}
              />
            </Line>
        ))}
    </group>
  );
};

const NeuralNetworkVisual = () => {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 60 }} // Ajustado para preencher mais
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }} 
        dpr={[1, 1.5]} 
      >
        <ambientLight intensity={0.1} color="#BFDBFE"/> {/* Tom azul bem suave do fundo do Hero */}
        {/* Luzes mais sutis ou focadas em realçar o 3D, já que AdditiveBlending domina */}
        <pointLight position={[0, 3, 3]} intensity={120} distance={10} decay={1.5} color="#05D7FB" /> 
        <pointLight position={[0, -3, 3]} intensity={90} distance={10} decay={1.5} color="#A855F7" />
        
        <AnimatedNeuralNetwork />
        
        {/* <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.1} enablePan={false} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 3} /> */}
      </Canvas>
    </div>
  );
};

export default NeuralNetworkVisual;