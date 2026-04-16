"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";

import { Stars, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { Environment } from "./Environment";
import { FollowCamera } from "./FollowCamera";
import { HUD } from "./HUD";
import { MenuScreen } from "./MenuScreen";
import { Projectiles } from "./Projectiles";
import {
  ELEVATION_LEVELS,
  initialGameData,
  type AmethystClusterData,
  type AsteroidData,
  type BoostPickupData,
  type EnemyDroidData,
  type EnemyLaserData,
  type FallingHazardData,
  type FuelOrbData,
  type GameData,
  type ObstacleData,
} from "./types";
import { useKeyboard } from "./useKeyboard";

const MODEL_SCALE = 3;
const OBSTACLE_COUNT = 192;
const ASTEROID_COUNT = 92;
const FALLING_HAZARD_COUNT = 28;
const PLAY_AREA_RANGE = 520;
const FUEL_ORB_COUNT = 30;
const AMETHYST_CLUSTER_COUNT = 10;
const BOOST_PICKUP_COUNT = 14;
const ENEMY_DROID_COUNT = 16;
const ENEMY_LASER_POOL_SIZE = 64;
const MIN_SHIP_ALTITUDE = 1.5;
const MAX_SHIP_ALTITUDE = ELEVATION_LEVELS[ELEVATION_LEVELS.length - 1] + 12;

interface FlightAudioNodes {
  masterGain: GainNode;
  thrusterGain: GainNode;
  thrusterOscillator: OscillatorNode;
  thrusterFilter: BiquadFilterNode;
  boostGain: GainNode;
  boostOscillator: OscillatorNode;
  boostFilter: BiquadFilterNode;
}

interface AudioSettings {
  musicMuted: boolean;
  musicVolume: number;
  sfxMuted: boolean;
}

type CollectionSoundKind = "fuel" | "boost" | "amethyst" | "checkpoint";

const AUDIO_SETTINGS_STORAGE_KEY = "ark11-audio-settings";
const MUSIC_VOLUME_LEVELS = [0.16, 0.24, 0.34] as const;
const DEFAULT_MUSIC_VOLUME = MUSIC_VOLUME_LEVELS[1];
const SFX_OUTPUT_GAIN = 1.16;
const COLLECTION_SOUND_PEAK_GAIN = 0.095;
const defaultAudioSettings: AudioSettings = {
  musicMuted: false,
  musicVolume: DEFAULT_MUSIC_VOLUME,
  sfxMuted: false,
};

export function Game() {
  const [hudData, setHudData] = useState<GameData>({ ...initialGameData });
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(defaultAudioSettings);
  const gameDataRef = useRef<GameData>({ ...initialGameData });
  const audioSettingsRef = useRef<AudioSettings>(defaultAudioSettings);
  const audioSettingsHydratedRef = useRef(false);
  const skipNextAudioSettingsSaveRef = useRef(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sfxOutputGainRef = useRef<GainNode | null>(null);
  const flightAudioRef = useRef<FlightAudioNodes | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const obstacleSoundTimeRef = useRef(0);
  const shipGroupRef = useRef<THREE.Group>(null);
  const obstaclesRef = useRef<ObstacleData[]>(
    createObstacles(OBSTACLE_COUNT, PLAY_AREA_RANGE),
  );
  const asteroidsRef = useRef<AsteroidData[]>(
    createAsteroids(ASTEROID_COUNT, PLAY_AREA_RANGE + 60),
  );
  const fallingHazardsRef = useRef<FallingHazardData[]>(
    createFallingHazards(FALLING_HAZARD_COUNT, PLAY_AREA_RANGE),
  );
  const fuelOrbsRef = useRef<FuelOrbData[]>(
    createFuelOrbs(FUEL_ORB_COUNT, PLAY_AREA_RANGE),
  );
  const amethystClustersRef = useRef<AmethystClusterData[]>(
    createAmethystClusters(AMETHYST_CLUSTER_COUNT, PLAY_AREA_RANGE),
  );
  const boostPickupsRef = useRef<BoostPickupData[]>(
    createBoostPickups(BOOST_PICKUP_COUNT, PLAY_AREA_RANGE),
  );
  const enemyDroidsRef = useRef<EnemyDroidData[]>(
    createEnemyDroids(ENEMY_DROID_COUNT, PLAY_AREA_RANGE),
  );
  const enemyLasersRef = useRef<EnemyLaserData[]>(
    createEnemyLasers(ENEMY_LASER_POOL_SIZE),
  );
  const keys = useKeyboard();

  const updateGameData = useCallback((partial: Partial<GameData>) => {
    gameDataRef.current = { ...gameDataRef.current, ...partial };
    setHudData({ ...gameDataRef.current });
  }, []);

  useEffect(() => {
    audioSettingsRef.current = audioSettings;
  }, [audioSettings]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedSettings = window.localStorage.getItem(AUDIO_SETTINGS_STORAGE_KEY);
    if (!storedSettings) {
      return;
    }

    try {
      const parsedSettings = JSON.parse(storedSettings) as Partial<AudioSettings>;
      const parsedMusicVolume =
        typeof parsedSettings.musicVolume === "number"
          ? THREE.MathUtils.clamp(parsedSettings.musicVolume, 0, 1)
          : DEFAULT_MUSIC_VOLUME;

      setAudioSettings({
        musicMuted: Boolean(parsedSettings.musicMuted),
        musicVolume: parsedMusicVolume,
        sfxMuted: Boolean(parsedSettings.sfxMuted),
      });
    } catch {
      window.localStorage.removeItem(AUDIO_SETTINGS_STORAGE_KEY);
    }

    audioSettingsHydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!audioSettingsHydratedRef.current || skipNextAudioSettingsSaveRef.current) {
      skipNextAudioSettingsSaveRef.current = false;
      return;
    }

    window.localStorage.setItem(AUDIO_SETTINGS_STORAGE_KEY, JSON.stringify(audioSettings));
  }, [audioSettings]);

  const getAudioContext = useCallback(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const AudioContextClass =
      window.AudioContext ??
      (
        window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }
      ).webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    const context = audioContextRef.current ?? new AudioContextClass();
    audioContextRef.current = context;
    return context;
  }, []);

  const getSfxDestination = useCallback((context: AudioContext) => {
    if (sfxOutputGainRef.current) {
      return sfxOutputGainRef.current;
    }

    const outputGain = context.createGain();
    outputGain.gain.value = SFX_OUTPUT_GAIN;
    outputGain.connect(context.destination);
    sfxOutputGainRef.current = outputGain;
    return outputGain;
  }, []);

  const ensureMusicAudio = useCallback(() => {
    if (typeof window === "undefined") {
      return null;
    }

    if (musicAudioRef.current) {
      return musicAudioRef.current;
    }

    const audio = new Audio("/music/binaryPalindrome.wav");
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = audioSettingsRef.current.musicVolume;
    musicAudioRef.current = audio;
    return audio;
  }, []);

  const syncBackgroundMusic = useCallback(() => {
    const audio = ensureMusicAudio();
    if (!audio) {
      return;
    }

    if (audioSettingsRef.current.musicMuted) {
      audio.pause();
      return;
    }

    audio.volume = audioSettingsRef.current.musicVolume;
    void audio.play().catch(() => undefined);
  }, [ensureMusicAudio]);

  const ensureFlightAudio = useCallback(() => {
    const context = getAudioContext();
    if (!context) {
      return null;
    }

    if (context.state === "suspended") {
      void context.resume();
    }

    if (flightAudioRef.current) {
      return flightAudioRef.current;
    }

    const masterGain = context.createGain();
    const thrusterGain = context.createGain();
    const thrusterOscillator = context.createOscillator();
    const thrusterFilter = context.createBiquadFilter();
    const boostGain = context.createGain();
    const boostOscillator = context.createOscillator();
    const boostFilter = context.createBiquadFilter();

    masterGain.gain.value = 0.22;

    thrusterOscillator.type = "sawtooth";
    thrusterOscillator.frequency.setValueAtTime(88, context.currentTime);
    thrusterFilter.type = "lowpass";
    thrusterFilter.frequency.setValueAtTime(540, context.currentTime);
    thrusterFilter.Q.value = 1.2;
    thrusterGain.gain.setValueAtTime(0.0001, context.currentTime);

    boostOscillator.type = "triangle";
    boostOscillator.frequency.setValueAtTime(180, context.currentTime);
    boostFilter.type = "bandpass";
    boostFilter.frequency.setValueAtTime(900, context.currentTime);
    boostFilter.Q.value = 1.6;
    boostGain.gain.setValueAtTime(0.0001, context.currentTime);

    thrusterOscillator.connect(thrusterFilter);
    thrusterFilter.connect(thrusterGain);
    thrusterGain.connect(masterGain);

    boostOscillator.connect(boostFilter);
    boostFilter.connect(boostGain);
    boostGain.connect(masterGain);

    masterGain.connect(getSfxDestination(context));

    thrusterOscillator.start();
    boostOscillator.start();

    const nodes: FlightAudioNodes = {
      masterGain,
      thrusterGain,
      thrusterOscillator,
      thrusterFilter,
      boostGain,
      boostOscillator,
      boostFilter,
    };

    flightAudioRef.current = nodes;
    return nodes;
  }, [getAudioContext, getSfxDestination]);

  const stopFlightAudio = useCallback(() => {
    const context = audioContextRef.current;
    const nodes = flightAudioRef.current;

    if (!context || !nodes || context.state === "closed") {
      return;
    }

    const now = context.currentTime;
    nodes.thrusterGain.gain.cancelScheduledValues(now);
    nodes.boostGain.gain.cancelScheduledValues(now);
    nodes.thrusterGain.gain.setTargetAtTime(0.0001, now, 0.03);
    nodes.boostGain.gain.setTargetAtTime(0.0001, now, 0.03);
  }, []);

  const updateFlightAudio = useCallback(
    (thrusting: boolean, boosting: boolean, speedRatio: number) => {
      if (audioSettingsRef.current.sfxMuted) {
        stopFlightAudio();
        return;
      }

      const shouldPlay = thrusting || boosting;
      const nodes = shouldPlay ? ensureFlightAudio() : flightAudioRef.current;
      const context = audioContextRef.current;

      if (!nodes || !context || context.state === "closed") {
        return;
      }

      if (context.state === "suspended" && shouldPlay) {
        void context.resume();
      }

      const now = context.currentTime;
      const clampedSpeed = THREE.MathUtils.clamp(speedRatio, 0, 1);
      const thrusterGainTarget = thrusting ? 0.07 + clampedSpeed * 0.07 : 0.0001;
      const boostGainTarget = boosting ? 0.05 + clampedSpeed * 0.07 : 0.0001;
      const thrusterFrequency = 88 + clampedSpeed * 58 + (boosting ? 16 : 0);
      const boostFrequency = 180 + clampedSpeed * 120;
      const thrusterFilterFrequency = 540 + clampedSpeed * 920 + (boosting ? 240 : 0);
      const boostFilterFrequency = 900 + clampedSpeed * 1200;

      nodes.thrusterOscillator.frequency.cancelScheduledValues(now);
      nodes.boostOscillator.frequency.cancelScheduledValues(now);
      nodes.thrusterFilter.frequency.cancelScheduledValues(now);
      nodes.boostFilter.frequency.cancelScheduledValues(now);
      nodes.thrusterGain.gain.cancelScheduledValues(now);
      nodes.boostGain.gain.cancelScheduledValues(now);

      nodes.thrusterOscillator.frequency.setTargetAtTime(thrusterFrequency, now, 0.05);
      nodes.boostOscillator.frequency.setTargetAtTime(boostFrequency, now, 0.04);
      nodes.thrusterFilter.frequency.setTargetAtTime(thrusterFilterFrequency, now, 0.05);
      nodes.boostFilter.frequency.setTargetAtTime(boostFilterFrequency, now, 0.04);
      nodes.thrusterGain.gain.setTargetAtTime(thrusterGainTarget, now, 0.04);
      nodes.boostGain.gain.setTargetAtTime(boostGainTarget, now, 0.03);
    },
    [ensureFlightAudio, stopFlightAudio],
  );

  const playObstacleDestroyedSound = useCallback(() => {
    if (audioSettingsRef.current.sfxMuted) {
      return;
    }

    const context = getAudioContext();
    if (!context) {
      return;
    }

    if (context.state === "suspended") {
      void context.resume();
    }

    const now = context.currentTime;
    if (now - obstacleSoundTimeRef.current < 0.04) {
      return;
    }

    obstacleSoundTimeRef.current = now;

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const filter = context.createBiquadFilter();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(220, now);
    oscillator.frequency.exponentialRampToValueAtTime(96, now + 0.18);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1500, now);
    filter.frequency.exponentialRampToValueAtTime(340, now + 0.18);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.092, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(getSfxDestination(context));

    oscillator.start(now);
    oscillator.stop(now + 0.22);
  }, [getAudioContext, getSfxDestination]);

  const playCollectionSound = useCallback(
    (kind: CollectionSoundKind) => {
      if (audioSettingsRef.current.sfxMuted) {
        return;
      }

      const context = getAudioContext();
      if (!context) {
        return;
      }

      if (context.state === "suspended") {
        void context.resume();
      }

      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      const filter = context.createBiquadFilter();

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(COLLECTION_SOUND_PEAK_GAIN, now + 0.012);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

      if (kind === "fuel") {
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(280, now);
        oscillator.frequency.exponentialRampToValueAtTime(430, now + 0.18);
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1300, now);
        filter.frequency.exponentialRampToValueAtTime(2100, now + 0.2);
      } else if (kind === "boost") {
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(360, now);
        oscillator.frequency.exponentialRampToValueAtTime(620, now + 0.15);
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1200, now);
        filter.frequency.exponentialRampToValueAtTime(1800, now + 0.18);
      } else if (kind === "amethyst") {
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(510, now);
        oscillator.frequency.exponentialRampToValueAtTime(340, now + 0.22);
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(880, now);
        filter.frequency.exponentialRampToValueAtTime(640, now + 0.22);
      } else {
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(420, now);
        oscillator.frequency.exponentialRampToValueAtTime(620, now + 0.16);
        filter.type = "highpass";
        filter.frequency.setValueAtTime(260, now);
        filter.frequency.exponentialRampToValueAtTime(420, now + 0.2);
      }

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(getSfxDestination(context));

      oscillator.start(now);
      oscillator.stop(now + 0.26);
    },
    [getAudioContext, getSfxDestination],
  );

  const playShotByDroidSound = useCallback(() => {
    if (audioSettingsRef.current.sfxMuted) {
      return;
    }

    const context = getAudioContext();
    if (!context) {
      return;
    }

    if (context.state === "suspended") {
      void context.resume();
    }

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const filter = context.createBiquadFilter();

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(240, now);
    oscillator.frequency.exponentialRampToValueAtTime(110, now + 0.16);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(720, now);
    filter.frequency.exponentialRampToValueAtTime(360, now + 0.18);
    filter.Q.value = 1.4;

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(getSfxDestination(context));

    oscillator.start(now);
    oscillator.stop(now + 0.24);
  }, [getAudioContext, getSfxDestination]);

  const toggleMusicMuted = useCallback(() => {
    setAudioSettings((current) => ({
      ...current,
      musicMuted: !current.musicMuted,
    }));
  }, []);

  const cycleMusicVolume = useCallback(() => {
    setAudioSettings((current) => {
      const currentIndex = MUSIC_VOLUME_LEVELS.findIndex(
        (level) => Math.abs(level - current.musicVolume) < 0.001,
      );
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % MUSIC_VOLUME_LEVELS.length;

      return {
        ...current,
        musicVolume: MUSIC_VOLUME_LEVELS[nextIndex],
      };
    });
  }, []);

  const toggleSfxMuted = useCallback(() => {
    setAudioSettings((current) => ({
      ...current,
      sfxMuted: !current.sfxMuted,
    }));
  }, []);

  useEffect(() => {
    syncBackgroundMusic();
  }, [audioSettings.musicMuted, audioSettings.musicVolume, syncBackgroundMusic]);

  useEffect(() => {
    if (audioSettings.sfxMuted) {
      stopFlightAudio();
    }
  }, [audioSettings.sfxMuted, stopFlightAudio]);

  useEffect(() => {
    const unlockAudio = () => {
      syncBackgroundMusic();
      const context = getAudioContext();
      if (context?.state === "suspended") {
        void context.resume();
      }
    };

    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio);

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, [getAudioContext, syncBackgroundMusic]);

  useEffect(() => {
    return () => {
      const context = audioContextRef.current;
      if (flightAudioRef.current && context && context.state !== "closed") {
        const { thrusterOscillator, boostOscillator, masterGain } = flightAudioRef.current;
        const now = context.currentTime;
        masterGain.gain.cancelScheduledValues(now);
        masterGain.gain.setTargetAtTime(0.0001, now, 0.03);
        thrusterOscillator.stop(now + 0.08);
        boostOscillator.stop(now + 0.08);
      }

      musicAudioRef.current?.pause();
      musicAudioRef.current = null;
      audioContextRef.current?.close().catch(() => undefined);
    };
  }, []);

  const handleStart = useCallback(() => {
    stopFlightAudio();
    syncBackgroundMusic();

    const newData: GameData = {
      ...initialGameData,
      state: "playing",
      highScore: gameDataRef.current.highScore,
    };

    gameDataRef.current = newData;
    setHudData(newData);
    obstaclesRef.current = createObstacles(OBSTACLE_COUNT, PLAY_AREA_RANGE);
    asteroidsRef.current = createAsteroids(ASTEROID_COUNT, PLAY_AREA_RANGE + 60);
    fallingHazardsRef.current = createFallingHazards(
      FALLING_HAZARD_COUNT,
      PLAY_AREA_RANGE,
    );
    fuelOrbsRef.current = createFuelOrbs(FUEL_ORB_COUNT, PLAY_AREA_RANGE);
    amethystClustersRef.current = createAmethystClusters(
      AMETHYST_CLUSTER_COUNT,
      PLAY_AREA_RANGE,
    );
    boostPickupsRef.current = createBoostPickups(BOOST_PICKUP_COUNT, PLAY_AREA_RANGE);
    enemyDroidsRef.current = createEnemyDroids(ENEMY_DROID_COUNT, PLAY_AREA_RANGE);
    enemyLasersRef.current = createEnemyLasers(ENEMY_LASER_POOL_SIZE);

    if (shipGroupRef.current) {
      shipGroupRef.current.position.set(0, 5, 0);
      shipGroupRef.current.rotation.set(0, 0, 0);
    }
  }, [stopFlightAudio, syncBackgroundMusic]);

  const handlePause = useCallback(() => {
    stopFlightAudio();
    updateGameData({ state: "paused" });
  }, [stopFlightAudio, updateGameData]);

  const handleResume = useCallback(() => {
    syncBackgroundMusic();
    updateGameData({ state: "playing" });
  }, [syncBackgroundMusic, updateGameData]);

  const handleCollision = useCallback(() => {
    const data = gameDataRef.current;
    let nextShield = data.shield;
    let nextHealth = data.health;

    if (nextShield > 0) {
      nextShield = Math.max(0, nextShield - 25);
    } else {
      nextHealth = Math.max(0, nextHealth - 20);
    }

    if (nextHealth <= 0) {
      stopFlightAudio();
      updateGameData({
        gameOverReason: "destroyed",
        health: 0,
        shield: 0,
        state: "gameover",
        highScore: Math.max(data.highScore, data.score),
      });
      return;
    }

    updateGameData({ health: nextHealth, shield: nextShield });
  }, [stopFlightAudio, updateGameData]);

  const handleCheckpoint = useCallback(() => {
    const data = gameDataRef.current;

    playCollectionSound("checkpoint");
    updateGameData({
      checkpoints: data.checkpoints + 1,
      score: data.score + 500,
      shield: Math.min(100, data.shield + 15),
    });
  }, [playCollectionSound, updateGameData]);

  const handleFatalCollision = useCallback(() => {
    const data = gameDataRef.current;

    stopFlightAudio();
    updateGameData({
      gameOverReason: "destroyed",
      health: 0,
      shield: 0,
      state: "gameover",
      highScore: Math.max(data.highScore, data.score),
    });
  }, [stopFlightAudio, updateGameData]);

  const handleOutOfFuel = useCallback(() => {
    const data = gameDataRef.current;

    stopFlightAudio();
    updateGameData({
      fuel: 0,
      gameOverReason: "out_of_fuel",
      state: "gameover",
      highScore: Math.max(data.highScore, data.score),
    });
  }, [stopFlightAudio, updateGameData]);

  const handleShotByDroid = useCallback(() => {
    const data = gameDataRef.current;

    playShotByDroidSound();
    stopFlightAudio();
    updateGameData({
      gameOverReason: "shot_by_droid",
      health: 0,
      shield: 0,
      state: "gameover",
      highScore: Math.max(data.highScore, data.score),
    });
  }, [playShotByDroidSound, stopFlightAudio, updateGameData]);

  const handleHazardDestroyed = useCallback((points = 250) => {
    const data = gameDataRef.current;

    updateGameData({
      score: data.score + points,
    });
  }, [updateGameData]);

  const handleFuelCollected = useCallback((count: number) => {
    const data = gameDataRef.current;
    const fuelGain = count * 25;

    playCollectionSound("fuel");
    updateGameData({
      fuel: Math.min(100, data.fuel + fuelGain),
    });
  }, [playCollectionSound, updateGameData]);

  const handleAmethystCollected = useCallback(() => {
    const data = gameDataRef.current;

    playCollectionSound("amethyst");
    updateGameData({
      amethystShieldTime: Math.max(30, data.amethystShieldTime),
    });
  }, [playCollectionSound, updateGameData]);

  const handleBoostCollected = useCallback((count: number) => {
    const data = gameDataRef.current;

    playCollectionSound("boost");
    updateGameData({
      boostMeter: Math.min(100, data.boostMeter + count * 38),
    });
  }, [playCollectionSound, updateGameData]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Escape") {
        return;
      }

      if (gameDataRef.current.state === "playing") {
        handlePause();
      } else if (gameDataRef.current.state === "paused") {
        handleResume();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handlePause, handleResume]);

  return (
    <div className="relative h-full w-full select-none overflow-hidden bg-black">
      <Canvas
        camera={{ fov: 70, near: 0.1, far: 1000 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2;
        }}
        style={{ inset: 0, position: "absolute" }}
      >
        <color attach="background" args={["#9ccfff"]} />
        <Stars
          count={5000}
          depth={100}
          factor={3}
          fade
          radius={300}
          saturation={0.5}
          speed={0.5}
        />

        <Suspense fallback={null}>
          <ShipWrapper
            gameData={gameDataRef}
            keys={keys}
            onFlightAudioChange={updateFlightAudio}
            onOutOfFuel={handleOutOfFuel}
            onUpdate={updateGameData}
            shipGroupRef={shipGroupRef}
          />
        </Suspense>

        <FollowCamera gameData={gameDataRef} shipRef={shipGroupRef} />

        <Suspense fallback={null}>
          <Environment
            amethystClustersRef={amethystClustersRef}
            asteroidsRef={asteroidsRef}
            boostPickupsRef={boostPickupsRef}
            enemyDroidsRef={enemyDroidsRef}
            enemyLasersRef={enemyLasersRef}
            fallingHazardsRef={fallingHazardsRef}
            fuelOrbsRef={fuelOrbsRef}
            gameData={gameDataRef}
            obstaclesRef={obstaclesRef}
            onCheckpoint={handleCheckpoint}
            onCollision={handleCollision}
            onAmethystCollected={handleAmethystCollected}
            onBoostCollected={handleBoostCollected}
            onFuelCollected={handleFuelCollected}
            onFatalCollision={handleFatalCollision}
            onShotByDroid={handleShotByDroid}
            shipRef={shipGroupRef}
          />
        </Suspense>

        <Projectiles
          asteroidsRef={asteroidsRef}
          enemyDroidsRef={enemyDroidsRef}
          fallingHazardsRef={fallingHazardsRef}
          gameData={gameDataRef}
          keys={keys}
          obstaclesRef={obstaclesRef}
          onHazardDestroyed={handleHazardDestroyed}
          onObstacleDestroyed={playObstacleDestroyedSound}
          shipRef={shipGroupRef}
        />
      </Canvas>

      <HUD
        data={hudData}
        musicMuted={audioSettings.musicMuted}
        musicVolumeLabel={getMusicVolumeLabel(audioSettings.musicVolume)}
        onPause={handlePause}
        onCycleMusicVolume={cycleMusicVolume}
        onToggleMusic={toggleMusicMuted}
        onToggleSfx={toggleSfxMuted}
        sfxMuted={audioSettings.sfxMuted}
      />
      <MenuScreen
        data={hudData}
        musicMuted={audioSettings.musicMuted}
        musicVolumeLabel={getMusicVolumeLabel(audioSettings.musicVolume)}
        onCycleMusicVolume={cycleMusicVolume}
        onResume={handleResume}
        onStart={handleStart}
        onToggleMusic={toggleMusicMuted}
        onToggleSfx={toggleSfxMuted}
        sfxMuted={audioSettings.sfxMuted}
      />
    </div>
  );
}

interface ShipWrapperProps {
  keys: MutableRefObject<Record<string, boolean>>;
  gameData: MutableRefObject<GameData>;
  onFlightAudioChange: (thrusting: boolean, boosting: boolean, speedRatio: number) => void;
  onOutOfFuel: () => void;
  onUpdate: (data: Partial<GameData>) => void;
  shipGroupRef: MutableRefObject<THREE.Group | null>;
}

function ShipWrapper({
  keys,
  gameData,
  onFlightAudioChange,
  onOutOfFuel,
  onUpdate,
  shipGroupRef,
}: ShipWrapperProps) {
  return (
    <group ref={shipGroupRef}>
      <ShieldAura gameData={gameData} />
      <SpaceshipInner
        gameData={gameData}
        keys={keys}
        onFlightAudioChange={onFlightAudioChange}
        onOutOfFuel={onOutOfFuel}
        onUpdate={onUpdate}
        parentRef={shipGroupRef}
      />
    </group>
  );
}

interface SpaceshipInnerProps {
  keys: MutableRefObject<Record<string, boolean>>;
  gameData: MutableRefObject<GameData>;
  onFlightAudioChange: (thrusting: boolean, boosting: boolean, speedRatio: number) => void;
  onOutOfFuel: () => void;
  onUpdate: (data: Partial<GameData>) => void;
  parentRef: MutableRefObject<THREE.Group | null>;
}

function SpaceshipInner({
  keys,
  gameData,
  onFlightAudioChange,
  onOutOfFuel,
  onUpdate,
  parentRef,
}: SpaceshipInnerProps) {
  const velocityRef = useRef(0);
  const bankRef = useRef(0);
  const rollRef = useRef(0);
  const pitchRef = useRef(0);
  const flameGroupRef = useRef<THREE.Group>(null);
  const flameCoreRefs = useRef<(THREE.Mesh | null)[]>([]);
  const flameOuterRefs = useRef<(THREE.Mesh | null)[]>([]);
  const flameLightRef = useRef<THREE.PointLight>(null);
  const { scene } = useGLTF("/models/spaceship.glb");

  useFrame((state, delta) => {
    if (!parentRef.current || gameData.current.state !== "playing") {
      onFlightAudioChange(false, false, 0);
      if (flameGroupRef.current) {
        flameGroupRef.current.visible = false;
      }
      return;
    }

    const pressedKeys = keys.current;
    const d = Math.min(delta, 0.05);
    const ship = parentRef.current;
    const elapsed = state.clock.elapsedTime;

    const thrust = pressedKeys.KeyW || pressedKeys.ArrowUp;
    const brake = pressedKeys.KeyS || pressedKeys.ArrowDown;
    const turnLeft = pressedKeys.KeyA || pressedKeys.ArrowLeft;
    const turnRight = pressedKeys.KeyD || pressedKeys.ArrowRight;
    const rollLeft = pressedKeys.KeyQ;
    const rollRight = pressedKeys.KeyE;
    const ascend = pressedKeys.KeyR;
    const descend = pressedKeys.KeyF;
    const boost = pressedKeys.KeyB;

    const maxSpeed = boost && gameData.current.boostMeter > 0 ? 180 : 120;
    const acceleration = boost && gameData.current.boostMeter > 0 ? 80 : 40;

    if (thrust) {
      velocityRef.current = Math.min(
        velocityRef.current + acceleration * d,
        maxSpeed,
      );
    } else if (brake) {
      velocityRef.current = Math.max(velocityRef.current - 60 * d, -20);
    } else {
      velocityRef.current *= 1 - 1.5 * d;

      if (Math.abs(velocityRef.current) < 0.5) {
        velocityRef.current = 0;
      }
    }

    let nextBoost = gameData.current.boostMeter;
    const nextShieldTime = Math.max(0, gameData.current.amethystShieldTime - d);
    const boostingNow = boost && thrust && nextBoost > 0;

    if (boostingNow) {
      nextBoost = Math.max(0, nextBoost - 30 * d);
    } else {
      nextBoost = Math.min(100, nextBoost + 10 * d);
    }

    const turnRate = 2;

    if (turnLeft) {
      ship.rotation.y += turnRate * d;
    }

    if (turnRight) {
      ship.rotation.y -= turnRate * d;
    }

    const targetBank = turnLeft ? 0.4 : turnRight ? -0.4 : 0;
    bankRef.current += (targetBank - bankRef.current) * 4 * d;

    if (rollLeft) {
      rollRef.current += 3 * d;
    }

    if (rollRight) {
      rollRef.current -= 3 * d;
    }

    rollRef.current *= 1 - 2 * d;
    const targetPitch = ascend ? -0.22 : descend ? 0.22 : 0;
    pitchRef.current += (targetPitch - pitchRef.current) * 4 * d;
    ship.rotation.x = pitchRef.current;
    ship.rotation.z = bankRef.current + rollRef.current;

    const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(
      ship.quaternion,
    );

    ship.position.addScaledVector(direction, velocityRef.current * d);
    if (ascend) {
      ship.position.y = Math.min(MAX_SHIP_ALTITUDE, ship.position.y + 30 * d);
    } else if (descend) {
      ship.position.y = Math.max(MIN_SHIP_ALTITUDE, ship.position.y - 28 * d);
    } else {
      ship.position.y = THREE.MathUtils.clamp(
        ship.position.y,
        MIN_SHIP_ALTITUDE,
        MAX_SHIP_ALTITUDE,
      );
    }

    const score = gameData.current.score + velocityRef.current * d * 0.1;
    const fuelBurnRate =
      0.95 + (Math.abs(velocityRef.current) / 120) * 0.8 + (boostingNow ? 2.2 : 0);
    const nextFuel = Math.max(0, gameData.current.fuel - fuelBurnRate * d);
    const flameThrottle = thrust ? (boostingNow ? 1 : 0.6) : 0;

    if (flameGroupRef.current) {
      flameGroupRef.current.visible = flameThrottle > 0;

      if (flameThrottle > 0) {
        const pulse = 0.92 + Math.sin(elapsed * 28) * 0.08;
        const flareLength = (boostingNow ? 1.45 : 1) * pulse;

        flameCoreRefs.current.forEach((mesh, index) => {
          if (!mesh) {
            return;
          }

          mesh.visible = true;
          mesh.scale.set(1.15, 1.05 + index * 0.05, 1 + flareLength * 1.15);
        });

        flameOuterRefs.current.forEach((mesh, index) => {
          if (!mesh) {
            return;
          }

          mesh.visible = true;
          mesh.scale.set(1.18, 1.18, 1.2 + flareLength * (1.35 + index * 0.07));
        });

        if (flameLightRef.current) {
          flameLightRef.current.intensity = boostingNow ? 2.8 : 1.7;
          flameLightRef.current.distance = boostingNow ? 26 : 18;
        }
      }
    }

    if (nextFuel <= 0) {
      onFlightAudioChange(false, false, 0);
      if (flameGroupRef.current) {
        flameGroupRef.current.visible = false;
      }
      onOutOfFuel();
      return;
    }

    onFlightAudioChange(thrust, boostingNow, Math.abs(velocityRef.current) / 180);

    onUpdate({
      fuel: nextFuel,
      speed: Math.abs(velocityRef.current),
      boostMeter: nextBoost,
      amethystShieldTime: nextShieldTime,
      isBoosting: boostingNow,
      score,
    });
  });

  return (
    <>
      <primitive object={scene} rotation={[0, -Math.PI / 2, 0]} scale={MODEL_SCALE} />
      <group ref={flameGroupRef} position={[0, -0.2, 8.6]} visible={false}>
        {[
          { position: [-2.15, -0.1, 0.2] as [number, number, number], scale: 1.15 },
          { position: [0, 0.15, 0.45] as [number, number, number], scale: 1.05 },
          { position: [2.15, -0.1, 0.2] as [number, number, number], scale: 1.15 },
        ].map((engine, index) => (
          <group key={`engine-flame-${index}`} position={engine.position}>
            <mesh
              ref={(element) => {
                flameOuterRefs.current[index] = element;
              }}
              rotation={[-Math.PI / 2, 0, 0]}
              scale={[engine.scale, engine.scale, engine.scale]}
            >
              <coneGeometry args={[1.35, 6.6, 14, 1, true]} />
              <meshBasicMaterial color="#ff6b1a" opacity={0.28} transparent />
            </mesh>
            <mesh
              ref={(element) => {
                flameCoreRefs.current[index] = element;
              }}
              position={[0, 0, -0.35]}
              rotation={[-Math.PI / 2, 0, 0]}
              scale={[engine.scale * 0.62, engine.scale * 0.62, engine.scale * 0.62]}
            >
              <coneGeometry args={[0.74, 4.8, 12, 1, true]} />
              <meshBasicMaterial color="#9fe7ff" opacity={0.9} transparent />
            </mesh>
          </group>
        ))}
        <pointLight
          ref={flameLightRef}
          color="#ff7a1a"
          distance={18}
          intensity={1.7}
          position={[0, 0, 3.6]}
        />
      </group>
    </>
  );
}

useGLTF.preload("/models/spaceship.glb");

function ShieldAura({
  gameData,
}: {
  gameData: MutableRefObject<GameData>;
}) {
  const shieldRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!shieldRef.current) {
      return;
    }

    const active = gameData.current.amethystShieldTime > 0;
    shieldRef.current.visible = active;

    if (!active) {
      return;
    }

    const pulse = 1 + Math.sin(clock.elapsedTime * 3.4) * 0.035;
    shieldRef.current.scale.setScalar(pulse);
    shieldRef.current.rotation.y += 0.01;

    const material = shieldRef.current.material as THREE.MeshStandardMaterial;
    material.opacity = 0.15 + Math.sin(clock.elapsedTime * 4.2) * 0.02;
  });

  return (
    <mesh ref={shieldRef} visible={false}>
      <sphereGeometry args={[8.4, 28, 28]} />
      <meshStandardMaterial
        color="#b18cff"
        emissive="#7b4dff"
        emissiveIntensity={0.6}
        metalness={0.08}
        opacity={0.16}
        roughness={0.18}
        transparent
      />
    </mesh>
  );
}

function createObstacles(count: number, range: number): ObstacleData[] {
  const obstaclePalettes = [
    { color: "#7bc8ff", emissive: "#4ca7ff" },
    { color: "#ffb86b", emissive: "#ff8c1a" },
    { color: "#95f28f", emissive: "#45d96b" },
    { color: "#c8a6ff", emissive: "#8f63ff" },
    { color: "#ff8fa8", emissive: "#ff4d79" },
    { color: "#ffe082", emissive: "#ffca28" },
  ];

  return Array.from({ length: count }, (_, index) => {
    const width = 4.5 + Math.random() * 7.5;
    const height = 5 + Math.random() * 12;
    const depth = 4.5 + Math.random() * 7.5;
    const palette = obstaclePalettes[index % obstaclePalettes.length];
    const level = ELEVATION_LEVELS[index % ELEVATION_LEVELS.length];
    const laneSpread = index % 2 === 0 ? 7 : 10;
    const corridorX =
      (Math.random() - 0.5) * range * 1.05 + ((index % 9) - 4) * 22;
    const corridorZ =
      (Math.random() - 0.5) * range * 1.04 + ((index % 10) - 4.5) * 24;

    return {
      id: index,
      position: [
        THREE.MathUtils.clamp(corridorX, -range, range),
        level + (Math.random() - 0.5) * laneSpread,
        THREE.MathUtils.clamp(corridorZ, -range, range),
      ],
      size: [width, height, depth],
      color: palette.color,
      emissive: palette.emissive,
      destroyed: false,
      destructionProgress: 0,
    };
  });
}

function createAsteroids(count: number, range: number): AsteroidData[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    position: [
      (Math.random() - 0.5) * range * 2,
      ELEVATION_LEVELS[index % ELEVATION_LEVELS.length] +
        (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * range * 2,
    ],
    scale: 2.4 + Math.random() * 4.8,
    rotation: Math.random() * Math.PI * 2,
    destroyed: false,
    destructionProgress: 0,
  }));
}

function createFallingHazards(count: number, range: number): FallingHazardData[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    shape: Math.random() > 0.5 ? "sphere" : "icosahedron",
    position: [0, -200, 0],
    scale: 2.6 + Math.random() * 2.8,
    velocity: 18 + Math.random() * 14,
    active: false,
    destroyed: false,
    destructionProgress: 0,
  }));
}

function createFuelOrbs(count: number, range: number): FuelOrbData[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    position: [
      (Math.random() - 0.5) * range * 1.7,
      ELEVATION_LEVELS[index % ELEVATION_LEVELS.length] +
        (Math.random() - 0.5) * 7,
      (Math.random() - 0.5) * range * 1.7,
    ],
    scale: 2.5 + Math.random() * 0.9,
    collected: false,
    collectionProgress: 0,
    respawnTimer: 0,
  }));
}

function createAmethystClusters(count: number, range: number): AmethystClusterData[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    position: [
      (Math.random() - 0.5) * range * 1.5,
      ELEVATION_LEVELS[index % ELEVATION_LEVELS.length] + (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * range * 1.45,
    ],
    scale: 1.8 + Math.random() * 0.45,
    collected: false,
    collectionProgress: 0,
    respawnTimer: 0,
  }));
}

function createBoostPickups(count: number, range: number): BoostPickupData[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    position: [
      (Math.random() - 0.5) * range * 1.55,
      ELEVATION_LEVELS[index % ELEVATION_LEVELS.length] + (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * range * 1.5,
    ],
    scale: 2 + Math.random() * 0.45,
    collected: false,
    collectionProgress: 0,
    respawnTimer: 0,
  }));
}

function createEnemyDroids(count: number, range: number): EnemyDroidData[] {
  const movementPatterns: EnemyDroidData["movement"][] = [
    "stationary",
    "vertical",
    "left_to_right",
    "right_to_left",
  ];
  const columns = Math.min(6, count);
  const depthSpacing = 132;
  const horizontalSpacing = 116;

  return Array.from({ length: count }, (_, index) => {
    const level = ELEVATION_LEVELS[index % ELEVATION_LEVELS.length];
    const column = index % columns;
    const row = Math.floor(index / columns);
    const basePosition: [number, number, number] = [
      THREE.MathUtils.clamp(
        (column - (columns - 1) / 2) * horizontalSpacing + (Math.random() - 0.5) * 22,
        -range,
        range,
      ),
      level + (Math.random() - 0.5) * 6,
      THREE.MathUtils.clamp(
        -110 - row * depthSpacing + (Math.random() - 0.5) * 30,
        -range,
        range,
      ),
    ];

    return {
      id: index,
      basePosition,
      position: [...basePosition],
      size: 4 + Math.random() * 2.5,
      movement: movementPatterns[index % movementPatterns.length],
      moveRange: 8 + Math.random() * 12,
      moveSpeed: 0.75 + Math.random() * 0.9,
      fireCooldown: 0.6 + Math.random() * 1.3,
      destroyed: false,
      destructionProgress: 0,
    };
  });
}

function createEnemyLasers(count: number): EnemyLaserData[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    position: [0, -200, 0],
    direction: [0, 0, -1],
    life: 0,
    active: false,
  }));
}

function getMusicVolumeLabel(volume: number) {
  if (Math.abs(volume - MUSIC_VOLUME_LEVELS[0]) < 0.001) {
    return "LOW";
  }

  if (Math.abs(volume - MUSIC_VOLUME_LEVELS[2]) < 0.001) {
    return "HIGH";
  }

  return "MED";
}
