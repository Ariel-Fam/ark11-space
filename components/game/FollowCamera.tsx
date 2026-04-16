import { useRef } from "react";
import type { MutableRefObject } from "react";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import type { GameData } from "./types";

interface FollowCameraProps {
  shipRef: MutableRefObject<THREE.Group | null>;
  gameData: MutableRefObject<GameData>;
}

export function FollowCamera({ shipRef, gameData }: FollowCameraProps) {
  const { camera } = useThree();
  const currentPos = useRef(new THREE.Vector3(0, 14, 26));
  const currentLookAt = useRef(new THREE.Vector3(0, 5, 0));
  const offsetRef = useRef(new THREE.Vector3());
  const desiredPosRef = useRef(new THREE.Vector3());
  const desiredLookAtRef = useRef(new THREE.Vector3());
  const lookAtOffsetRef = useRef(new THREE.Vector3(0, 1.8, -10));

  useFrame((_, delta) => {
    if (!shipRef.current) {
      return;
    }

    const d = Math.min(delta, 0.05);
    const ship = shipRef.current;

    const speedFactor = gameData.current.speed / 120;
    const distance = 19 + speedFactor * 6;
    const height = 6 + speedFactor * 2.5;

    const offset = offsetRef.current.set(0, height, distance).applyQuaternion(ship.quaternion);
    const desiredPos = desiredPosRef.current.copy(ship.position).add(offset);
    const desiredLookAt = desiredLookAtRef.current.copy(ship.position).add(
      lookAtOffsetRef.current.set(0, 1.8, -10).applyQuaternion(ship.quaternion),
    );

    const lerpSpeed = gameData.current.isBoosting ? 2 : 3;

    currentPos.current.lerp(desiredPos, lerpSpeed * d);
    currentLookAt.current.lerp(desiredLookAt, 4 * d);

    camera.position.copy(currentPos.current);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}
