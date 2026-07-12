import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/prompt/route";

describe("POST /api/prompt", () => {
  it("returns a prompt for a valid category", async () => {
    const request = new Request("http://localhost/api/prompt", {
      method: "POST",
      body: JSON.stringify({ category: "hot-take", seed: 1 }),
    });

    const response = await POST(request);
    const json = (await response.json()) as { prompt?: { category: string } };

    expect(response.status).toBe(200);
    expect(json.prompt?.category).toBe("hot-take");
  });

  it("rejects garbage categories", async () => {
    const request = new Request("http://localhost/api/prompt", {
      method: "POST",
      body: JSON.stringify({ category: "garbage" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
