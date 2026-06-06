import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { lazy, Suspense } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { PageSkeleton } from "./PageSkeleton";

// Page that resolves on demand; lets us observe the skeleton in flight.
let resolveReady: (() => void) | null = null;
const HeavyPage = lazy(
  () =>
    new Promise<{ default: () => React.JSX.Element }>((resolve) => {
      resolveReady = () => resolve({ default: () => <h1>Heavy</h1> });
    }),
);
const LightPage = () => <h1>Light</h1>;

function TestApp() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/" element={<LightPage />} />
        <Route path="/heavy" element={<HeavyPage />} />
      </Routes>
    </Suspense>
  );
}

describe("AppShell (Suspense + skeleton)", () => {
  it("shows the PageSkeleton while a lazy chunk is loading", async () => {
    render(
      <MemoryRouter initialEntries={["/heavy"]}>
        <TestApp />
      </MemoryRouter>,
    );
    // The chunk hasn't resolved → the skeleton must be in the DOM.
    expect(await screen.findByTestId("page-skeleton")).toBeInTheDocument();
    expect(screen.getByLabelText("Loading page")).toBeInTheDocument();

    // Resolve the chunk; the page swaps in and the skeleton disappears.
    resolveReady?.();
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Heavy" })).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("page-skeleton")).not.toBeInTheDocument();
  });

  it("does not show the skeleton for non-lazy routes", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <TestApp />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Light" })).toBeInTheDocument();
    expect(screen.queryByTestId("page-skeleton")).not.toBeInTheDocument();
  });
});
