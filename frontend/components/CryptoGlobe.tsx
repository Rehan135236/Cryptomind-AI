"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import countries from "world-atlas/countries-110m.json";
import { feature } from "topojson-client";

const RADIUS = 2.45;

/* =========================================================
   LAT/LON → 3D POSITION
========================================================= */

function latLonToVector3(
    lat: number,
    lon: number,
    radius = RADIUS
): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

/* =========================================================
   GLOBAL NETWORK LOCATIONS
========================================================= */

const networkLocations = [
    { name: "New York", lat: 40.7128, lon: -74.006 },
    { name: "Toronto", lat: 43.6532, lon: -79.3832 },
    { name: "Chicago", lat: 41.8781, lon: -87.6298 },
    { name: "Mexico City", lat: 19.4326, lon: -99.1332 },
    { name: "San Francisco", lat: 37.7749, lon: -122.4194 },
    { name: "Los Angeles", lat: 34.0522, lon: -118.2437 },

    { name: "Sao Paulo", lat: -23.5505, lon: -46.6333 },
    { name: "Buenos Aires", lat: -34.6037, lon: -58.3816 },

    { name: "London", lat: 51.5072, lon: -0.1276 },
    { name: "Paris", lat: 48.8566, lon: 2.3522 },
    { name: "Frankfurt", lat: 50.1109, lon: 8.6821 },
    { name: "Amsterdam", lat: 52.3676, lon: 4.9041 },
    { name: "Madrid", lat: 40.4168, lon: -3.7038 },
    { name: "Moscow", lat: 55.7558, lon: 37.6173 },

    { name: "Istanbul", lat: 41.0082, lon: 28.9784 },

    { name: "Dubai", lat: 25.2048, lon: 55.2708 },
    { name: "Riyadh", lat: 24.7136, lon: 46.6753 },
    { name: "Cairo", lat: 30.0444, lon: 31.2357 },

    { name: "Mumbai", lat: 19.076, lon: 72.8777 },
    { name: "Delhi", lat: 28.6139, lon: 77.209 },
    { name: "Karachi", lat: 24.8607, lon: 67.0011 },

    { name: "Singapore", lat: 1.3521, lon: 103.8198 },
    { name: "Bangkok", lat: 13.7563, lon: 100.5018 },
    { name: "Jakarta", lat: -6.2088, lon: 106.8456 },
    { name: "Hong Kong", lat: 22.3193, lon: 114.1694 },
    { name: "Shanghai", lat: 31.2304, lon: 121.4737 },
    { name: "Beijing", lat: 39.9042, lon: 116.4074 },
    { name: "Seoul", lat: 37.5665, lon: 126.978 },
    { name: "Tokyo", lat: 35.6762, lon: 139.6503 },

    { name: "Sydney", lat: -33.8688, lon: 151.2093 },
    { name: "Melbourne", lat: -37.8136, lon: 144.9631 },

    { name: "Cape Town", lat: -33.9249, lon: 18.4241 },
    { name: "Johannesburg", lat: -26.2041, lon: 28.0473 },
    { name: "Lagos", lat: 6.5244, lon: 3.3792 },
    { name: "Nairobi", lat: -1.2921, lon: 36.8219 },
];

/* =========================================================
   ACTUAL COUNTRY BORDERS
========================================================= */

function CountryBorders() {
    const countryFeatures = useMemo(() => {
        const geo = feature(
            countries as any,
            (countries as any).objects.countries
        ) as any;

        return geo.features;
    }, []);

    const rings = useMemo(() => {
        const result: THREE.Vector3[][] = [];

        for (const country of countryFeatures) {
            const geometry = country.geometry;

            if (!geometry) continue;

            if (geometry.type === "Polygon") {
                for (const ring of geometry.coordinates) {
                    if (ring.length < 2) continue;

                    const points = ring.map(
                        ([lon, lat]: [number, number]) =>
                            latLonToVector3(
                                lat,
                                lon,
                                RADIUS + 0.018
                            )
                    );

                    result.push(points);
                }
            }

            if (geometry.type === "MultiPolygon") {
                for (const polygon of geometry.coordinates) {
                    for (const ring of polygon) {
                        if (ring.length < 2) continue;

                        const points = ring.map(
                            ([lon, lat]: [number, number]) =>
                                latLonToVector3(
                                    lat,
                                    lon,
                                    RADIUS + 0.018
                                )
                        );

                        result.push(points);
                    }
                }
            }
        }

        return result;
    }, [countryFeatures]);

    return (
        <group>
            {rings.map((points, index) => (
                <Line
                    key={index}
                    points={points}
                    color="#00E5FF"
                    transparent
                    opacity={0.55}
                    lineWidth={0.7}
                    depthTest
                    depthWrite={false}
                />
            ))}
        </group>
    );
}

/* =========================================================
   GLOBE GRID
========================================================= */

function GlobeGrid() {
    const lines = useMemo(() => {
        const result: THREE.Vector3[][] = [];

        for (let lat = -75; lat <= 75; lat += 15) {
            const points: THREE.Vector3[] = [];

            for (let lon = -180; lon <= 180; lon += 4) {
                points.push(
                    latLonToVector3(
                        lat,
                        lon,
                        RADIUS + 0.008
                    )
                );
            }

            result.push(points);
        }

        for (let lon = -180; lon < 180; lon += 15) {
            const points: THREE.Vector3[] = [];

            for (let lat = -90; lat <= 90; lat += 4) {
                points.push(
                    latLonToVector3(
                        lat,
                        lon,
                        RADIUS + 0.008
                    )
                );
            }

            result.push(points);
        }

        return result;
    }, []);

    return (
        <group>
            {lines.map((points, index) => (
                <Line
                    key={index}
                    points={points}
                    color="#00E5FF"
                    transparent
                    opacity={0.08}
                    lineWidth={0.45}
                    depthTest
                    depthWrite={false}
                />
            ))}
        </group>
    );
}

/* =========================================================
   DENSE PARTICLES
========================================================= */

function GlobeParticles() {
    const ref = useRef<THREE.Points>(null);

    const positions = useMemo(() => {
        const data: number[] = [];

        for (let i = 0; i < 2600; i++) {
            const u = Math.random();
            const v = Math.random();

            const lat =
                Math.asin(2 * u - 1) *
                (180 / Math.PI);

            const lon =
                360 * v - 180;

            const position = latLonToVector3(
                lat,
                lon,
                RADIUS + 0.035
            );

            data.push(
                position.x,
                position.y,
                position.z
            );
        }

        return new Float32Array(data);
    }, []);

    useFrame((_, delta) => {
        if (!ref.current) return;

        ref.current.rotation.y +=
            delta * 0.018;
    });

    return (
        <Points
            ref={ref}
            positions={positions}
            stride={3}
            frustumCulled={false}
        >
            <PointMaterial
                transparent
                color="#00E5FF"
                size={0.014}
                sizeAttenuation
                depthWrite={false}
                depthTest
                opacity={0.62}
            />
        </Points>
    );
}

/* =========================================================
   NETWORK NODES
========================================================= */

function NetworkNodes() {
    const positions = useMemo(
        () =>
            networkLocations.map((location) =>
                latLonToVector3(
                    location.lat,
                    location.lon,
                    RADIUS + 0.065
                )
            ),
        []
    );

    return (
        <group>
            {positions.map((position, index) => {
                const lime = index % 4 === 0;

                return (
                    <group
                        key={index}
                        position={position}
                    >
                        <mesh>
                            <sphereGeometry
                                args={[0.035, 12, 12]}
                            />

                            <meshBasicMaterial
                                color={
                                    lime
                                        ? "#C6FF00"
                                        : "#00E5FF"
                                }
                                depthTest
                            />
                        </mesh>

                        <mesh scale={3}>
                            <sphereGeometry
                                args={[0.035, 12, 12]}
                            />

                            <meshBasicMaterial
                                color={
                                    lime
                                        ? "#C6FF00"
                                        : "#00E5FF"
                                }
                                transparent
                                opacity={0.12}
                                depthWrite={false}
                                depthTest
                            />
                        </mesh>
                    </group>
                );
            })}
        </group>
    );
}

/* =========================================================
   NETWORK ARCS
========================================================= */

function NetworkArcs() {
    const arcs = useMemo(() => {
        const connections: [number, number][] = [];

        for (
            let i = 0;
            i < networkLocations.length;
            i++
        ) {
            for (
                let j = i + 1;
                j < networkLocations.length;
                j++
            ) {
                const a =
                    latLonToVector3(
                        networkLocations[i].lat,
                        networkLocations[i].lon,
                        RADIUS + 0.07
                    );

                const b =
                    latLonToVector3(
                        networkLocations[j].lat,
                        networkLocations[j].lon,
                        RADIUS + 0.07
                    );

                const distance =
                    a.distanceTo(b);

                if (distance < 3.7) {
                    connections.push([i, j]);
                }
            }
        }

        const globalConnections: [
            number,
            number
        ][] = [
                [0, 8],
                [0, 15],
                [0, 21],
                [4, 8],
                [5, 8],

                [8, 15],
                [8, 21],
                [15, 21],
                [21, 22],

                [22, 27],
                [27, 28],
                [28, 29],
                [29, 31],
                [31, 32],
                [32, 33],

                [14, 20],
                [20, 23],
                [23, 24],
                [24, 25],
                [25, 26],
                [26, 27],

                [2, 12],
                [12, 14],
                [14, 20],

                [18, 20],
                [17, 18],
                [17, 13],

                [13, 14],
                [11, 12],
                [9, 10],
            ];

        connections.push(
            ...globalConnections
        );

        return connections.map(
            ([a, b], index) => {
                const start =
                    latLonToVector3(
                        networkLocations[a].lat,
                        networkLocations[a].lon,
                        RADIUS + 0.075
                    );

                const end =
                    latLonToVector3(
                        networkLocations[b].lat,
                        networkLocations[b].lon,
                        RADIUS + 0.075
                    );

                const midpoint =
                    start
                        .clone()
                        .add(end)
                        .multiplyScalar(0.5);

                const distance =
                    start.distanceTo(end);

                midpoint
                    .normalize()
                    .multiplyScalar(
                        RADIUS +
                        0.14 +
                        distance * 0.11
                    );

                const curve =
                    new THREE.QuadraticBezierCurve3(
                        start,
                        midpoint,
                        end
                    );

                return {
                    points: curve.getPoints(32),
                    index,
                };
            }
        );
    }, []);

    return (
        <group>
            {arcs.map(
                ({ points, index }) => (
                    <Line
                        key={index}
                        points={points}
                        color={
                            index % 5 === 0
                                ? "#C6FF00"
                                : "#00E5FF"
                        }
                        transparent
                        opacity={0.40}
                        lineWidth={0.75}
                        depthTest
                        depthWrite={false}
                    />
                )
            )}
        </group>
    );
}

/* =========================================================
   ATMOSPHERE
========================================================= */

function Atmosphere() {
    return (
        <>
            <mesh scale={1.075}>
                <sphereGeometry
                    args={[
                        RADIUS,
                        64,
                        64,
                    ]}
                />

                <meshBasicMaterial
                    color="#00E5FF"
                    transparent
                    opacity={0.055}
                    side={THREE.BackSide}
                    depthWrite={false}
                    depthTest={false}
                />
            </mesh>

            <mesh scale={1.12}>
                <sphereGeometry
                    args={[
                        RADIUS,
                        64,
                        64,
                    ]}
                />

                <meshBasicMaterial
                    color="#C6FF00"
                    transparent
                    opacity={0.022}
                    side={THREE.BackSide}
                    depthWrite={false}
                    depthTest={false}
                />
            </mesh>
        </>
    );
}

/* =========================================================
   MAIN SCENE
========================================================= */

function GlobeScene() {
    const globeRef =
        useRef<THREE.Group>(null);

    /*
      Start with a deliberate rotation.
      This prevents the first frame from showing
      an undesirable empty/back-facing area.
    */

    const initialRotation =
        useMemo(() => {
            const group =
                new THREE.Group();

            group.rotation.y =
                -0.55;

            group.rotation.x =
                0.04;

            return group.rotation;
        }, []);

    useFrame((_, delta) => {
        if (!globeRef.current) return;

        globeRef.current.rotation.y +=
            delta * 0.045;
    });

    return (
        <group
            ref={globeRef}
            rotation={initialRotation}
        >
            {/* -------------------------------------------
          OPAQUE GLOBE SURFACE
      ------------------------------------------- */}

            <mesh renderOrder={0}>
                <sphereGeometry
                    args={[
                        RADIUS,
                        96,
                        96,
                    ]}
                />

                <meshBasicMaterial
                    color="#020708"
                    opacity={1}
                    transparent={false}
                    depthWrite
                    depthTest
                    side={THREE.FrontSide}
                />
            </mesh>

            {/* -------------------------------------------
          GRID
      ------------------------------------------- */}

            <GlobeGrid />

            {/* -------------------------------------------
          COUNTRY BORDERS
      ------------------------------------------- */}

            <CountryBorders />

            {/* -------------------------------------------
          NETWORK
      ------------------------------------------- */}

            <NetworkArcs />

            <NetworkNodes />

            {/* -------------------------------------------
          PARTICLES
      ------------------------------------------- */}

            <GlobeParticles />

            {/* -------------------------------------------
          ATMOSPHERE
      ------------------------------------------- */}

            <Atmosphere />
        </group>
    );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function CryptoGlobe() {
    return (
        <div
            className="relative h-[340px] sm:h-[480px] lg:h-[620px] w-full"
            style={{
                contain: "layout paint",
            }}
        >
            <Canvas
                camera={{
                    position: [0, 0, 7.8],
                    fov: 42,
                    near: 0.1,
                    far: 100,
                }}
                dpr={[1, 1.75]}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference:
                        "high-performance",
                    depth: true,
                    stencil: false,
                }}
            >
                <color
                    attach="background"
                    args={["#050507"]}
                />

                <ambientLight
                    intensity={0.3}
                />

                <pointLight
                    position={[4, 3, 5]}
                    intensity={4}
                    color="#00E5FF"
                />

                <pointLight
                    position={[-4, -2, 3]}
                    intensity={3}
                    color="#C6FF00"
                />

                <GlobeScene />
            </Canvas>

            {/* =================================================
          IMMEDIATE CSS ATMOSPHERIC GLOW

          This is outside Three.js, so it exists on
          the very first browser paint instead of
          waiting for WebGL geometry.
      ================================================= */}

            <div
                className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                    background:
                        "radial-gradient(circle, rgba(0,229,255,0.13) 0%, rgba(0,229,255,0.055) 32%, rgba(198,255,0,0.025) 48%, transparent 72%)",
                    filter:
                        "blur(42px)",
                    opacity: 1,
                }}
            />

            <div
                className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                    background:
                        "radial-gradient(circle, rgba(198,255,0,0.07), transparent 68%)",
                    filter:
                        "blur(38px)",
                    opacity: 1,
                }}
            />
        </div>
    );
}