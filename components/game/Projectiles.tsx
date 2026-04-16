import { useRef } from "react";
import type { MutableRefObject } from "react";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type {
  AsteroidData,
  EnemyDroidData,
  FallingHazardData,
  GameData,
  ObstacleData,
} from "./types";

interface ProjectilesProps {
  shipRef: MutableRefObject<THREE.Group | null>;
  keys: MutableRefObject<Record<string, boolean>>;
  gameData: MutableRefObject<GameData>;
  obstaclesRef: MutableRefObject<ObstacleData[]>;
  asteroidsRef: MutableRefObject<AsteroidData[]>;
  fallingHazardsRef: MutableRefObject<FallingHazardData[]>;
  enemyDroidsRef: MutableRefObject<EnemyDroidData[]>;
  onHazardDestroyed: (points?: number) => void;
  onObstacleDestroyed: () => void;
}

interface Projectile {
  pos: THREE.Vector3;
  dir: THREE.Vector3;
  life: number;
}

export function Projectiles({
  shipRef,
  keys,
  gameData,
  obstaclesRef,
  asteroidsRef,
  fallingHazardsRef,
  enemyDroidsRef,
  onHazardDestroyed,
  onObstacleDestroyed,
}: ProjectilesProps) {
  const projectiles = useRef<Projectile[]>([]);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const cooldownRef = useRef(0);
  const maxProjectiles = 20;
  const forwardAxisRef = useRef(new THREE.Vector3(0, 0, 1));
  const spawnDirectionRef = useRef(new THREE.Vector3());
  const spawnPositionRef = useRef(new THREE.Vector3());
  const collisionTargetRef = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (!shipRef.current || gameData.current.state !== "playing") {
      return;
    }

    const d = Math.min(delta, 0.05);
    cooldownRef.current -= d;

    if (
      (keys.current.KeyV || keys.current.Space) &&
      cooldownRef.current <= 0 &&
      projectiles.current.length < maxProjectiles
    ) {
      cooldownRef.current = 0.12;

      const direction = spawnDirectionRef.current
        .set(0, 0, -1)
        .applyQuaternion(shipRef.current.quaternion);
      const position = spawnPositionRef.current
        .copy(shipRef.current.position)
        .addScaledVector(direction, 6);

      projectiles.current.push({
        pos: position.clone(),
        dir: direction.clone(),
        life: 1.4,
      });
    }

    projectiles.current = projectiles.current.filter((projectile) => {
      projectile.pos.addScaledVector(projectile.dir, 320 * d);
      projectile.life -= d;

      for (const obstacle of obstaclesRef.current) {
        if (obstacle.destroyed) {
          continue;
        }

        const [width, height, depth] = obstacle.size;
        const [x, y, z] = obstacle.position;

        const hitObstacle =
          Math.abs(projectile.pos.x - x) < width / 2 + 0.5 &&
          Math.abs(projectile.pos.y - y) < height / 2 + 0.5 &&
          Math.abs(projectile.pos.z - z) < depth / 2 + 0.5;

        if (hitObstacle) {
          obstacle.destroyed = true;
          obstacle.destructionProgress = 0;
          projectile.life = 0;
          onObstacleDestroyed();
          onHazardDestroyed();
          break;
        }
      }

      for (const asteroid of asteroidsRef.current) {
        if (asteroid.destroyed) {
          continue;
        }

        const distance = projectile.pos.distanceTo(collisionTargetRef.current.set(...asteroid.position));

        if (distance < asteroid.scale + 0.8) {
          asteroid.destroyed = true;
          asteroid.destructionProgress = 0;
          projectile.life = 0;
          onHazardDestroyed();
          break;
        }
      }

      for (const hazard of fallingHazardsRef.current) {
        if (!hazard.active || hazard.destroyed) {
          continue;
        }

        const distance = projectile.pos.distanceTo(collisionTargetRef.current.set(...hazard.position));

        if (distance < hazard.scale + 0.9) {
          hazard.destroyed = true;
          hazard.destructionProgress = 0;
          projectile.life = 0;
          onHazardDestroyed();
          break;
        }
      }

      for (const droid of enemyDroidsRef.current) {
        if (droid.destroyed) {
          continue;
        }

        const distance = projectile.pos.distanceTo(collisionTargetRef.current.set(...droid.position));

        if (distance < droid.size * 0.85) {
          droid.destroyed = true;
          droid.destructionProgress = 0;
          projectile.life = 0;
          onHazardDestroyed(400);
          break;
        }
      }

      return projectile.life > 0;
    });

    meshRefs.current.forEach((mesh, index) => {
      if (mesh && projectiles.current[index]) {
        const projectile = projectiles.current[index];
        mesh.position.copy(projectile.pos);
        mesh.quaternion.setFromUnitVectors(forwardAxisRef.current, projectile.dir);
        mesh.visible = true;
        return;
      }

      if (mesh) {
        mesh.visible = false;
      }
    });
  });

  return (
    <>
      {Array.from({ length: maxProjectiles }).map((_, index) => (
        <mesh
          key={`projectile-${index}`}
          ref={(element) => {
            meshRefs.current[index] = element;
          }}
          visible={false}
        >
          <boxGeometry args={[0.56, 0.56, 6.4]} />
          <meshBasicMaterial color="#050505" />
        </mesh>
      ))}
    </>
  );
}
