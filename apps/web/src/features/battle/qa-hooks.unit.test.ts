import { AtomRegistry } from "effect/reactivity";
import { beforeEach, describe, expect, it, vi } from "vitest";

const qa = vi.hoisted(() => ({ enabled: false }));
const installTestHooks = vi.hoisted(() => vi.fn());

vi.mock("@/features/battle/qa", () => ({
  qaEnabled: () => qa.enabled,
}));

vi.mock("@/features/battle/test-hooks", () => ({
  installTestHooks,
}));

const loadQaHooks = () => import("@/features/battle/qa-hooks");

const registry = AtomRegistry.make();

describe("installQaHooks", () => {
  beforeEach(() => {
    vi.resetModules();
    qa.enabled = false;
    installTestHooks.mockReset();
  });

  it("loads no QA code outside a QA build", async () => {
    const { installQaHooks } = await loadQaHooks();
    await expect(installQaHooks(registry, "?qa")).resolves.toBeUndefined();
    expect(installTestHooks).not.toHaveBeenCalled();
  });

  it("installs the QA hooks in a QA build", async () => {
    qa.enabled = true;
    installTestHooks.mockReturnValue(() => {});
    const { installQaHooks } = await loadQaHooks();
    const cleanup = await installQaHooks(registry, "?state=town");
    expect(installTestHooks).toHaveBeenCalledWith(registry, "?state=town");
    expect(cleanup).toBeTypeOf("function");
  });
});
