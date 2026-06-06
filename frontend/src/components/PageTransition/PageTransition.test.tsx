import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

import { PageTransition } from "./PageTransition";

function LocationDisplay() {
  const loc = useLocation();
  return <span data-testid="location">{loc.pathname}</span>;
}

const PageA = () => (
  <PageTransition>
    <h1>Page A</h1>
  </PageTransition>
);
const PageB = () => (
  <PageTransition>
    <h1>Page B</h1>
  </PageTransition>
);

describe("PageTransition", () => {
  it("renders children inside a wrapping div", () => {
    render(
      <MemoryRouter>
        <PageTransition>
          <h1>hi</h1>
        </PageTransition>
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "hi" })).toBeInTheDocument();
    // The parent is a div (motion.div renders an actual div).
    const heading = screen.getByRole("heading", { name: "hi" });
    expect(heading.parentElement?.tagName).toBe("DIV");
  });

  it("renders arbitrary children unchanged", () => {
    render(
      <MemoryRouter>
        <PageTransition>
          <p>payload</p>
        </PageTransition>
      </MemoryRouter>,
    );
    expect(screen.getByText("payload")).toBeInTheDocument();
  });

  it("works with route transitions: navigating swaps page content", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/a"]}>
        <nav>
          <Link to="/a">A</Link>
          <Link to="/b">B</Link>
        </nav>
        <Routes>
          <Route path="/a" element={<PageA />} />
          <Route path="/b" element={<PageB />} />
        </Routes>
        <LocationDisplay />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Page A" })).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/a");

    await user.click(screen.getByRole("link", { name: "B" }));
    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/b"),
    );
    expect(screen.getByRole("heading", { name: "Page B" })).toBeInTheDocument();
  });
});
