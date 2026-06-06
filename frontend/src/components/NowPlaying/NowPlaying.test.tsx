import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { NowPlaying } from "./NowPlaying";
import type { Song } from "../../types/song";

const SONG: Song = {
  id: 1,
  title: "Rainy Window",
  artist: "Tape Deck",
  genre: "lofi",
  moods: ["calm"],
  bpm: 72,
  externalUrl: "https://example.com/song",
  coverUrl: null,
};

describe("NowPlaying", () => {
  it("renders nothing when there is no song", () => {
    const { container } = render(
      <NowPlaying song={null} isFavorite={false} onToggleFavorite={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the track and an external listen link", () => {
    render(
      <NowPlaying song={SONG} isFavorite={false} onToggleFavorite={() => {}} />,
    );
    expect(screen.getByText("Rainy Window")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /listen/i });
    expect(link).toHaveAttribute("href", "https://example.com/song");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("reflects favorite state and forwards toggles", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <NowPlaying song={SONG} isFavorite={false} onToggleFavorite={onToggle} />,
    );
    const btn = screen.getByRole("button", { name: /add favorite/i });
    expect(btn).toHaveAttribute("aria-pressed", "false");
    await user.click(btn);
    expect(onToggle).toHaveBeenCalledWith(SONG);

    rerender(
      <NowPlaying song={SONG} isFavorite onToggleFavorite={onToggle} />,
    );
    expect(
      screen.getByRole("button", { name: /remove favorite/i }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
