import { useAtomValue } from "@effect/atom-react";
import { PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { Target } from "@workspace/rules";
import { useState } from "react";

import { battleSessionAtom } from "@/features/battle/battle.atoms";
import { Board } from "@/features/battle/scene/board";
import { CameraRig } from "@/features/battle/scene/camera-rig";
import { CastMarks } from "@/features/battle/scene/cast-marks";
import { Diagnostics } from "@/features/battle/scene/diagnostics";
import { EffectsLayer } from "@/features/battle/scene/effects-layer";
import { Environment } from "@/features/battle/scene/environment";
import { Heroes } from "@/features/battle/scene/heroes";
import { PlaybackDriver } from "@/features/battle/scene/playback-driver";
import { TargetMarkers } from "@/features/battle/scene/target-markers";
import { TutorialMarks } from "@/features/battle/scene/tutorial-marks";
import { UnitInspector } from "@/features/battle/scene/unit-inspector";
import { Units } from "@/features/battle/scene/units";

const NO_LANES: readonly number[] = [];

/** The device pixel ratio limit (technical design 6: maximum 2). */
const MAX_DPR = 2;

/**
 * The 3D Battle scene. It loads in its own chunk, so Three.js is not in the
 * first bundle (NFR-02, technical design 4.2). It only shows the view: it
 * never calculates a rule.
 */
const BattleCanvas = ({
  onPick,
}: {
  readonly onPick: (target: Target) => void;
}) => {
  const session = useAtomValue(battleSessionAtom);
  const lanes = session?.view.lanes ?? 1;
  const closedLanes = session?.view.closedLanes ?? NO_LANES;
  const [dpr, setDpr] = useState(() =>
    Math.min(MAX_DPR, window.devicePixelRatio || 1)
  );
  return (
    // No browser gestures, text selection or callout on the Board: a long
    // press inspects a Unit (UI-05).
    <div
      data-battle-canvas
      className="absolute inset-0 touch-none select-none [-webkit-touch-callout:none]"
    >
      <Canvas
        dpr={dpr}
        // Transparent: the Battle Painting shows behind the scene (web ADR-0007).
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
          stencil: false,
        }}
        camera={{ fov: 30, near: 0.5, far: 160, position: [0, 12, 16] }}
        aria-label="Battle Board"
      >
        <PerformanceMonitor
          onDecline={() => setDpr(1)}
          onIncline={() =>
            setDpr(Math.min(MAX_DPR, window.devicePixelRatio || 1))
          }
        />
        <PlaybackDriver />
        <CameraRig lanes={lanes} />
        <Environment />
        <Board lanes={lanes} closedLanes={closedLanes} />
        <Heroes />
        <Units />
        <CastMarks />
        <EffectsLayer />
        <TutorialMarks />
        <TargetMarkers onPick={onPick} />
        <UnitInspector />
        <Diagnostics />
      </Canvas>
    </div>
  );
};

export default BattleCanvas;
