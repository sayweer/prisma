// Cinematic 3D layer — a real glass prism that refracts a bank of bright beams
// into a dispersed spectrum (chromatic aberration), with bloom. Slow auto-rotate
// + pointer parallax. This is the literal embodiment of the brand.
import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

const STILL =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function Prism() {
  const ref = useRef<THREE.Mesh>(null);
  const { pointer } = useThree();
  const geo = useMemo(() => new THREE.CylinderGeometry(1.1, 1.1, 2.85, 3), []);

  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    if (!STILL) m.rotation.y += dt * 0.22;
    m.rotation.x = THREE.MathUtils.lerp(m.rotation.x, 0.26 + pointer.y * 0.25, 0.06);
    m.rotation.z = THREE.MathUtils.lerp(m.rotation.z, -pointer.x * 0.2, 0.06);
  });

  return (
    <mesh ref={ref} geometry={geo}>
      <MeshTransmissionMaterial
        samples={10}
        resolution={1024}
        transmission={1}
        thickness={2.2}
        ior={2.2}
        chromaticAberration={0.6}
        anisotropy={0.2}
        roughness={0}
        distortion={0}
        distortionScale={0}
        temporalDistortion={0}
        clearcoat={1}
        clearcoatRoughness={0}
        color="#eef6ff"
        background={new THREE.Color("#070a12")}
      />
    </mesh>
  );
}

function Beams() {
  // One bright soft beam (the glass splits it into a spectrum) + two wide, dim
  // colour washes for richness. Wide & soft = no high-frequency speckle.
  const bars: Array<[number, number, string, number]> = [
    [0, 0.55, "#ffffff", 1],
    [-2.7, 0.45, "#3fd9ff", 0.18],
    [2.7, 0.45, "#9b8cff", 0.18],
  ];
  return (
    <group position={[0, 0, -2.2]}>
      {bars.map(([x, w, c, o], i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <planeGeometry args={[w, 7]} />
          <meshBasicMaterial color={c} toneMapped={false} transparent opacity={o} />
        </mesh>
      ))}
    </group>
  );
}

export default function Scene3D() {
  return (
    <div className="s3d">
      <Canvas
        camera={{ position: [0, 0, 5.2], fov: 40 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[4, 4, 4]} intensity={50} color="#7fe3ff" />
        <pointLight position={[-4, -2, 3]} intensity={40} color="#b39bff" />
        <Suspense fallback={null}>
          <Beams />
          <Float speed={1.3} rotationIntensity={0.35} floatIntensity={0.7}>
            <Prism />
          </Float>
        </Suspense>
        <EffectComposer>
          <Bloom luminanceThreshold={0.4} intensity={0.6} mipmapBlur radius={0.65} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
