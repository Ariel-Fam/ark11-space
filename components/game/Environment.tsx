import { memo, useMemo, useRef } from "react";
import type { MutableRefObject } from "react";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ELEVATION_LEVELS } from "./types";

import type {
  AmethystClusterData,
  AsteroidData,
  BoostPickupData,
  EnemyDroidData,
  EnemyLaserData,
  FallingHazardData,
  FuelOrbData,
  GameData,
  ObstacleData,
} from "./types";

const ENEMY_AGGRO_RANGE = 210;
const ENEMY_LASER_SPEED = 145;

function setObjectOpacity(object: THREE.Object3D, opacity: number) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return;
    }

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      if (
        material instanceof THREE.MeshStandardMaterial ||
        material instanceof THREE.MeshBasicMaterial ||
        material instanceof THREE.MeshPhongMaterial
      ) {
        material.transparent = true;
        material.opacity = opacity;
      }
    });
  });
}

interface EnvironmentProps {
  shipRef: MutableRefObject<THREE.Group | null>;
  gameData: MutableRefObject<GameData>;
  amethystClustersRef: MutableRefObject<AmethystClusterData[]>;
  obstaclesRef: MutableRefObject<ObstacleData[]>;
  asteroidsRef: MutableRefObject<AsteroidData[]>;
  boostPickupsRef: MutableRefObject<BoostPickupData[]>;
  fallingHazardsRef: MutableRefObject<FallingHazardData[]>;
  fuelOrbsRef: MutableRefObject<FuelOrbData[]>;
  enemyDroidsRef: MutableRefObject<EnemyDroidData[]>;
  enemyLasersRef: MutableRefObject<EnemyLaserData[]>;
  onCollision: () => void;
  onAmethystCollected: () => void;
  onBoostCollected: (count: number) => void;
  onFuelCollected: (count: number) => void;
  onFatalCollision: () => void;
  onCheckpoint: () => void;
  onShotByDroid: () => void;
  reducedEffects: boolean;
}

function generateCheckpoints(count: number, range: number) {
  const items: { pos: [number, number, number]; id: number }[] = [];

  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2;
    const radius = 90 + Math.random() * (range - 90);
    const level = ELEVATION_LEVELS[index % ELEVATION_LEVELS.length];

    items.push({
      pos: [
        Math.cos(angle) * radius,
        level + (Math.random() - 0.5) * 6,
        Math.sin(angle) * radius,
      ],
      id: index,
    });
  }

  return items;
}

function generatePlanets() {
  return [
    {
      id: "azure-ring",
      position: [280, 85, -420] as [number, number, number],
      radius: 62,
      color: "#7db5ff",
      emissive: "#70a8f8",
      ringColor: "#9fcbff",
      ringRotation: [0.5, 0, 0.3] as [number, number, number],
      ringSize: [72, 92] as [number, number],
    },
    {
      id: "ember",
      position: [-380, 122, -210] as [number, number, number],
      radius: 34,
      color: "#ffb26b",
      emissive: "#ff7c22",
    },
    {
      id: "violet-world",
      position: [-160, 38, -560] as [number, number, number],
      radius: 44,
      color: "#8d7aff",
      emissive: "#6b56ff",
    },
    {
      id: "mint-ring",
      position: [430, 26, -120] as [number, number, number],
      radius: 28,
      color: "#8ff3d2",
      emissive: "#45d3b8",
      ringColor: "#a8ffe8",
      ringRotation: [1.1, 0.2, -0.4] as [number, number, number],
      ringSize: [36, 48] as [number, number],
    },
    {
      id: "rose",
      position: [-480, 92, -720] as [number, number, number],
      radius: 40,
      color: "#ff86b6",
      emissive: "#ff4d8f",
    },
    {
      id: "gold-ring",
      position: [110, 112, -860] as [number, number, number],
      radius: 48,
      color: "#ffd166",
      emissive: "#ffb703",
      ringColor: "#fff0bf",
      ringRotation: [0.9, -0.4, 0.25] as [number, number, number],
      ringSize: [58, 72] as [number, number],
    },
    {
      id: "teal",
      position: [-520, 18, -320] as [number, number, number],
      radius: 22,
      color: "#7ef2ff",
      emissive: "#2fd4f0",
    },
    {
      id: "plum",
      position: [520, 132, -660] as [number, number, number],
      radius: 32,
      color: "#c38bff",
      emissive: "#8b5cf6",
    },
  ];
}

function generateWhiteOrbs() {
  return [
    {
      id: "white-orb-a",
      position: [-260, 54, -300] as [number, number, number],
      scale: 18,
      rotation: [0.1, 0.4, 0] as [number, number, number],
    },
    {
      id: "white-orb-b",
      position: [360, 102, -540] as [number, number, number],
      scale: 22,
      rotation: [0.35, -0.2, 0.1] as [number, number, number],
    },
  ];
}

function repositionFuelOrb(
  orb: FuelOrbData,
  index: number,
  shipPos: THREE.Vector3,
) {
  orb.position = [
    shipPos.x + (Math.random() - 0.5) * 320,
    ELEVATION_LEVELS[index % ELEVATION_LEVELS.length] + (Math.random() - 0.5) * 7,
    shipPos.z - 120 + (Math.random() - 0.5) * 280,
  ];
}

function repositionAmethystCluster(
  cluster: AmethystClusterData,
  index: number,
  shipPos: THREE.Vector3,
) {
  cluster.position = [
    shipPos.x + (Math.random() - 0.5) * 360,
    ELEVATION_LEVELS[index % ELEVATION_LEVELS.length] + (Math.random() - 0.5) * 7,
    shipPos.z - 160 + (Math.random() - 0.5) * 320,
  ];
}

function repositionBoostPickup(
  pickup: BoostPickupData,
  index: number,
  shipPos: THREE.Vector3,
) {
  pickup.position = [
    shipPos.x + (Math.random() - 0.5) * 340,
    ELEVATION_LEVELS[index % ELEVATION_LEVELS.length] + (Math.random() - 0.5) * 7,
    shipPos.z - 150 + (Math.random() - 0.5) * 300,
  ];
}

function deactivateEnemyLaser(laser: EnemyLaserData) {
  laser.active = false;
  laser.life = 0;
  laser.position = [0, -200, 0];
}

function createObstacleBounds(obstacle: ObstacleData) {
  const [x, y, z] = obstacle.position;
  const [width, height, depth] = obstacle.size;

  return new THREE.Box3(
    new THREE.Vector3(x - width / 2, y - height / 2, z - depth / 2),
    new THREE.Vector3(x + width / 2, y + height / 2, z + depth / 2),
  );
}

function doesLaserHitObstacle(
  start: THREE.Vector3,
  end: THREE.Vector3,
  obstacle: ObstacleData,
) {
  const bounds = createObstacleBounds(obstacle);
  const travel = end.clone().sub(start);
  const distance = travel.length();

  if (distance === 0) {
    return bounds.containsPoint(end);
  }

  if (bounds.containsPoint(start) || bounds.containsPoint(end)) {
    return true;
  }

  const hitPoint = new THREE.Ray(start.clone(), travel.normalize()).intersectBox(
    bounds,
    new THREE.Vector3(),
  );

  return hitPoint !== null && hitPoint.distanceTo(start) <= distance;
}

function EnvironmentInner({
  shipRef,
  gameData,
  amethystClustersRef,
  obstaclesRef,
  asteroidsRef,
  boostPickupsRef,
  fallingHazardsRef,
  fuelOrbsRef,
  enemyDroidsRef,
  enemyLasersRef,
  onCollision,
  onAmethystCollected,
  onBoostCollected,
  onFuelCollected,
  onFatalCollision,
  onCheckpoint,
  onShotByDroid,
  reducedEffects,
}: EnvironmentProps) {
  const checkpoints = useMemo(() => generateCheckpoints(38, 500), []);
  const planets = useMemo(() => generatePlanets(), []);
  const decorativeWhiteOrbs = useMemo(() => generateWhiteOrbs(), []);
  const { scene: amethystScene } = useGLTF("/models/AmethystCluster.glb");
  const { scene: enemyUfoScene } = useGLTF("/models/ufo.glb");
  const { scene: whiteOrbScene } = useGLTF("/models/whiteOrb.glb");
  const collectedRef = useRef<Set<number>>(new Set());
  const invulnerabilityRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const amethystRefs = useRef<(THREE.Group | null)[]>([]);
  const amethystGlowRefs = useRef<(THREE.PointLight | null)[]>([]);
  const asteroidRefs = useRef<(THREE.Mesh | null)[]>([]);
  const asteroidShardRefs = useRef<(THREE.Mesh | null)[][]>([]);
  const boostPickupRefs = useRef<(THREE.Mesh | null)[]>([]);
  const boostPickupLightRefs = useRef<(THREE.PointLight | null)[]>([]);
  const checkpointRefs = useRef<(THREE.Mesh | null)[]>([]);
  const obstacleRefs = useRef<(THREE.Mesh | null)[]>([]);
  const obstacleShardRefs = useRef<(THREE.Mesh | null)[][]>([]);
  const fallingHazardRefs = useRef<(THREE.Mesh | null)[]>([]);
  const fallingShardRefs = useRef<(THREE.Mesh | null)[][]>([]);
  const fuelOrbRefs = useRef<(THREE.Mesh | null)[]>([]);
  const fuelLightRefs = useRef<(THREE.PointLight | null)[]>([]);
  const enemyDroidRefs = useRef<(THREE.Group | null)[]>([]);
  const enemyDroidShardRefs = useRef<(THREE.Mesh | null)[][]>([]);
  const enemyLaserRefs = useRef<(THREE.Mesh | null)[]>([]);
  const forwardAxis = useMemo(() => new THREE.Vector3(0, 0, 1), []);
  const enemyUfoBaseSize = useMemo(() => {
    const bounds = new THREE.Box3().setFromObject(enemyUfoScene);
    const size = bounds.getSize(new THREE.Vector3());
    return Math.max(size.x, size.y, size.z, 1);
  }, [enemyUfoScene]);
  const whiteOrbBaseSize = useMemo(() => {
    const bounds = new THREE.Box3().setFromObject(whiteOrbScene);
    const size = bounds.getSize(new THREE.Vector3());
    return Math.max(size.x, size.y, size.z, 1);
  }, [whiteOrbScene]);
  const whiteOrbInstances = useMemo(
    () => decorativeWhiteOrbs.map(() => whiteOrbScene.clone()),
    [decorativeWhiteOrbs, whiteOrbScene],
  );
  const amethystInstances = useMemo(
    () => amethystClustersRef.current.map(() => amethystScene.clone()),
    [amethystClustersRef, amethystScene],
  );
  const enemyDroidInstances = useMemo(
    () => enemyDroidsRef.current.map(() => enemyUfoScene.clone()),
    [enemyDroidsRef, enemyUfoScene],
  );

  const starPositions = useMemo(() => {
    const positions = new Float32Array(reducedEffects ? 2400 : 4800);

    for (let index = 0; index < positions.length; index += 1) {
      positions[index] = (Math.random() - 0.5) * 1800;
    }

    return positions;
  }, [reducedEffects]);

  const particlePositions = useMemo(() => {
    const positions = new Float32Array(reducedEffects ? 600 : 1200);

    for (let index = 0; index < positions.length; index += 1) {
      positions[index] = (Math.random() - 0.5) * 700;
    }

    return positions;
  }, [reducedEffects]);

  useFrame((state, delta) => {
    if (!shipRef.current || gameData.current.state !== "playing") {
      return;
    }

    void onCollision;

    const shipPos = shipRef.current.position;
    const d = Math.min(delta, 0.05);
    const elapsed = state.clock.elapsedTime;
    const hasAmethystShield = gameData.current.amethystShieldTime > 0.05;

    if (invulnerabilityRef.current > 0) {
      invulnerabilityRef.current -= d;
    }

    spawnTimerRef.current += d;

    if (spawnTimerRef.current >= 1.55) {
      const hazardToSpawn = fallingHazardsRef.current.find(
        (hazard) =>
          !hazard.active && !hazard.destroyed && hazard.destructionProgress === 0,
      );

      if (hazardToSpawn) {
        hazardToSpawn.active = true;
        hazardToSpawn.shape = Math.random() > 0.45 ? "sphere" : "icosahedron";
        hazardToSpawn.position = [
          shipPos.x + (Math.random() - 0.5) * 180,
          110 + Math.random() * 55,
          shipPos.z - 90 - Math.random() * 140,
        ];
        hazardToSpawn.scale = 2.8 + Math.random() * 3.4;
        hazardToSpawn.velocity = 24 + Math.random() * 18;
        hazardToSpawn.destroyed = false;
        hazardToSpawn.destructionProgress = 0;
        spawnTimerRef.current = 0;
      }
    }

    asteroidsRef.current.forEach((asteroid, index) => {
      const asteroidMesh = asteroidRefs.current[index];
      const shardMeshes = asteroidShardRefs.current[index] ?? [];

      if (!asteroid.destroyed) {
        if (asteroidMesh) {
          asteroidMesh.visible = true;
          asteroidMesh.position.set(...asteroid.position);
          asteroidMesh.rotation.x += d * 0.12;
          asteroidMesh.rotation.y += d * 0.3;
          asteroidMesh.rotation.z += d * 0.08;
          asteroidMesh.scale.set(1, 1, 1);

          const material = asteroidMesh.material as THREE.MeshStandardMaterial;
          material.opacity = 1;
        }

        shardMeshes.forEach((mesh) => {
          if (mesh) {
            mesh.visible = false;
            mesh.position.set(0, -260, 0);
          }
        });
        return;
      }

      asteroid.destructionProgress = Math.min(1, asteroid.destructionProgress + d * 2);

      if (asteroidMesh) {
        asteroidMesh.visible = asteroid.destructionProgress < 1;
        asteroidMesh.position.set(...asteroid.position);
        asteroidMesh.scale.setScalar(1 - asteroid.destructionProgress * 0.45);
        asteroidMesh.rotation.x += d * 2.1;
        asteroidMesh.rotation.y += d * 2.5;

        const material = asteroidMesh.material as THREE.MeshStandardMaterial;
        material.opacity = Math.max(0, 1 - asteroid.destructionProgress * 1.5);
      }

      shardMeshes.forEach((mesh, shardIndex) => {
        if (!mesh) {
          return;
        }

        const progress = asteroid.destructionProgress;
        mesh.visible = progress < 1;
        mesh.position.set(
          asteroid.position[0] + (shardIndex - 1.5) * progress * 1.8,
          asteroid.position[1] + (shardIndex % 2 === 0 ? 1 : -1) * progress * 1.5,
          asteroid.position[2] + (shardIndex % 3 === 0 ? -1 : 1) * progress * 1.8,
        );
        mesh.rotation.x += d * (1.4 + shardIndex * 0.3);
        mesh.rotation.y += d * (1.7 + shardIndex * 0.3);
        mesh.scale.setScalar(Math.max(0.12, 0.8 - progress * 0.5));

        const material = mesh.material as THREE.MeshStandardMaterial;
        material.opacity = Math.max(0, 0.7 - progress * 0.7);
      });
    });

    checkpointRefs.current.forEach((checkpoint) => {
      if (checkpoint) {
        checkpoint.rotation.y += d * 1.5;
        checkpoint.rotation.x += d * 0.5;
      }
    });

    amethystClustersRef.current.forEach((cluster, index) => {
      const clusterGroup = amethystRefs.current[index];
      const clusterLight = amethystGlowRefs.current[index];

      if (cluster.collected) {
        if (cluster.collectionProgress < 1) {
          cluster.collectionProgress = Math.min(1, cluster.collectionProgress + d * 2.3);
        } else {
          cluster.respawnTimer = Math.max(0, cluster.respawnTimer - d);

          if (cluster.respawnTimer <= 0) {
            cluster.collected = false;
            cluster.collectionProgress = 0;
            repositionAmethystCluster(cluster, index, shipPos);
          }
        }
      }

      const vanish = cluster.collected ? cluster.collectionProgress : 0;
      const bobOffset = Math.sin(elapsed * 1.4 + cluster.id * 0.7) * 0.4;

      if (clusterGroup) {
        clusterGroup.visible = !cluster.collected || vanish < 1;
        clusterGroup.position.set(
          cluster.position[0],
          cluster.position[1] + bobOffset + vanish * 0.8,
          cluster.position[2],
        );
        clusterGroup.rotation.y += d * 0.8;
        clusterGroup.scale.setScalar(Math.max(0.12, cluster.scale * (1 - vanish * 0.45)));
      }

      if (clusterLight) {
        clusterLight.position.set(
          cluster.position[0],
          cluster.position[1] + bobOffset,
          cluster.position[2],
        );
        clusterLight.intensity = Math.max(0, 2.4 - vanish * 2.4);
      }
    });

    fuelOrbsRef.current.forEach((orb, index) => {
      const orbMesh = fuelOrbRefs.current[index];
      const orbLight = fuelLightRefs.current[index];

      if (orb.collected) {
        if (orb.collectionProgress < 1) {
          orb.collectionProgress = Math.min(1, orb.collectionProgress + d * 2.6);
        } else {
          orb.respawnTimer = Math.max(0, orb.respawnTimer - d);

          if (orb.respawnTimer <= 0) {
            orb.collected = false;
            orb.collectionProgress = 0;
            repositionFuelOrb(orb, index, shipPos);
          }
        }
      }

      const disappear = orb.collected ? orb.collectionProgress : 0;
      const bobOffset = Math.sin(elapsed * 1.8 + orb.id) * 0.45;

      if (orbMesh) {
        orbMesh.visible = !orb.collected || disappear < 1;
        orbMesh.position.set(
          orb.position[0],
          orb.position[1] + bobOffset + disappear * 0.9,
          orb.position[2],
        );
        orbMesh.rotation.y += d * 1.5;
        orbMesh.rotation.x += d * 0.85;
        orbMesh.scale.setScalar(Math.max(0.12, 1 - disappear * 0.55));

        const material = orbMesh.material as THREE.MeshStandardMaterial;
        material.opacity = Math.max(0, 1 - disappear * 1.15);
      }

      if (orbLight) {
        orbLight.position.set(
          orb.position[0],
          orb.position[1] + bobOffset,
          orb.position[2],
        );
        orbLight.intensity = Math.max(0, 2.5 - disappear * 2.5);
      }
    });

    boostPickupsRef.current.forEach((pickup, index) => {
      const pickupMesh = boostPickupRefs.current[index];
      const pickupLight = boostPickupLightRefs.current[index];

      if (pickup.collected) {
        if (pickup.collectionProgress < 1) {
          pickup.collectionProgress = Math.min(1, pickup.collectionProgress + d * 2.7);
        } else {
          pickup.respawnTimer = Math.max(0, pickup.respawnTimer - d);

          if (pickup.respawnTimer <= 0) {
            pickup.collected = false;
            pickup.collectionProgress = 0;
            repositionBoostPickup(pickup, index, shipPos);
          }
        }
      }

      const disappear = pickup.collected ? pickup.collectionProgress : 0;
      const bobOffset = Math.sin(elapsed * 1.9 + pickup.id) * 0.45;

      if (pickupMesh) {
        pickupMesh.visible = !pickup.collected || disappear < 1;
        pickupMesh.position.set(
          pickup.position[0],
          pickup.position[1] + bobOffset + disappear * 0.85,
          pickup.position[2],
        );
        pickupMesh.rotation.x += d * 0.85;
        pickupMesh.rotation.y += d * 1.65;
        pickupMesh.scale.setScalar(Math.max(0.12, pickup.scale * (1 - disappear * 0.5)));

        const material = pickupMesh.material as THREE.MeshStandardMaterial;
        material.opacity = Math.max(0, 1 - disappear * 1.15);
      }

      if (pickupLight) {
        pickupLight.position.set(
          pickup.position[0],
          pickup.position[1] + bobOffset,
          pickup.position[2],
        );
        pickupLight.intensity = Math.max(0, 2.3 - disappear * 2.3);
      }
    });

    obstaclesRef.current.forEach((obstacle, index) => {
      const obstacleMesh = obstacleRefs.current[index];
      const shardMeshes = obstacleShardRefs.current[index] ?? [];

      if (!obstacle.destroyed) {
        if (obstacleMesh) {
          obstacleMesh.visible = true;
          obstacleMesh.position.set(...obstacle.position);
          obstacleMesh.rotation.x += d * 0.08;
          obstacleMesh.rotation.y += d * 0.18;
          obstacleMesh.rotation.z += d * 0.06;
          obstacleMesh.scale.set(1, 1, 1);

          const material = obstacleMesh.material as THREE.MeshStandardMaterial;
          material.opacity = 1;
        }

        shardMeshes.forEach((mesh) => {
          if (mesh) {
            mesh.visible = false;
            mesh.position.set(0, -260, 0);
          }
        });
      } else {
        obstacle.destructionProgress = Math.min(
          1,
          obstacle.destructionProgress + d * 1.8,
        );

        if (obstacleMesh) {
          obstacleMesh.visible = obstacle.destructionProgress < 1;
          obstacleMesh.position.set(...obstacle.position);
          obstacleMesh.scale.setScalar(1 - obstacle.destructionProgress * 0.35);
          obstacleMesh.rotation.x += d * 2.2;
          obstacleMesh.rotation.y += d * 2.6;

          const material = obstacleMesh.material as THREE.MeshStandardMaterial;
          material.opacity = Math.max(0, 1 - obstacle.destructionProgress * 1.4);
        }

        shardMeshes.forEach((mesh, shardIndex) => {
          if (!mesh) {
            return;
          }

          const progress = obstacle.destructionProgress;
          const signX = shardIndex % 2 === 0 ? -1 : 1;
          const signY = shardIndex < 2 ? 1 : -1;
          const signZ = shardIndex % 3 === 0 ? -1 : 1;

          mesh.visible = progress < 1;
          mesh.position.set(
            obstacle.position[0] + signX * progress * 3.2,
            obstacle.position[1] + signY * progress * 2.1,
            obstacle.position[2] + signZ * progress * 2.6,
          );
          mesh.rotation.x += d * (1.5 + shardIndex * 0.4);
          mesh.rotation.y += d * (1.8 + shardIndex * 0.3);
          mesh.scale.setScalar(Math.max(0.2, 0.9 - progress * 0.5));

          const material = mesh.material as THREE.MeshStandardMaterial;
          material.opacity = Math.max(0, 0.75 - progress * 0.75);
        });
      }
    });

    fallingHazardsRef.current.forEach((hazard, index) => {
      const hazardMesh = fallingHazardRefs.current[index];
      const shardMeshes = fallingShardRefs.current[index] ?? [];

      if (!hazard.active && !hazard.destroyed) {
        if (hazardMesh) {
          hazardMesh.visible = false;
        }
        shardMeshes.forEach((mesh) => {
          if (mesh) {
            mesh.visible = false;
            mesh.position.set(0, -260, 0);
          }
        });
        return;
      }

      if (hazard.destroyed) {
        hazard.destructionProgress = Math.min(1, hazard.destructionProgress + d * 2.4);

        if (hazardMesh) {
          hazardMesh.visible = hazard.destructionProgress < 1;
          hazardMesh.position.set(...hazard.position);
          hazardMesh.scale.setScalar(1 - hazard.destructionProgress * 0.4);
          hazardMesh.rotation.x += d * 2.8;
          hazardMesh.rotation.y += d * 3.2;

          const material = hazardMesh.material as THREE.MeshStandardMaterial;
          material.opacity = Math.max(0, 1 - hazard.destructionProgress * 1.6);
        }

        shardMeshes.forEach((mesh, shardIndex) => {
          if (!mesh) {
            return;
          }

          const progress = hazard.destructionProgress;
          mesh.visible = progress < 1;
          mesh.position.set(
            hazard.position[0] + (shardIndex - 1.5) * progress * 2.1,
            hazard.position[1] + progress * (1.8 + shardIndex * 0.2),
            hazard.position[2] + (shardIndex % 2 === 0 ? -1 : 1) * progress * 2.2,
          );
          mesh.rotation.x += d * (2 + shardIndex * 0.35);
          mesh.rotation.y += d * (2.2 + shardIndex * 0.28);

          const material = mesh.material as THREE.MeshStandardMaterial;
          material.opacity = Math.max(0, 0.72 - progress * 0.72);
        });

        if (hazard.destructionProgress >= 1) {
          hazard.active = false;
          hazard.destroyed = false;
          hazard.destructionProgress = 0;
          hazard.position = [0, -260, 0];
        }

        return;
      }

      hazard.position[1] -= hazard.velocity * d;

      if (hazardMesh) {
        hazardMesh.visible = true;
        hazardMesh.position.set(...hazard.position);
        hazardMesh.rotation.x += d * 0.65;
        hazardMesh.rotation.y += d * 0.85;
        hazardMesh.scale.set(1, 1, 1);

        const material = hazardMesh.material as THREE.MeshStandardMaterial;
        material.opacity = 1;
      }

      shardMeshes.forEach((mesh) => {
        if (mesh) {
          mesh.visible = false;
          mesh.position.set(0, -260, 0);
        }
      });

      if (hazard.position[1] < -24) {
        hazard.active = false;
        hazard.position = [0, -260, 0];
      }
    });

    enemyDroidsRef.current.forEach((droid, index) => {
      const droidMesh = enemyDroidRefs.current[index];
      const shardMeshes = enemyDroidShardRefs.current[index] ?? [];

      droid.fireCooldown = Math.max(0, droid.fireCooldown - d);

      if (!droid.destroyed) {
        const [baseX, baseY, baseZ] = droid.basePosition;
        const movementPhase = elapsed * droid.moveSpeed + droid.id * 0.65;
        let nextX = baseX;
        let nextY = baseY;

        if (droid.movement === "vertical") {
          nextY = baseY + Math.sin(movementPhase) * droid.moveRange;
        }

        if (droid.movement === "left_to_right") {
          nextX = baseX + Math.sin(movementPhase) * droid.moveRange;
        }

        if (droid.movement === "right_to_left") {
          nextX = baseX - Math.sin(movementPhase) * droid.moveRange;
        }

        droid.position = [nextX, nextY, baseZ];

        if (
          shipPos.distanceTo(
            new THREE.Vector3(droid.position[0], droid.position[1], droid.position[2]),
          ) < ENEMY_AGGRO_RANGE &&
          droid.fireCooldown <= 0
        ) {
          const openLaser = enemyLasersRef.current.find((laser) => !laser.active);

          if (openLaser) {
            const origin = new THREE.Vector3(
              droid.position[0],
              droid.position[1],
              droid.position[2],
            );
            const direction = shipPos.clone().sub(origin).normalize();

            openLaser.active = true;
            openLaser.position = [origin.x, origin.y, origin.z];
            openLaser.direction = [direction.x, direction.y, direction.z];
            openLaser.life = 2.6;
            droid.fireCooldown = 1.15 + Math.random() * 1.1;
          }
        }

        if (droidMesh) {
          droidMesh.visible = true;
          droidMesh.position.set(...droid.position);
          droidMesh.rotation.x += d * 0.25;
          droidMesh.rotation.y += d * 1.1;
          droidMesh.rotation.z += d * 0.18;
          droidMesh.scale.set(1, 1, 1);
          setObjectOpacity(droidMesh, 1);
        }

        shardMeshes.forEach((mesh) => {
          if (mesh) {
            mesh.visible = false;
            mesh.position.set(0, -260, 0);
          }
        });
        return;
      }

      droid.destructionProgress = Math.min(1, droid.destructionProgress + d * 2.2);

      if (droidMesh) {
        droidMesh.visible = droid.destructionProgress < 1;
        droidMesh.position.set(...droid.position);
        droidMesh.rotation.x += d * 1.8;
        droidMesh.rotation.y += d * 2.2;
        droidMesh.scale.setScalar(1 - droid.destructionProgress * 0.45);
        setObjectOpacity(droidMesh, Math.max(0, 1 - droid.destructionProgress * 1.4));
      }

      shardMeshes.forEach((mesh, shardIndex) => {
        if (!mesh) {
          return;
        }

        const progress = droid.destructionProgress;
        const signX = shardIndex % 2 === 0 ? -1 : 1;
        const signY = shardIndex < 2 ? 1 : -1;
        const signZ = shardIndex % 3 === 0 ? -1 : 1;

        mesh.visible = progress < 1;
        mesh.position.set(
          droid.position[0] + signX * progress * 2.2,
          droid.position[1] + signY * progress * 1.7,
          droid.position[2] + signZ * progress * 2.1,
        );
        mesh.rotation.x += d * (1.5 + shardIndex * 0.35);
        mesh.rotation.y += d * (1.8 + shardIndex * 0.35);
        mesh.scale.setScalar(Math.max(0.15, 0.85 - progress * 0.5));

        const material = mesh.material as THREE.MeshStandardMaterial;
        material.opacity = Math.max(0, 0.8 - progress * 0.8);
      });
    });

    let shotByDroid = false;

    enemyLasersRef.current.forEach((laser, index) => {
      const laserMesh = enemyLaserRefs.current[index];

      if (!laser.active) {
        if (laserMesh) {
          laserMesh.visible = false;
          laserMesh.position.set(0, -260, 0);
        }
        return;
      }

      const direction = new THREE.Vector3(...laser.direction);
      const currentPosition = new THREE.Vector3(...laser.position);
      const nextPosition = currentPosition.clone().addScaledVector(
        direction,
        ENEMY_LASER_SPEED * d,
      );
      const blockedByObstacle = obstaclesRef.current.some(
        (obstacle) =>
          !obstacle.destroyed && doesLaserHitObstacle(currentPosition, nextPosition, obstacle),
      );

      laser.position = [nextPosition.x, nextPosition.y, nextPosition.z];
      laser.life -= d;

      if (blockedByObstacle) {
        deactivateEnemyLaser(laser);
      }

      if (laser.active && nextPosition.distanceTo(shipPos) < 3.2) {
        deactivateEnemyLaser(laser);
        if (!hasAmethystShield) {
          shotByDroid = true;
        }
      }

      if (laser.life <= 0) {
        deactivateEnemyLaser(laser);
      }

      if (laserMesh) {
        laserMesh.visible = laser.active;

        if (laser.active) {
          laserMesh.position.set(...laser.position);
          laserMesh.quaternion.setFromUnitVectors(forwardAxis, direction.normalize());
        }
      }
    });

    if (shotByDroid) {
      onShotByDroid();
      return;
    }

    if (invulnerabilityRef.current <= 0 && !hasAmethystShield) {
      for (const asteroid of asteroidsRef.current) {
        if (asteroid.destroyed) {
          continue;
        }

        const distance = shipPos.distanceTo(new THREE.Vector3(...asteroid.position));

        if (distance < asteroid.scale + 2.6) {
          invulnerabilityRef.current = 1.2;
          onFatalCollision();
          return;
        }
      }

      for (const obstacle of obstaclesRef.current) {
        if (obstacle.destroyed) {
          continue;
        }

        const [width, height, depth] = obstacle.size;
        const [x, y, z] = obstacle.position;

        const insideObstacle =
          Math.abs(shipPos.x - x) < width / 2 + 2.2 &&
          Math.abs(shipPos.y - y) < height / 2 + 1.8 &&
          Math.abs(shipPos.z - z) < depth / 2 + 2.2;

        if (insideObstacle) {
          invulnerabilityRef.current = 1.5;
          onFatalCollision();
          return;
        }
      }

      for (const hazard of fallingHazardsRef.current) {
        if (!hazard.active || hazard.destroyed) {
          continue;
        }

        const distance = shipPos.distanceTo(new THREE.Vector3(...hazard.position));

        if (distance < hazard.scale + 2.4) {
          invulnerabilityRef.current = 1.5;
          onFatalCollision();
          return;
        }
      }

      for (const droid of enemyDroidsRef.current) {
        if (droid.destroyed) {
          continue;
        }

        const distance = shipPos.distanceTo(new THREE.Vector3(...droid.position));

        if (distance < droid.size * 0.9 + 2.4) {
          invulnerabilityRef.current = 1.5;
          onFatalCollision();
          return;
        }
      }
    }

    checkpoints.forEach((checkpoint) => {
      if (collectedRef.current.has(checkpoint.id)) {
        return;
      }

      const distance = shipPos.distanceTo(new THREE.Vector3(...checkpoint.pos));

      if (distance < 6) {
        collectedRef.current.add(checkpoint.id);
        onCheckpoint();
      }
    });

    const collectedFuelOrbs = fuelOrbsRef.current.filter((orb) => {
      if (orb.collected) {
        return false;
      }

      const distance = shipPos.distanceTo(new THREE.Vector3(...orb.position));
      return distance < orb.scale + 2.1;
    });

    if (collectedFuelOrbs.length > 0) {
      collectedFuelOrbs.forEach((orb) => {
        orb.collected = true;
        orb.collectionProgress = 0;
        orb.respawnTimer = 6 + Math.random() * 4;
      });

      onFuelCollected(collectedFuelOrbs.length);
    }

    const collectedAmethystClusters = amethystClustersRef.current.filter((cluster) => {
      if (cluster.collected) {
        return false;
      }

      const distance = shipPos.distanceTo(new THREE.Vector3(...cluster.position));
      return distance < cluster.scale + 2.4;
    });

    if (collectedAmethystClusters.length > 0) {
      collectedAmethystClusters.forEach((cluster) => {
        cluster.collected = true;
        cluster.collectionProgress = 0;
        cluster.respawnTimer = 18 + Math.random() * 6;
      });

      onAmethystCollected();
    }

    const collectedBoostPickups = boostPickupsRef.current.filter((pickup) => {
      if (pickup.collected) {
        return false;
      }

      const distance = shipPos.distanceTo(new THREE.Vector3(...pickup.position));
      return distance < pickup.scale + 2.2;
    });

    if (collectedBoostPickups.length > 0) {
      collectedBoostPickups.forEach((pickup) => {
        pickup.collected = true;
        pickup.collectionProgress = 0;
        pickup.respawnTimer = 10 + Math.random() * 5;
      });

      onBoostCollected(collectedBoostPickups.length);
    }
  });

  return (
    <>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#ffffff"
          opacity={0.72}
          size={1.1}
          sizeAttenuation
          transparent
        />
      </points>

      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#76c7ff"
          opacity={0.35}
          size={0.45}
          sizeAttenuation
          transparent
        />
      </points>

      <gridHelper args={[1700, 260, "#4ca7ff", "#163b78"]} position={[0, -5, 0]} />
      <fog attach="fog" args={["#8ec9ff", 230, 1250]} />
      <ambientLight color="#d8edff" intensity={0.58} />
      <directionalLight color="#eef8ff" intensity={1.35} position={[50, 80, 30]} />
      <directionalLight color="#83c8ff" intensity={0.6} position={[-30, 20, -50]} />

      {planets.map((planet) => (
        <group key={planet.id} position={planet.position}>
          <mesh>
            <sphereGeometry args={[planet.radius, 32, 32]} />
            <meshStandardMaterial
              color={planet.color}
              emissive={planet.emissive}
              emissiveIntensity={0.42}
            />
          </mesh>
          {planet.ringColor && planet.ringRotation && planet.ringSize ? (
            <mesh rotation={planet.ringRotation}>
              <ringGeometry args={[planet.ringSize[0], planet.ringSize[1], 64]} />
              <meshBasicMaterial
                color={planet.ringColor}
                opacity={0.22}
                side={THREE.DoubleSide}
                transparent
              />
            </mesh>
          ) : null}
        </group>
      ))}

      {decorativeWhiteOrbs.map((orb, index) => (
        <group
          key={orb.id}
          position={orb.position}
          rotation={orb.rotation}
          scale={[orb.scale, orb.scale, orb.scale]}
        >
          <primitive object={whiteOrbInstances[index]} />
        </group>
      ))}

      {asteroidsRef.current.map((asteroid, index) => (
        <group key={`asteroid-${asteroid.id}`}>
          <mesh
            ref={(element) => {
              asteroidRefs.current[index] = element;
            }}
            rotation={[asteroid.rotation, asteroid.rotation * 0.5, 0]}
          >
            <icosahedronGeometry args={[asteroid.scale, 0]} />
            <meshStandardMaterial
              color="#5a4937"
              metalness={0.08}
              opacity={1}
              roughness={0.92}
              transparent
            />
          </mesh>

          {Array.from({ length: 4 }).map((_, shardIndex) => (
            <mesh
              key={`asteroid-${asteroid.id}-shard-${shardIndex}`}
              ref={(element) => {
                if (!asteroidShardRefs.current[index]) {
                  asteroidShardRefs.current[index] = [];
                }

                asteroidShardRefs.current[index][shardIndex] = element;
              }}
              visible={false}
            >
              <icosahedronGeometry args={[Math.max(0.6, asteroid.scale * 0.24), 0]} />
              <meshStandardMaterial
                color="#8d6f50"
                emissive="#6a543e"
                emissiveIntensity={0.18}
                metalness={0.05}
                opacity={0.7}
                roughness={0.9}
                transparent
              />
            </mesh>
          ))}
        </group>
      ))}

      {obstaclesRef.current.map((obstacle, index) => (
        <group key={`obstacle-${obstacle.id}`}>
          <mesh
            ref={(element) => {
              obstacleRefs.current[index] = element;
            }}
          >
            <boxGeometry args={obstacle.size} />
            <meshStandardMaterial
              color={obstacle.color}
              emissive={obstacle.emissive}
              emissiveIntensity={0.25}
              metalness={0.45}
              opacity={1}
              roughness={0.35}
              transparent
            />
          </mesh>

          {Array.from({ length: 4 }).map((_, shardIndex) => (
            <mesh
              key={`obstacle-${obstacle.id}-shard-${shardIndex}`}
              ref={(element) => {
                if (!obstacleShardRefs.current[index]) {
                  obstacleShardRefs.current[index] = [];
                }

                obstacleShardRefs.current[index][shardIndex] = element;
              }}
              visible={false}
            >
              <boxGeometry
                args={[
                  Math.max(1, obstacle.size[0] * 0.28),
                  Math.max(1, obstacle.size[1] * 0.22),
                  Math.max(1, obstacle.size[2] * 0.28),
                ]}
              />
              <meshStandardMaterial
                color="#d9f4ff"
                emissive="#8fd8ff"
                emissiveIntensity={0.8}
                metalness={0.15}
                opacity={0.75}
                roughness={0.2}
                transparent
              />
            </mesh>
          ))}
        </group>
      ))}

      {fallingHazardsRef.current.map((hazard, index) => (
        <group key={`falling-hazard-${hazard.id}`}>
          <mesh
            ref={(element) => {
              fallingHazardRefs.current[index] = element;
            }}
            visible={false}
          >
            {hazard.shape === "sphere" ? (
              <sphereGeometry args={[hazard.scale, 18, 18]} />
            ) : (
              <icosahedronGeometry args={[hazard.scale, 0]} />
            )}
            <meshStandardMaterial
              color="#0b0b10"
              emissive="#1f2230"
              emissiveIntensity={0.18}
              metalness={0.24}
              opacity={1}
              roughness={0.82}
              transparent
            />
          </mesh>

          {Array.from({ length: 4 }).map((_, shardIndex) => (
            <mesh
              key={`falling-hazard-${hazard.id}-shard-${shardIndex}`}
              ref={(element) => {
                if (!fallingShardRefs.current[index]) {
                  fallingShardRefs.current[index] = [];
                }

                fallingShardRefs.current[index][shardIndex] = element;
              }}
              visible={false}
            >
              {hazard.shape === "sphere" ? (
                <sphereGeometry args={[Math.max(0.45, hazard.scale * 0.24), 10, 10]} />
              ) : (
                <icosahedronGeometry args={[Math.max(0.5, hazard.scale * 0.24), 0]} />
              )}
              <meshStandardMaterial
                color="#353846"
                emissive="#6f768f"
                emissiveIntensity={0.35}
                metalness={0.22}
                opacity={0.72}
                roughness={0.78}
                transparent
              />
            </mesh>
          ))}
        </group>
      ))}

      {fuelOrbsRef.current.map((orb, index) => (
        <group key={`fuel-orb-${orb.id}`}>
          <mesh
            ref={(element) => {
              fuelOrbRefs.current[index] = element;
            }}
          >
            <icosahedronGeometry args={[orb.scale, 0]} />
            <meshStandardMaterial
              color="#ffb74d"
              emissive="#ff7a00"
              emissiveIntensity={0.72}
              metalness={0.1}
              opacity={1}
              roughness={0.28}
              transparent
            />
          </mesh>
          {!reducedEffects || index % 2 === 0 ? (
            <pointLight
              ref={(element) => {
                fuelLightRefs.current[index] = element;
              }}
              color="#ff8c1a"
              distance={18}
              intensity={2.5}
            />
          ) : null}
        </group>
      ))}

      {amethystClustersRef.current.map((cluster, index) => (
        <group
          key={`amethyst-cluster-${cluster.id}`}
          ref={(element) => {
            amethystRefs.current[index] = element;
          }}
        >
          <primitive object={amethystInstances[index]} />
          {!reducedEffects || index % 2 === 0 ? (
            <pointLight
              ref={(element) => {
                amethystGlowRefs.current[index] = element;
              }}
              color="#b084ff"
              distance={22}
              intensity={2.4}
            />
          ) : null}
        </group>
      ))}

      {boostPickupsRef.current.map((pickup, index) => (
        <group key={`boost-pickup-${pickup.id}`}>
          <mesh
            ref={(element) => {
              boostPickupRefs.current[index] = element;
            }}
          >
            <icosahedronGeometry args={[pickup.scale, 0]} />
            <meshStandardMaterial
              color="#6dff8d"
              emissive="#2ad16f"
              emissiveIntensity={0.85}
              metalness={0.08}
              opacity={1}
              roughness={0.24}
              transparent
            />
          </mesh>
          {!reducedEffects || index % 2 === 0 ? (
            <pointLight
              ref={(element) => {
                boostPickupLightRefs.current[index] = element;
              }}
              color="#4dff88"
              distance={20}
              intensity={2.3}
            />
          ) : null}
        </group>
      ))}

      {enemyDroidsRef.current.map((droid, index) => (
        <group key={`enemy-droid-${droid.id}`}>
          <group
            ref={(element) => {
              enemyDroidRefs.current[index] = element;
            }}
            scale={(whiteOrbBaseSize / enemyUfoBaseSize) as number}
          >
            <primitive object={enemyDroidInstances[index]} rotation={[0, Math.PI / 2, 0]} />
          </group>

          {Array.from({ length: 4 }).map((_, shardIndex) => (
            <mesh
              key={`enemy-droid-${droid.id}-shard-${shardIndex}`}
              ref={(element) => {
                if (!enemyDroidShardRefs.current[index]) {
                  enemyDroidShardRefs.current[index] = [];
                }

                enemyDroidShardRefs.current[index][shardIndex] = element;
              }}
              visible={false}
            >
              <boxGeometry
                args={[
                  Math.max(0.6, droid.size * 0.34),
                  Math.max(0.6, droid.size * 0.34),
                  Math.max(0.6, droid.size * 0.34),
                ]}
              />
              <meshStandardMaterial
                color="#ff8c5a"
                emissive="#ff5d3a"
                emissiveIntensity={0.45}
                metalness={0.22}
                opacity={0.8}
                roughness={0.38}
                transparent
              />
            </mesh>
          ))}
        </group>
      ))}

      {enemyLasersRef.current.map((laser, index) => (
        <mesh
          key={`enemy-laser-${laser.id}`}
          ref={(element) => {
            enemyLaserRefs.current[index] = element;
          }}
          visible={false}
        >
          <boxGeometry args={[0.38, 0.38, 4.2]} />
          <meshBasicMaterial color="#ff3b30" />
        </mesh>
      ))}

      {checkpoints.map((checkpoint) => {
        const collected = collectedRef.current.has(checkpoint.id);

        return (
          <group key={`checkpoint-${checkpoint.id}`} position={checkpoint.pos}>
            <mesh
              ref={(element) => {
                checkpointRefs.current[checkpoint.id] = element;
              }}
            >
              <torusGeometry args={[4, 0.3, 8, 24]} />
              <meshBasicMaterial
                color={collected ? "#333333" : "#4b136f"}
                opacity={collected ? 0.2 : 0.8}
                transparent
              />
            </mesh>

            {!collected ? (
              <mesh>
                <circleGeometry args={[3.45, 24]} />
                <meshBasicMaterial
                  color="#d8b4fe"
                  opacity={0.45}
                  side={THREE.DoubleSide}
                  transparent
                />
              </mesh>
            ) : null}

            {!collected && (!reducedEffects || checkpoint.id % 2 === 0) ? (
              <pointLight color="#d8b4fe" distance={15} intensity={3} />
            ) : null}
          </group>
        );
      })}
    </>
  );
}

export const Environment = memo(EnvironmentInner);
Environment.displayName = "Environment";

useGLTF.preload("/models/AmethystCluster.glb");
useGLTF.preload("/models/ufo.glb");
useGLTF.preload("/models/whiteOrb.glb");
