"use client";

import React, { useRef, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations, OrbitControls, PerspectiveCamera, Environment } from "@react-three/drei";
import * as THREE from "three";

interface CharacterModelProps {
    url: string;
    position: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
    isActive: boolean;
    label?: string;
}

interface PBRMaterial extends THREE.Material {
    envMapIntensity?: number;
    metalness?: number;
    roughness?: number;
    map?: THREE.Texture | null;
    color?: THREE.Color;
}

// GLTF Character Loader - uses original scene (no clone needed for single instances)
function AnimatedCharacter({
    url,
    position,
    rotation = [0, 0, 0],
    scale = 0.01,
    isActive,
    label = "Character"
}: CharacterModelProps) {
    const group = useRef<THREE.Group>(null);
    const { scene, animations } = useGLTF(url);
    const { actions, mixer } = useAnimations(animations, group);

    // Setup scene materials and shadows
    useEffect(() => {
        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                mesh.frustumCulled = false;

                // Ensure materials utilize env map
                const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                materials.forEach(mat => {
                    if (mat) {
                        try {
                            const m = mat as PBRMaterial;
                            // FIX: Reset PBR properties that might cause darkness
                            m.envMapIntensity = 1.2; // Moderate boost
                            m.metalness = 0;         // Prevent metallic darkening
                            m.roughness = 0.7;       // Standard matte-ish finish

                            // IF we have a texture map, ensure base color is white so it shows
                            // IF we DON'T have a map, keep the original color (don't overwrite with white)
                            if (m.map) {
                                if (m.color) m.color.setHex(0xffffff);
                                m.map.colorSpace = THREE.SRGBColorSpace; // Ensure correct color space interpretation
                            }

                            mat.needsUpdate = true;
                        } catch (e) {
                            console.warn("Failed to update material:", e);
                        }
                    }
                });
            }
        });
    }, [scene]);

    // Play the Mixamo animation
    useEffect(() => {
        if (actions) {
            const animationNames = Object.keys(actions);
            console.log(`[${label}] Available animations:`, animationNames);

            // Mixamo exports animations with "mixamo.com" as the name
            const selectedAction = actions["mixamo.com"]
                || actions["Idle"]
                || actions["idle"]
                || actions[animationNames[0]];

            if (selectedAction) {
                console.log(`[${label}] Playing animation`);
                selectedAction.reset().fadeIn(0.3).play();
            }
        }

        return () => {
            if (mixer) mixer.stopAllAction();
        };
    }, [actions, mixer, label]);

    // Bobbing motion when speaking
    useFrame((state) => {
        if (!group.current) return;

        if (isActive) {
            group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 4) * 0.03;
        } else {
            group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, position[1], 0.1);
        }
    });

    return (
        <group ref={group} position={position} rotation={rotation} scale={scale}>
            <primitive object={scene} />
            {/* Speaking indicator */}
            {isActive && (
                <mesh position={[0, 200, 0]}>
                    <sphereGeometry args={[8, 16, 16]} />
                    <meshBasicMaterial color="#00ff00" />
                </mesh>
            )}
        </group>
    );
}

// Camera controller with smooth transitions
interface CameraControllerProps {
    target: "wide" | "teacher" | "student" | "board";
    activeSpeaker: string | null;
}

function CameraController({ target, activeSpeaker }: CameraControllerProps) {
    const { camera } = useThree();
    const targetPosition = useRef(new THREE.Vector3(0, 2, 5));
    const targetLookAt = useRef(new THREE.Vector3(0, 1, 0));

    useFrame(() => {
        // Determine target based on active speaker
        let newTarget = target;
        if (activeSpeaker === "host_1") {
            newTarget = "teacher";
        } else if (activeSpeaker === "host_2") {
            newTarget = "student";
        }

        // Camera positions for each target
        const positions = {
            wide: new THREE.Vector3(0, 2.5, 6),
            teacher: new THREE.Vector3(-2, 2, 3),
            student: new THREE.Vector3(2, 2, 3),
            board: new THREE.Vector3(0, 2, 2),
        };

        const lookAts = {
            wide: new THREE.Vector3(0, 1, 0),
            teacher: new THREE.Vector3(-1.5, 1.2, -1),
            student: new THREE.Vector3(1.5, 1.2, 1),
            board: new THREE.Vector3(0, 1.5, -3),
        };

        // Smooth interpolation
        targetPosition.current.lerp(positions[newTarget], 0.02);
        targetLookAt.current.lerp(lookAts[newTarget], 0.02);

        camera.position.copy(targetPosition.current);
        camera.lookAt(targetLookAt.current);
    });

    return null;
}

interface Classroom3DAdvancedProps {
    activeSpeaker: string | null;
    isPlaying: boolean;
    teacherModelUrl?: string;
    studentModelUrl?: string;
}

// Chalkboard component
function Chalkboard() {
    return (
        <group position={[0, 1.5, -3]}>
            {/* Frame */}
            <mesh castShadow receiveShadow>
                <boxGeometry args={[4.5, 2.8, 0.1]} />
                <meshStandardMaterial color="#5c4033" />
            </mesh>
            {/* Board surface */}
            <mesh position={[0, 0, 0.06]}>
                <boxGeometry args={[4.3, 2.6, 0.02]} />
                <meshStandardMaterial color="#1a3028" />
            </mesh>
            {/* Chalk tray */}
            <mesh position={[0, -1.5, 0.15]} castShadow>
                <boxGeometry args={[4.3, 0.12, 0.25]} />
                <meshStandardMaterial color="#5c4033" />
            </mesh>
            {/* Chalk pieces */}
            <mesh position={[-1.5, -1.45, 0.25]} castShadow>
                <boxGeometry args={[0.3, 0.06, 0.06]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[-1, -1.45, 0.25]} castShadow>
                <boxGeometry args={[0.25, 0.06, 0.06]} />
                <meshStandardMaterial color="#ffeb3b" />
            </mesh>
        </group>
    );
}

// Floor with wood texture simulation
function WoodenFloor() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[14, 14]} />
            <meshStandardMaterial color="#c4a574" roughness={0.8} />
        </mesh>
    );
}

// Classroom walls
function Walls() {
    return (
        <>
            {/* Back wall */}
            <mesh position={[0, 2.5, -4]} receiveShadow>
                <boxGeometry args={[14, 5, 0.2]} />
                <meshStandardMaterial color="#f5f0e6" />
            </mesh>
            {/* Left wall */}
            <mesh position={[-7, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                <boxGeometry args={[8, 5, 0.2]} />
                <meshStandardMaterial color="#f0ebe0" />
            </mesh>
        </>
    );
}

// Student desk
function Desk({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            {/* Desktop */}
            <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.4, 0.06, 0.7]} />
                <meshStandardMaterial color="#8b4513" />
            </mesh>
            {/* Front panel */}
            <mesh position={[0, 0.35, -0.32]} castShadow>
                <boxGeometry args={[1.3, 0.35, 0.04]} />
                <meshStandardMaterial color="#7a3c10" />
            </mesh>
            {/* Legs */}
            {[
                [-0.6, 0.27, -0.28],
                [0.6, 0.27, -0.28],
                [-0.6, 0.27, 0.28],
                [0.6, 0.27, 0.28],
            ].map((pos, i) => (
                <mesh key={i} position={pos as [number, number, number]} castShadow>
                    <boxGeometry args={[0.05, 0.55, 0.05]} />
                    <meshStandardMaterial color="#5c4033" />
                </mesh>
            ))}
        </group>
    );
}

// Placeholder character (capsule + sphere)
function PlaceholderCharacter({
    position,
    color,
    isActive
}: {
    position: [number, number, number];
    color: string;
    isActive: boolean;
}) {
    const meshRef = useRef<THREE.Mesh>(null);
    const headRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current && isActive) {
            meshRef.current.position.y = position[1] + 0.5 + Math.sin(state.clock.elapsedTime * 4) * 0.05;
        }
        if (headRef.current && isActive) {
            headRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 3) * 0.15;
            headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
        }
    });

    return (
        <group position={position}>
            {/* Body */}
            <mesh ref={meshRef} position={[0, 0.5, 0]} castShadow>
                <capsuleGeometry args={[0.25, 0.6, 4, 8]} />
                <meshStandardMaterial
                    color={isActive ? color : "#999999"}
                    roughness={0.4}
                />
            </mesh>

            {/* Head */}
            <mesh ref={headRef} position={[0, 1.15, 0]} castShadow>
                <sphereGeometry args={[0.22, 16, 16]} />
                <meshStandardMaterial
                    color={isActive ? "#ffdbac" : "#cccccc"}
                    roughness={0.5}
                />
            </mesh>

            {/* Eyes */}
            <mesh position={[-0.08, 1.18, 0.18]}>
                <sphereGeometry args={[0.03, 8, 8]} />
                <meshBasicMaterial color="#333333" />
            </mesh>
            <mesh position={[0.08, 1.18, 0.18]}>
                <sphereGeometry args={[0.03, 8, 8]} />
                <meshBasicMaterial color="#333333" />
            </mesh>

            {/* Speaking indicator */}
            {isActive && (
                <group position={[0, 1.5, 0]}>
                    {[0, 1, 2].map((i) => (
                        <mesh key={i} position={[0.15 * (i - 1), 0, 0]}>
                            <sphereGeometry args={[0.04, 8, 8]} />
                            <meshBasicMaterial color="#00ff00" />
                        </mesh>
                    ))}
                </group>
            )}
        </group>
    );
}

const Classroom3DAdvanced: React.FC<Classroom3DAdvancedProps> = ({
    activeSpeaker,
    isPlaying,
    teacherModelUrl,
    studentModelUrl
}) => {
    return (
        <div className="w-full aspect-video border-2 border-black bg-[#f0f0f0] relative">
            <Canvas shadows>
                <PerspectiveCamera makeDefault position={[0, 2.5, 6]} fov={45} />

                {/* Camera Controller - auto-follows active speaker */}
                <CameraController target="wide" activeSpeaker={isPlaying ? activeSpeaker : null} />

                {/* Orbit controls for manual override */}
                <OrbitControls
                    enableZoom={true}
                    enablePan={false}
                    minDistance={2}
                    maxDistance={10}
                    minPolarAngle={Math.PI / 6}
                    maxPolarAngle={Math.PI / 2.2}
                />

                {/* Lighting */}
                <ambientLight intensity={0.5} />
                <directionalLight
                    position={[5, 8, 5]}
                    intensity={0.8}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                    shadow-camera-far={20}
                    shadow-camera-left={-10}
                    shadow-camera-right={10}
                    shadow-camera-top={10}
                    shadow-camera-bottom={-10}
                />
                <pointLight position={[-5, 3, 2]} intensity={0.3} color="#fff5e0" />
                <Environment preset="city" />

                <Suspense fallback={null}>
                    {/* Room */}
                    <WoodenFloor />
                    <Walls />
                    <Chalkboard />

                    {/* Teacher - either GLTF model or placeholder */}
                    {teacherModelUrl ? (
                        <AnimatedCharacter
                            url={teacherModelUrl}
                            position={[-1.8, 0, -1.5]}
                            rotation={[0, 0.3, 0]}
                            scale={0.008}
                            isActive={activeSpeaker === "host_1"}
                            label="Teacher"
                        />
                    ) : (
                        <PlaceholderCharacter
                            position={[-1.8, 0, -1.5]}
                            color="#0066FF"
                            isActive={activeSpeaker === "host_1"}
                        />
                    )}

                    {/* Student - either GLTF model or placeholder */}
                    {studentModelUrl ? (
                        <AnimatedCharacter
                            url={studentModelUrl}
                            position={[1.8, 0, 1.5]}
                            rotation={[0, -0.5, 0]}
                            scale={0.01}
                            isActive={activeSpeaker === "host_2"}
                            label="Student"
                        />
                    ) : (
                        <PlaceholderCharacter
                            position={[1.8, 0, 1.5]}
                            color="#FF3D00"
                            isActive={activeSpeaker === "host_2"}
                        />
                    )}

                    {/* Desks */}
                    <Desk position={[-1.8, 0, -0.5]} />
                    <Desk position={[1.8, 0, 2.2]} />
                </Suspense>
            </Canvas>

            {/* Overlay labels */}
            <div className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 flex flex-col sm:flex-row gap-2 sm:gap-4 pointer-events-none">
                <div className={`
                    flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl border-2 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] font-black uppercase tracking-wider text-[10px] sm:text-sm transition-all transform duration-300
                    ${activeSpeaker === 'host_1' ? 'bg-[#0066FF] text-white scale-110 -translate-y-2 ring-4 ring-white/20' : 'bg-white text-gray-400 scale-100 opacity-90'}
                `}>
                    <div className="p-1.5 bg-white/20 rounded-full backdrop-blur-sm">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                            <path d="M6 12v5c3 3 9 3 12 0v-5" />
                        </svg>
                    </div>
                    <span>Professor</span>
                </div>
                <div className={`
                     flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl border-2 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] font-black uppercase tracking-wider text-[10px] sm:text-sm transition-all transform duration-300
                    ${activeSpeaker === 'host_2' ? 'bg-[#FF3D00] text-white scale-110 -translate-y-2 ring-4 ring-white/20' : 'bg-white text-gray-400 scale-100 opacity-90'}
                `}>
                    <div className="p-1.5 bg-white/20 rounded-full backdrop-blur-sm">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </div>
                    <span>Student</span>
                </div>
            </div>

            {/* Controls hint */}
            <div className="hidden sm:block absolute top-4 right-4 text-xs font-bold text-gray-500 pointer-events-none">
                Drag to look around
            </div>
        </div>
    );
};

export default Classroom3DAdvanced;
