import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BluntApp } from "@/components/blunt-app";

describe("BluntApp", () => {
  it("blocks the re-record button until a scored first take exists", () => {
    render(<BluntApp />);

    expect(
      screen.getByRole("button", { name: "Record again" }),
    ).toBeDisabled();
    expect(screen.getByText("No take yet")).toBeInTheDocument();
  });
});
