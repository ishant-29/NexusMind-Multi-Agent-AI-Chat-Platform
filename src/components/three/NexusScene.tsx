"use client";
import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useReducedMotion } from "framer-motion";

type Variant = "full" | "ambient";

const ACCENT = "#67dcf5";
const ACCENT_DEEP = "#1e9ec4";

/** Slowly drifting particle shell with mouse parallax */
function ParticleField({ count, reduce }: { count: number; reduce: boolean }) {
  const points = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // spherical shell with jitter so it reads as depth, not a ball surface
      const r = 6 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  useFrame((state, delta) => {
    if (reduce || !points.current) return;
    points.current.rotation.y += delta * 0.03;
    // gentle parallax toward the pointer
    points.current.rotation.x = THREE.MathUtils.lerp(
      points.current.rotation.x,
      state.pointer.y * 0.12,
      0.04
    );
    points.current.rotation.z = THREE.MathUtils.lerp(
      points.current.rotation.z,
      state.pointer.x * 0.08,
      0.04
    );
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.055}
        color={ACCENT}
        transparent
        opacity={0.75}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** The "mind": nested wireframe icosahedra counter-rotating around a lit core */
function Core({ reduce }: { reduce: boolean }) {
  const outer = useRef<THREE.Mesh>(null);
  const inner = useRef<THREE.Mesh>(null);
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (reduce) return;
    if (outer.current) {
      outer.current.rotation.y += delta * 0.12;
      outer.current.rotation.x += delta * 0.04;
    }
    if (inner.current) {
      inner.current.rotation.y -= delta * 0.2;
      inner.current.rotation.z += delta * 0.06;
    }
    if (group.current) {
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.25;
      group.current.rotation.y = THREE.MathUtils.lerp(
        group.current.rotation.y,
        state.pointer.x * 0.3,
        0.05
      );
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        -state.pointer.y * 0.2,
        0.05
      );
    }
  });

  return (
    <group ref={group}>
      <mesh ref={outer}>
        <icosahedronGeometry args={[2.4, 1]} />
        <meshBasicMaterial
          color={ACCENT_DEEP}
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>
      <mesh ref={inner}>
        <icosahedronGeometry args={[1.55, 0]} />
        <meshBasicMaterial color={ACCENT} wireframe transparent opacity={0.5} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.55, 24, 24]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.9} />
      </mesh>
      {/* halo */}
      <mesh>
        <sphereGeometry args={[0.9, 24, 24]} />
        <meshBasicMaterial
          color={ACCENT}
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/**
 * Ambient 3D backdrop. `full` (auth pages) shows the particle field plus the
 * rotating core; `ambient` (chat empty state) is a quieter field only.
 * Freezes to a static frame under prefers-reduced-motion.
 */
export default function NexusScene({ variant = "full" }: { variant?: Variant }) {
  const reduce = useReducedMotion() ?? false;
  const isFull = variant === "full";

  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 50 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={reduce ? "demand" : "always"}
      style={{ pointerEvents: "none" }}
      eventSource={typeof document !== "undefined" ? document.body : undefined}
    >
      <ParticleField count={isFull ? 2200 : 1200} reduce={reduce} />
      {isFull && <Core reduce={reduce} />}
      <fog attach="fog" args={["#0b0f1a", 10, 22]} />
    </Canvas>
  );
}
