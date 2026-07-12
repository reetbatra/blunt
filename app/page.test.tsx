import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("Home landing page", () => {
  it("keeps the waitlist CTA while linking to the app", () => {
    render(<Home />);

    expect(
      screen.getAllByRole("button", { name: "Get early access" }),
    ).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Try the app" })).toHaveAttribute(
      "href",
      "/coach",
    );
  });
});
