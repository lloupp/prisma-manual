'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

/* ── palette ── */
const C = {
  body:    '#3b5268',
  body2:   '#2c3e52',
  dark:    '#0f172a',
  glass:   '#7dd3fc',
  amber:   '#fde68a',
  red:     '#f87171',
  tire:    '#1e293b',
  rim:     '#94a3b8',
  chrome:  '#e2e8f0',
  under:   '#0c1220',
  drl:     '#bfdbfe',
  rubber:  '#374151',
};

/* ── extruded sedan body ── */
function useCarBodyGeo(halfWidth: number) {
  return useMemo(() => {
    const s = new THREE.Shape();
    // Profile (side view, left = rear, right = front, Y = height)
    // Coordinates are tuned for a compact sedan like the Prisma
    s.moveTo(-1.92, -0.28);       // rear bumper bottom
    s.lineTo( 1.92, -0.28);       // front bumper bottom
    s.lineTo( 1.95,  0.0 );       // front bumper top
    s.lineTo( 1.82,  0.06);       // chin below hood
    s.lineTo( 1.25,  0.15);       // hood leading edge
    s.lineTo( 0.82,  0.18);       // hood—windshield junction
    s.bezierCurveTo(
      0.62, 0.22,                 // control 1 — A-pillar kick
      0.52, 0.52,                 // control 2 — A-pillar rise
      0.38, 0.62                  // A-pillar top
    );
    s.lineTo(-0.40, 0.70);        // roofline peak
    s.bezierCurveTo(
      -0.55, 0.71,                // control 1 — roof hold
      -0.68, 0.67,                // control 2 — C-pillar start
      -0.82, 0.56                 // C-pillar base
    );
    s.lineTo(-1.0,  0.20);        // trunk lid start
    s.lineTo(-1.65, 0.13);        // trunk lid rear
    s.lineTo(-1.88, 0.06);        // rear fascia
    s.lineTo(-1.95, 0.0 );        // rear bumper
    s.lineTo(-1.92, -0.28);       // close

    return new THREE.ExtrudeGeometry(s, {
      depth: halfWidth * 2,
      bevelEnabled: false,
    });
  }, [halfWidth]);
}

const FRONT_GLASS_PTS: [number, number][] = [
  [0.80,  0.21],
  [0.37,  0.60],
  [-0.40, 0.68],
  [-0.40, 0.60],
  [0.80,  0.18],
];
const REAR_GLASS_PTS: [number, number][] = [
  [-0.82, 0.54],
  [-0.42, 0.66],
  [-0.42, 0.60],
  [-0.82, 0.22],
];

/* ── glass shape (windshield / rear window extruded as fill) ── */
function useGlassGeo(pts: readonly [number, number][], halfWidth: number) {
  return useMemo(() => {
    const s = new THREE.Shape();
    pts.forEach(([x, y], i) => i === 0 ? s.moveTo(x, y) : s.lineTo(x, y));
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: halfWidth * 2, bevelEnabled: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [halfWidth]);
}

function Wheel({ x, z }: { x: number; z: number }) {
  // Car travels in X direction → wheel disc is in the YZ plane → rotate Z by 90°
  return (
    <group position={[x, -0.31, z]}>
      {/* Tire (torus in YZ plane) */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <torusGeometry args={[0.29, 0.11, 20, 40]} />
        <meshStandardMaterial color={C.tire} roughness={0.95} metalness={0} />
      </mesh>
      {/* Rim disc (cylinder axis → X direction) */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.20, 0.20, 0.07, 22]} />
        <meshStandardMaterial color={C.rim} metalness={0.75} roughness={0.25} />
      </mesh>
      {/* Spokes (rotate around X axis to spread in YZ plane) */}
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} rotation={[(i * Math.PI * 2) / 5, 0, 0]}>
          <boxGeometry args={[0.065, 0.34, 0.038]} />
          <meshStandardMaterial color={C.rim} metalness={0.75} roughness={0.25} />
        </mesh>
      ))}
      {/* Hub cap */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.055, 0.055, 0.10, 12]} />
        <meshStandardMaterial color={C.chrome} metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

export default function CarModel3D() {
  const HW = 0.83; // half-width of body extrusion
  const bodyGeo = useCarBodyGeo(HW);

  const fGlassGeo = useGlassGeo(FRONT_GLASS_PTS, HW - 0.08);
  const rGlassGeo = useGlassGeo(REAR_GLASS_PTS, HW - 0.08);

  return (
    <group position={[0, 0.1, 0]}>

      {/* ── BODY ── */}
      <mesh
        geometry={bodyGeo}
        position={[0, 0, -HW]}
        castShadow receiveShadow
      >
        <meshStandardMaterial color={C.body} metalness={0.55} roughness={0.38} />
      </mesh>

      {/* ── FRONT WINDSHIELD ── */}
      <mesh geometry={fGlassGeo} position={[0, 0, -(HW - 0.08)]} castShadow>
        <meshStandardMaterial color={C.glass} metalness={0.1} roughness={0.05}
          transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>

      {/* ── REAR WINDSHIELD ── */}
      <mesh geometry={rGlassGeo} position={[0, 0, -(HW - 0.08)]} castShadow>
        <meshStandardMaterial color={C.glass} metalness={0.1} roughness={0.05}
          transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>

      {/* ── SIDE WINDOWS (left & right as thin boxes) ── */}
      {/* Front door glass */}
      <mesh position={[0.15, 0.50, HW + 0.001]}>
        <planeGeometry args={[0.72, 0.3]} />
        <meshStandardMaterial color={C.glass} transparent opacity={0.45}
          metalness={0.1} roughness={0.05} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.15, 0.50, -(HW + 0.001)]}>
        <planeGeometry args={[0.72, 0.3]} />
        <meshStandardMaterial color={C.glass} transparent opacity={0.45}
          metalness={0.1} roughness={0.05} side={THREE.DoubleSide} />
      </mesh>
      {/* Rear door glass */}
      <mesh position={[-0.42, 0.50, HW + 0.001]}>
        <planeGeometry args={[0.62, 0.28]} />
        <meshStandardMaterial color={C.glass} transparent opacity={0.45}
          metalness={0.1} roughness={0.05} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-0.42, 0.50, -(HW + 0.001)]}>
        <planeGeometry args={[0.62, 0.28]} />
        <meshStandardMaterial color={C.glass} transparent opacity={0.45}
          metalness={0.1} roughness={0.05} side={THREE.DoubleSide} />
      </mesh>

      {/* ── HEADLIGHTS ── */}
      {([ HW - 0.22,  -(HW - 0.22)] as number[]).map((z, i) => (
        <group key={i}>
          <mesh position={[1.88, 0.08, z]}>
            <boxGeometry args={[0.06, 0.2, 0.42]} />
            <meshStandardMaterial color={C.amber} emissive={C.amber} emissiveIntensity={0.3} metalness={0.1} roughness={0.1} />
          </mesh>
          <mesh position={[1.88, 0.21, z]}>
            <boxGeometry args={[0.05, 0.04, 0.38]} />
            <meshStandardMaterial color={C.drl} emissive={C.drl} emissiveIntensity={1.0} metalness={0} roughness={0.1} />
          </mesh>
        </group>
      ))}

      {/* ── TAILLIGHTS ── */}
      {([HW - 0.22, -(HW - 0.22)] as number[]).map((z, i) => (
        <mesh key={i} position={[-1.88, 0.08, z]}>
          <boxGeometry args={[0.06, 0.2, 0.44]} />
          <meshStandardMaterial color={C.red} emissive={C.red} emissiveIntensity={0.4} metalness={0.1} roughness={0.1} />
        </mesh>
      ))}

      {/* ── GRILLE ── */}
      <mesh position={[1.92, -0.04, 0]}>
        <boxGeometry args={[0.05, 0.15, 0.92]} />
        <meshStandardMaterial color={C.dark} roughness={0.7} />
      </mesh>
      {[-0.02, 0.04].map((y, i) => (
        <mesh key={i} position={[1.93, y, 0]}>
          <boxGeometry args={[0.04, 0.025, 0.88]} />
          <meshStandardMaterial color={C.chrome} metalness={0.9} roughness={0.1} />
        </mesh>
      ))}

      {/* ── EMBLEM front ── */}
      <mesh position={[1.93, 0.18, 0]}>
        <boxGeometry args={[0.04, 0.07, 0.11]} />
        <meshStandardMaterial color={C.chrome} metalness={0.9} roughness={0.1} />
      </mesh>

      {/* ── SIDE MIRRORS ── */}
      <mesh position={[0.76, 0.38,  HW + 0.12]}>
        <boxGeometry args={[0.13, 0.07, 0.19]} />
        <meshStandardMaterial color={C.body2} metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0.76, 0.38, -(HW + 0.12)]}>
        <boxGeometry args={[0.13, 0.07, 0.19]} />
        <meshStandardMaterial color={C.body2} metalness={0.5} roughness={0.4} />
      </mesh>

      {/* ── ROCKER PANELS ── */}
      <mesh position={[0, -0.24,  HW + 0.01]}>
        <boxGeometry args={[3.0, 0.1, 0.06]} />
        <meshStandardMaterial color={C.dark} roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.24, -(HW + 0.01)]}>
        <boxGeometry args={[3.0, 0.1, 0.06]} />
        <meshStandardMaterial color={C.dark} roughness={0.9} />
      </mesh>

      {/* ── REAR PLATE ── */}
      <mesh position={[-1.94, 0.06, 0]}>
        <boxGeometry args={[0.04, 0.1, 0.38]} />
        <meshStandardMaterial color="#f1f5f9" metalness={0} roughness={1} />
      </mesh>

      {/* ── EXHAUST ── */}
      <mesh position={[-1.95, -0.2, -(HW - 0.26)]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.033, 0.033, 0.07, 12]} />
        <meshStandardMaterial color={C.rim} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* ── UNDERCARRIAGE ── */}
      <mesh position={[0, -0.3, 0]} receiveShadow>
        <boxGeometry args={[3.6, 0.05, HW * 2 - 0.1]} />
        <meshStandardMaterial color={C.under} roughness={1} metalness={0} />
      </mesh>

      {/* ── WHEELS ── */}
      <Wheel x={ 1.1} z={ HW} />
      <Wheel x={ 1.1} z={-HW} />
      <Wheel x={-1.1} z={ HW} />
      <Wheel x={-1.1} z={-HW} />

    </group>
  );
}
