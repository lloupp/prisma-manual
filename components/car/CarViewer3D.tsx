'use client';

import { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import Link from 'next/link';
import { Wrench, ZoomIn, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { vehicle } from '../../data/vehicle';
import { areas } from '../../data/areas';
import { systems } from '../../data/systems';
import { hotspots } from '../../data/hotspots';
import CarModel3D from './CarModel3D';
import * as THREE from 'three';

// Hotspot positions in 3D space mapped to area types
const HOTSPOT_3D: Record<string, { position: [number, number, number]; color: string; label: string; systemId: string }> = {
  engine_bay:    { position: [1.4,  0.5,  0],    color: '#22d3ee', label: 'Motor',         systemId: 'sys-engine-oil' },
  cabin:         { position: [0.1,  0.9,  0],    color: '#34d399', label: 'Cabine',        systemId: 'sys-engine-ignition' },
  trunk:         { position: [-1.4, 0.5,  0],    color: '#fbbf24', label: 'Porta-malas',   systemId: 'sys-electrical' },
  exterior:      { position: [0,    0.4,  1.0],  color: '#e879f9', label: 'Exterior',      systemId: 'sys-wipers' },
  undercarriage: { position: [0,   -0.1,  0],    color: '#fb923c', label: 'Suspensão',     systemId: 'sys-suspension' },
};

function HotspotMesh({
  position, color, label, systemId, onClick,
}: {
  position: [number, number, number];
  color: string;
  label: string;
  systemId: string;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(hovered ? 1.4 : 1.0 + Math.sin(state.clock.elapsedTime * 2) * 0.08);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      <sphereGeometry args={[0.09, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? 1.2 : 0.6} />
    </mesh>
  );
}

function Scene({ onHotspotClick }: { onHotspotClick: (systemId: string) => void }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-5, 3, -5]} intensity={0.4} />
      <pointLight position={[0, 4, 0]} intensity={0.3} color="#90cdf4" />
      <Environment preset="city" />
      <ContactShadows position={[0, -0.62, 0]} opacity={0.5} scale={8} blur={2} far={1} />
      <CarModel3D />
      {Object.entries(HOTSPOT_3D).map(([areaType, hs]) => (
        <HotspotMesh
          key={areaType}
          position={hs.position}
          color={hs.color}
          label={hs.label}
          systemId={hs.systemId}
          onClick={() => onHotspotClick(hs.systemId)}
        />
      ))}
      <OrbitControls
        target={[0, 0.05, 0]}
        enablePan={false}
        minDistance={4}
        maxDistance={10}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.1}
        autoRotate
        autoRotateSpeed={0.6}
      />
    </>
  );
}

export default function CarViewer3D() {
  const [activeSystem, setActiveSystem] = useState<string | null>(null);

  const quickLinks = Object.entries(HOTSPOT_3D).map(([areaType, hs]) => ({
    areaType,
    label: hs.label,
    systemId: hs.systemId,
    color: hs.color,
    description: systems.find(s => s.id === hs.systemId)?.description ?? '',
  }));

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span>🚗</span>
          <span className="font-medium">{vehicle.brand} {vehicle.model} {vehicle.version} {vehicle.year}/{vehicle.modelYear}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <RotateCcw size={13} />
          <span>Arraste para girar · Scroll para zoom</span>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="relative" style={{ height: 300 }}>
        <Canvas
          camera={{ position: [4.5, 1.5, 3.5], fov: 52 }}
          gl={{ antialias: true, alpha: true }}
          shadows
          style={{ background: 'linear-gradient(180deg, #18202e 0%, #0f1419 100%)' }}
        >
          <Suspense fallback={null}>
            <Scene onHotspotClick={(id) => setActiveSystem(id === activeSystem ? null : id)} />
          </Suspense>
        </Canvas>

        {/* Hotspot legend overlay */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
          {quickLinks.map(hs => (
            <button
              key={hs.areaType}
              onClick={() => setActiveSystem(hs.systemId === activeSystem ? null : hs.systemId)}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border transition-all',
                activeSystem === hs.systemId
                  ? 'bg-zinc-700 border-zinc-500 text-white'
                  : 'bg-zinc-900/80 border-zinc-700 text-zinc-400 hover:text-zinc-200'
              )}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: hs.color }} />
              {hs.label}
            </button>
          ))}
        </div>

        {/* Zoom hint */}
        <div className="absolute top-3 right-3 flex items-center gap-1 text-xs text-zinc-500 bg-zinc-950/60 px-2 py-1 rounded-full border border-zinc-800">
          <ZoomIn size={11} />
          <span>Modelo 3D interativo</span>
        </div>
      </div>

      {/* Active system panel */}
      {activeSystem && (() => {
        const sys = systems.find(s => s.id === activeSystem);
        const hs = Object.values(HOTSPOT_3D).find(h => h.systemId === activeSystem);
        if (!sys || !hs) return null;
        return (
          <div className="mx-4 my-3 p-3 rounded-lg border border-zinc-700 bg-zinc-800/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: hs.color }} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-100">{sys.name}</p>
                <p className="text-xs text-zinc-400 truncate">{sys.description}</p>
              </div>
            </div>
            <Link
              href={`/systems/${activeSystem}`}
              className="flex items-center gap-1 text-xs px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition flex-shrink-0"
            >
              <Wrench size={12} />
              Abrir
            </Link>
          </div>
        );
      })()}

      {/* Quick links */}
      <div className="px-4 pb-4">
        <p className="text-xs text-zinc-500 mb-2">Sistemas do veículo:</p>
        <div className="grid grid-cols-1 gap-1.5">
          {quickLinks.map(hs => {
            const sys = systems.find(s => s.id === hs.systemId);
            return (
              <div key={hs.areaType} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: hs.color }} />
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-100">{hs.label}</p>
                    {sys && <p className="text-xs text-zinc-500 truncate">{sys.name}</p>}
                  </div>
                </div>
                <Link
                  href={`/systems/${hs.systemId}`}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-cyan-400 rounded transition"
                >
                  <Wrench size={11} />
                  Abrir
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
