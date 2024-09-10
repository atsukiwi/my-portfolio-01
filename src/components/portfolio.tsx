"use client";

import React, { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Github, Linkedin, Mail } from "lucide-react";

function VerticalStabilizer({ offset = 0, colorOffset = 0 }) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const time = useRef(0);
  const prevPosition = useRef(new THREE.Vector3());

  const shape = useMemo(() => {
    const triangleShape = new THREE.Shape();
    triangleShape.moveTo(0, 0.6);
    triangleShape.lineTo(0.3, -0.6);
    triangleShape.lineTo(-0.3, -0.6);
    triangleShape.lineTo(0, 0.6);
    return triangleShape;
  }, []);

  const halfShape = useMemo(() => {
    const halfTriangleShape = new THREE.Shape();
    halfTriangleShape.moveTo(0, 0.6);
    halfTriangleShape.lineTo(0.3, -0.6);
    halfTriangleShape.lineTo(0, -0.6);
    halfTriangleShape.lineTo(0, 0.6);
    return halfTriangleShape;
  }, []);

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        colorOffset: { value: colorOffset },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normal;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float colorOffset;
        varying vec2 vUv;
        varying vec3 vNormal;

        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }

        void main() {
          float hue = fract(time * 0.1 + colorOffset);
          vec3 color = hsv2rgb(vec3(hue, 0.8, 0.8));

          // Add some shading based on the normal
          float shading = dot(vNormal, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5;
          color *= shading;

          // Add transparency with higher base opacity
          float alpha = 0.85 + 0.15 * sin(vUv.y * 3.14159);

          gl_FragColor = vec4(color, alpha);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
    });
  }, [colorOffset]);

  useFrame((state, delta) => {
    if (groupRef.current && materialRef.current) {
      time.current += delta * 0.5;

      const x = Math.sin(time.current + offset) * 3.5;
      const y = Math.sin((time.current + offset) * 2) * 1.75;
      const z = Math.cos(time.current + offset) * 3.5;
      const newPosition = new THREE.Vector3(x, y, z);

      const direction = newPosition
        .clone()
        .sub(prevPosition.current)
        .normalize();
      prevPosition.current.copy(newPosition);

      if (direction.lengthSq() > 0.001) {
        const up = new THREE.Vector3(0, 1, 0);
        const targetRotation = new THREE.Quaternion().setFromUnitVectors(
          up,
          direction
        );
        groupRef.current.quaternion.slerp(targetRotation, 0.1);
      }

      groupRef.current.position.copy(newPosition);

      materialRef.current.uniforms.time.value = time.current;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <shapeGeometry args={[shape]} />
        <shaderMaterial ref={materialRef} {...shaderMaterial} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <shapeGeometry args={[halfShape]} />
        <shaderMaterial ref={materialRef} {...shaderMaterial} />
      </mesh>
    </group>
  );
}

function Particles() {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 1500;
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 15;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
  }

  useFrame(() => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position
        .array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 2] -= 0.02;

        if (positions[i * 3 + 2] < -7.5) {
          positions[i * 3 + 2] = 7.5;
          positions[i * 3] = (Math.random() - 0.5) * 15;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#63B3ED" />
    </points>
  );
}

function Background() {
  return (
    <Canvas camera={{ position: [0, 0, 7], fov: 60 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <VerticalStabilizer offset={0} colorOffset={0} />
      <VerticalStabilizer offset={(Math.PI * 2) / 3} colorOffset={1 / 3} />
      <VerticalStabilizer offset={(Math.PI * 4) / 3} colorOffset={2 / 3} />
      <Particles />
      <OrbitControls
        enableRotate={true}
        enableZoom={false}
        enablePan={false}
        rotateSpeed={0.5}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={(Math.PI * 3) / 4}
        minDistance={6}
        maxDistance={8}
      />
    </Canvas>
  );
}

export default function EngineerPortfolio() {
  const [showContent, setShowContent] = useState(true);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900">
      <div className="absolute inset-0 z-0">
        <Background />
      </div>
      <div className="absolute top-4 left-4 z-20">
        <Button variant="outline" onClick={() => setShowContent(!showContent)}>
          {showContent ? "Hide Content" : "Show Content"}
        </Button>
      </div>
      {showContent && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <Card className="w-full max-w-md bg-white/80 backdrop-blur-md pointer-events-auto">
            <CardHeader>
              <CardTitle>Atsuki Hattori</CardTitle>
              <CardDescription>CTO at Spakona Inc.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Passionate about creating efficient and scalable web
                applications. Experienced in Python, TypeScript, and cloud
                technologies.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Skills</h3>
                  <ul className="list-disc list-inside">
                    <li>Python</li>
                    <li>TypeScript</li>
                    <li>AWS & Azure</li>
                    <li>Docker</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold">Projects</h3>
                  <ul className="list-disc list-inside">
                    <li>Fluid Dynamics</li>
                    <li>API Development</li>
                    <li>Deep Learning & Machine Learning</li>
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="icon">
                <Github className="h-4 w-4" />
                <span className="sr-only">GitHub</span>
              </Button>
              <Button variant="outline" size="icon">
                <Linkedin className="h-4 w-4" />
                <span className="sr-only">LinkedIn</span>
              </Button>
              <Button variant="outline" size="icon">
                <Mail className="h-4 w-4" />
                <span className="sr-only">Email</span>
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
