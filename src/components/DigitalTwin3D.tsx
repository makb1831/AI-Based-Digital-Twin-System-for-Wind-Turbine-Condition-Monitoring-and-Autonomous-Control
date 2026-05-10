import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Text } from '@react-three/drei';
import * as THREE from 'three';
import { TelemetryState } from '../types';

interface DigitalTwin3DProps {
  state: TelemetryState;
}

// Subcomponent for the Wind Turbine
function WindTurbine({ state }: { state: TelemetryState }) {
  const rotorRef = useRef<THREE.Group>(null);
  const nacelleRef = useRef<THREE.Group>(null);

  // Apply real-time properties
  useFrame((_, delta) => {
    if (rotorRef.current) {
      // rotorSpeed is in RPM. Convert to rad/sec: RPM * 2*PI / 60
      const radPerSec = (state.rotorSpeed * 2 * Math.PI) / 60;
      rotorRef.current.rotation.z -= radPerSec * delta;
    }
    if (nacelleRef.current) {
      // yaw is degrees, convert to radians
      nacelleRef.current.rotation.y = THREE.MathUtils.degToRad(state.yaw);
    }
  });

  const isWarning = state.status === 'warning';
  const isCritical = state.status === 'critical';
  
  const statusColor = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#3b82f6';
  const materialProps = {
    color: '#e2e8f0',
    metalness: 0.6,
    roughness: 0.2
  };

  return (
    <group position={[0, -2, 0]}>
      {/* Tower */}
      <mesh position={[0, 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.4, 4, 32]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>

      {/* Nacelle & Rotor Group (Yaw applied here) */}
      <group position={[0, 4, 0]} ref={nacelleRef}>
        {/* Nacelle Body */}
        <mesh position={[0, 0, -0.5]} castShadow receiveShadow>
          <boxGeometry args={[0.6, 0.6, 1.5]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
        
        {/* Warning Light on Nacelle */}
        <mesh position={[0, 0.35, -0.8]}>
          <sphereGeometry args={[0.1]} />
          <meshStandardMaterial color={statusColor} emissive={statusColor} emissiveIntensity={2} toneMapped={false} />
        </mesh>

        {/* Rotor Hub (Rotates) */}
        <group position={[0, 0, 0.35]} ref={rotorRef}>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.3, 32, 32]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>

          {/* 3 Blades */}
          {[0, 1, 2].map((i) => {
            const angle = (i * 120 * Math.PI) / 180;
            // Blade pitch is applied to the individual blade's local Y rotation
            const pitchRad = THREE.MathUtils.degToRad(state.bladePitch);
            
            return (
              <group key={i} rotation={[0, 0, angle]}>
                <mesh position={[0, 1.5, 0]} rotation={[0, pitchRad, 0]} castShadow receiveShadow>
                  {/* Flattened cylinder for blade */}
                  <cylinderGeometry args={[0.05, 0.2, 3, 16]} />
                  <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.5} />
                </mesh>
              </group>
            );
          })}
        </group>
      </group>
    </group>
  );
}

export default function DigitalTwin3D({ state }: DigitalTwin3DProps) {
  return (
    <div className="w-full h-full bg-slate-950">
      <Canvas shadows camera={{ position: [5, 2, 4], fov: 50 }}>
        <color attach="background" args={['#020617']} />
        
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1} 
          castShadow 
          shadow-mapSize-width={1024} 
          shadow-mapSize-height={1024} 
        />
        <pointLight position={[-10, -10, -10]} intensity={0.2} />

        <Environment preset="city" />

        <WindTurbine state={state} />

        <ContactShadows 
          position={[0, -2, 0]} 
          opacity={0.4} 
          scale={10} 
          blur={2} 
          far={4} 
        />

        {/* Floating System Status Text */}
        <Text
          position={[-2, 1, 0]}
          color="rgba(255,255,255,0.2)"
          fontSize={0.5}
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.ttf"
        >
          {`AURA_SYS_${state.status.toUpperCase()}`}
        </Text>

        <OrbitControls 
          enablePan={false}
          minDistance={3}
          maxDistance={12}
          maxPolarAngle={Math.PI / 2 + 0.1} 
        />
      </Canvas>
    </div>
  );
}
