"use client";

import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

interface Classroom3DProps {
    activeSpeaker: string | null;
    isPlaying: boolean;
}

// Animated character placeholder (will be replaced with GLTF models)
function Character({
    position,
    color,
    isActive,
    label
}: {
    position: [number, number, number];
    color: string;
    isActive: boolean;
    label: string;
}) {
    const meshRef = useRef<THREE.Mesh>(null);
    const headRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current && isActive) {
            // Subtle bobbing animation when speaking
            meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 4) * 0.05;
        }
        if (headRef.current && isActive) {
            // Head nodding
            headRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 3) * 0.1;
        }
    });

    return (
        <group position={position}>
            {/* Body */}
            <mesh ref={meshRef} position={[0, 0.5, 0]} castShadow>
                <capsuleGeometry args={[0.25, 0.5, 4, 8]} />
                <meshStandardMaterial color={isActive ? color : "#888888"} />
            </mesh>

            {/* Head */}
            <mesh ref={headRef} position={[0, 1.1, 0]} castShadow>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshStandardMaterial color={isActive ? "#ffdbac" : "#d0d0d0"} />
            </mesh>

            {/* Speaking indicator */}
            {isActive && (
                <mesh position={[0, 1.5, 0]}>
                    <sphereGeometry args={[0.08, 8, 8]} />
                    <meshBasicMaterial color="#00ff00" />
                </mesh>
            )}
        </group>
    );
}

// Chalkboard
function Chalkboard() {
    return (
        <group position={[0, 1.5, -3]}>
            {/* Frame */}
            <mesh castShadow receiveShadow>
                <boxGeometry args={[4, 2.5, 0.1]} />
                <meshStandardMaterial color="#5c4033" />
            </mesh>
            {/* Board surface */}
            <mesh position={[0, 0, 0.06]}>
                <boxGeometry args={[3.8, 2.3, 0.02]} />
                <meshStandardMaterial color="#2d4a3e" />
            </mesh>
            {/* Chalk tray */}
            <mesh position={[0, -1.35, 0.15]} castShadow>
                <boxGeometry args={[3.8, 0.1, 0.2]} />
                <meshStandardMaterial color="#5c4033" />
            </mesh>
        </group>
    );
}

// Floor
function Floor() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[12, 12]} />
            <meshStandardMaterial color="#d4a574" />
        </mesh>
    );
}

// Desk
function Desk({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            {/* Desktop */}
            <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.2, 0.05, 0.6]} />
                <meshStandardMaterial color="#8b4513" />
            </mesh>
            {/* Legs */}
            {[[-0.5, 0.25, -0.25], [0.5, 0.25, -0.25], [-0.5, 0.25, 0.25], [0.5, 0.25, 0.25]].map((pos, i) => (
                <mesh key={i} position={pos as [number, number, number]} castShadow>
                    <boxGeometry args={[0.05, 0.5, 0.05]} />
                    <meshStandardMaterial color="#5c4033" />
                </mesh>
            ))}
        </group>
    );
}

// Wall
function Wall() {
    return (
        <mesh position={[0, 2.5, -4]} receiveShadow>
            <boxGeometry args={[12, 5, 0.2]} />
            <meshStandardMaterial color="#f5f0e6" />
        </mesh>
    );
}

const Classroom3D: React.FC<Classroom3DProps> = ({ activeSpeaker, isPlaying }) => {
    return (
        <div className="w-full aspect-video border-2 border-black bg-[#f0f0f0]">
            <Canvas shadows>
                <PerspectiveCamera makeDefault position={[0, 2, 5]} fov={50} />
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    minPolarAngle={Math.PI / 4}
                    maxPolarAngle={Math.PI / 2}
                />

                {/* Lighting */}
                <ambientLight intensity={0.4} />
                <directionalLight
                    position={[5, 5, 5]}
                    intensity={0.8}
                    castShadow
                    shadow-mapSize-width={1024}
                    shadow-mapSize-height={1024}
                />

                <Suspense fallback={null}>
                    {/* Room */}
                    <Floor />
                    <Wall />
                    <Chalkboard />

                    {/* Teacher */}
                    <Character
                        position={[-1.5, 0, -1]}
                        color="#0066FF"
                        isActive={activeSpeaker === "host_1"}
                        label="Professor"
                    />

                    {/* Student */}
                    <Character
                        position={[1.5, 0, 1]}
                        color="#FF3D00"
                        isActive={activeSpeaker === "host_2"}
                        label="Student"
                    />

                    {/* Desks */}
                    <Desk position={[-1.5, 0, -0.3]} />
                    <Desk position={[1.5, 0, 1.7]} />
                </Suspense>
            </Canvas>

            {/* Legend overlay */}
            <div className="absolute bottom-4 left-4 flex space-x-4 pointer-events-none">
                <div className={`px-3 py-1 border-2 border-black text-xs font-bold ${activeSpeaker === 'host_1' ? 'bg-[#0066FF] text-white' : 'bg-white'}`}>
                    PROFESSOR
                </div>
                <div className={`px-3 py-1 border-2 border-black text-xs font-bold ${activeSpeaker === 'host_2' ? 'bg-[#FF3D00] text-white' : 'bg-white'}`}>
                    STUDENT
                </div>
            </div>
        </div>
    );
};

export default Classroom3D;
