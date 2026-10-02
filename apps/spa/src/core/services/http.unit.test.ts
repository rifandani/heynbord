import { MOCK_API_BASE_URL } from "@test/msw";
import { describe, expect, it } from "vitest";

import { Http } from "@/core/services/http-client";

describe("Http", () => {
  it("creates a ky instance from config", () => {
    const instance = new Http({ prefix: MOCK_API_BASE_URL });
    expect(instance.instance).toBeDefined();
    expect(instance.instance.get).toBeTypeOf("function");
  });
});
