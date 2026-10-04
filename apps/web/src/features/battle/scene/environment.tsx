import { useLayoutEffect, useMemo, useRef } from "react";
import type { InstancedMesh } from "three";
import { BackSide, Color, Object3D } from "three";

import { finishInstances } from "@/features/battle/scene/instancing";
import { skyTexture } from "@/features/battle/scene/textures";

/** A small seeded random, so the scenery is the same each time. */
const scatter = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
};

interface Placement {
  readonly x: number;
  readonly z: number;
  readonly scale: number;
  readonly tint: number;
}

const TREE_COLORS = ["#4f8f3a", "#5f9e3f", "#3f7c35", "#6aa84a"];

/** A forest line behind the Board and a few trees at the sides, never in front of a Square. */
const treePlacements = (): Placement[] => {
  const random = scatter(7);
  const result: Placement[] = [];
  while (result.length < 64) {
    const x = (random() - 0.5) * 40;
    const z = -5.4 - random() * 14;
    result.push({
      x,
      z,
      scale: 0.75 + random() * 0.8 + Math.max(0, -z - 8) * 0.06,
      tint: Math.floor(random() * TREE_COLORS.length),
    });
  }
  for (const side of [-1, 1]) {
    for (let index = 0; index < 6; index += 1) {
      result.push({
        x: side * (10.2 + random() * 6),
        z: -3 + random() * 7,
        scale: 0.6 + random() * 0.5,
        tint: index % 4,
      });
    }
  }
  return result;
};

/** Rocks and bushes in the foreground, between the Board and the Hand. */
const propPlacements = (count: number, seed: number): Placement[] => {
  const random = scatter(seed);
  return Array.from({ length: count }, () => ({
    x: (random() - 0.5) * 26,
    z: 2.7 + random() * 2.2,
    scale: 0.07 + random() * 0.14,
    tint: Math.floor(random() * TREE_COLORS.length),
  }));
};

const layoutRocks = (
  mesh: InstancedMesh | null,
  places: readonly Placement[]
) => {
  if (!mesh) {
    return;
  }
  const dummy = new Object3D();
  for (const [index, rock] of places.entries()) {
    dummy.position.set(rock.x, rock.scale * 0.3 - 0.6, rock.z);
    dummy.scale.set(rock.scale * 1.4, rock.scale, rock.scale * 1.2);
    dummy.rotation.set(rock.x, rock.z, 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  }
};

const layoutBushes = (
  mesh: InstancedMesh | null,
  places: readonly Placement[]
) => {
  if (!mesh) {
    return;
  }
  const dummy = new Object3D();
  const color = new Color();
  for (const [index, bush] of places.entries()) {
    dummy.position.set(bush.x, bush.scale * 0.5 - 0.6, bush.z);
    dummy.scale.set(bush.scale * 1.5, bush.scale * 1.1, bush.scale * 1.3);
    dummy.rotation.set(0, bush.x, 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
    mesh.setColorAt(index, color.set(TREE_COLORS[bush.tint] ?? "#4f8f3a"));
  }
};

/** A tree trunk or crown: the crown sits on top of the trunk. */
const treeMatrix = (dummy: Object3D, tree: Placement, height: number) => {
  dummy.position.set(tree.x, height * tree.scale, tree.z);
  dummy.scale.setScalar(tree.scale);
  dummy.rotation.set(0, tree.x, 0);
  dummy.updateMatrix();
  return dummy.matrix;
};

const layoutTrunks = (
  mesh: InstancedMesh | null,
  places: readonly Placement[]
) => {
  if (!mesh) {
    return;
  }
  const dummy = new Object3D();
  for (const [index, tree] of places.entries()) {
    mesh.setMatrixAt(index, treeMatrix(dummy, tree, 0.5));
  }
};

const layoutCrowns = (
  mesh: InstancedMesh | null,
  places: readonly Placement[]
) => {
  if (!mesh) {
    return;
  }
  const dummy = new Object3D();
  const color = new Color();
  for (const [index, tree] of places.entries()) {
    mesh.setMatrixAt(index, treeMatrix(dummy, tree, 1.55));
    mesh.setColorAt(index, color.set(TREE_COLORS[tree.tint] ?? "#4f8f3a"));
  }
};

const Props = () => {
  const rocks = useRef<InstancedMesh>(null);
  const bushes = useRef<InstancedMesh>(null);
  const rockPlaces = useMemo(() => propPlacements(14, 11), []);
  const bushPlaces = useMemo(() => propPlacements(22, 19), []);
  useLayoutEffect(() => {
    layoutRocks(rocks.current, rockPlaces);
    layoutBushes(bushes.current, bushPlaces);
    finishInstances([rocks.current, bushes.current]);
  }, [rockPlaces, bushPlaces]);
  return (
    <>
      <instancedMesh
        ref={rocks}
        args={[undefined, undefined, rockPlaces.length]}
        frustumCulled={false}
      >
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#a39a8c" roughness={0.95} flatShading />
      </instancedMesh>
      <instancedMesh
        ref={bushes}
        args={[undefined, undefined, bushPlaces.length]}
        frustumCulled={false}
      >
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={0.9} flatShading />
      </instancedMesh>
    </>
  );
};

const InstancedTrees = () => {
  const trunks = useRef<InstancedMesh>(null);
  const crowns = useRef<InstancedMesh>(null);
  const placements = useMemo(() => treePlacements(), []);

  useLayoutEffect(() => {
    layoutTrunks(trunks.current, placements);
    layoutCrowns(crowns.current, placements);
    finishInstances([trunks.current, crowns.current]);
  }, [placements]);

  return (
    <>
      <instancedMesh
        ref={trunks}
        args={[undefined, undefined, placements.length]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.12, 0.18, 1, 6]} />
        <meshStandardMaterial color="#7a5232" roughness={0.9} flatShading />
      </instancedMesh>
      <instancedMesh
        ref={crowns}
        args={[undefined, undefined, placements.length]}
        frustumCulled={false}
      >
        <icosahedronGeometry args={[0.85, 0]} />
        <meshStandardMaterial roughness={0.85} flatShading />
      </instancedMesh>
    </>
  );
};

/** Distant hills: one instanced mesh behind the Board (art direction 2: panorama with depth). */
const Hills = () => {
  const hills = useRef<InstancedMesh>(null);
  const placements = useMemo(() => {
    const random = scatter(3);
    return Array.from({ length: 9 }, (_, index) => ({
      x: -40 + index * 10 + random() * 4,
      z: -34 - random() * 8,
      scale: 6 + random() * 5,
    }));
  }, []);
  useLayoutEffect(() => {
    const dummy = new Object3D();
    for (const [index, hill] of placements.entries()) {
      dummy.position.set(hill.x, -1, hill.z);
      dummy.scale.set(hill.scale * 1.6, hill.scale * 0.55, hill.scale);
      dummy.updateMatrix();
      hills.current?.setMatrixAt(index, dummy.matrix);
    }
    if (hills.current) {
      hills.current.instanceMatrix.needsUpdate = true;
      hills.current.computeBoundingSphere();
    }
  }, [placements]);
  return (
    <instancedMesh
      ref={hills}
      args={[undefined, undefined, placements.length]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 12, 8]} />
      <meshStandardMaterial color="#7fa86a" roughness={1} flatShading />
    </instancedMesh>
  );
};

/** Sky, ground, scenery and the light from the upper left (art direction 5.4). */
export const Environment = () => {
  const sky = useMemo(() => skyTexture(), []);
  return (
    <>
      <color attach="background" args={["#a9cdee"]} />
      <fog attach="fog" args={["#cfe0ea", 24, 60]} />
      <hemisphereLight args={["#fff3dc", "#55703f", 1.35]} />
      <directionalLight
        position={[-7, 12, 6]}
        intensity={2.1}
        color="#fff1d6"
      />
      <directionalLight
        position={[8, 5, -6]}
        intensity={0.45}
        color="#b9d4ff"
      />
      <mesh scale={[90, 90, 90]} position={[0, -6, 0]}>
        <sphereGeometry args={[1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial
          map={sky}
          side={BackSide}
          fog={false}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.62, -10]}>
        <planeGeometry args={[140, 80]} />
        <meshStandardMaterial color="#7db45f" roughness={1} />
      </mesh>
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, -0.6, 0]}
        scale={[1.25, 0.55, 1]}
      >
        <circleGeometry args={[11, 40]} />
        <meshStandardMaterial color="#b49a6c" roughness={1} />
      </mesh>
      <Hills />
      <InstancedTrees />
      <Props />
    </>
  );
};
