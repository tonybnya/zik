import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PreferencesPanel } from "./PreferencesPanel";

const BASE = { preferredGenres: ["lofi"], preferredMoods: ["calm"] };

beforeEach(() => {
  // jsdom doesn't implement scrollTo on the dialog; suppress the noise.
  // The component never calls it, but window-level focus moves can.
  Element.prototype.scrollTo = vi.fn();
});

describe("PreferencesPanel", () => {
  it("renders genres and moods as toggleable chips, reflecting initial state", () => {
    render(
      <PreferencesPanel
        initial={BASE}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog", { name: /tune your taste/i })).toBeInTheDocument();
    // lofi + calm are checked initially.
    const lofi = screen.getByRole("checkbox", { name: "lofi" });
    const calm = screen.getByRole("checkbox", { name: "calm" });
    expect(lofi.getAttribute("aria-checked")).toBe("true");
    expect(calm.getAttribute("aria-checked")).toBe("true");
    // jazz is unchecked.
    expect(screen.getByRole("checkbox", { name: "jazz" }).getAttribute("aria-checked")).toBe(
      "false",
    );
  });

  it("toggles a chip on click", async () => {
    const user = userEvent.setup();
    render(
      <PreferencesPanel
        initial={BASE}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const jazz = screen.getByRole("checkbox", { name: "jazz" });
    expect(jazz.getAttribute("aria-checked")).toBe("false");
    await user.click(jazz);
    expect(jazz.getAttribute("aria-checked")).toBe("true");
  });

  it("calls onSave with sorted selections when Save is clicked", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <PreferencesPanel
        initial={BASE}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );

    // Toggle jazz on, focus off.
    await user.click(screen.getByRole("checkbox", { name: "jazz" }));
    await user.click(screen.getByRole("checkbox", { name: "focus" }));
    await user.click(screen.getByRole("checkbox", { name: "lofi" })); // toggles off

    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(onSave).toHaveBeenCalledWith({
      preferredGenres: ["jazz"], // lofi removed, jazz added
      preferredMoods: ["calm", "focus"], // sorted
    });
  });

  it("closes on ESC", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <PreferencesPanel
        initial={BASE}
        onSave={vi.fn()}
        onClose={onClose}
      />,
    );
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes on backdrop click", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <PreferencesPanel
        initial={BASE}
        onSave={vi.fn()}
        onClose={onClose}
      />,
    );
    await user.click(screen.getByTestId("prefs-backdrop"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not close when the panel body itself is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <PreferencesPanel
        initial={BASE}
        onSave={vi.fn()}
        onClose={onClose}
      />,
    );
    await user.click(screen.getByRole("dialog"));
    expect(onClose).not.toHaveBeenCalled();
  });
});
