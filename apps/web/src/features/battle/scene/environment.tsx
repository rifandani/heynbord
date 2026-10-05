/**
 * The light of the Battle scene. The ground and the scenery are the Battle
 * Painting behind the canvas (web ADR-0007), so the scene has only lights. They
 * match the painting: warm light from the upper left (art direction 5.4).
 */
export const Environment = () => (
  <>
    <hemisphereLight args={["#fff3dc", "#55703f", 1.35]} />
    <directionalLight position={[-7, 12, 6]} intensity={2.1} color="#fff1d6" />
    <directionalLight position={[8, 5, -6]} intensity={0.45} color="#b9d4ff" />
  </>
);
