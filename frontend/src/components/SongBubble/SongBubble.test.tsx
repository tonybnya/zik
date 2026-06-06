import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { BubbleField } from "./BubbleField";
import { SongBubble } from "./SongBubble";
import { computeOffset, seededUnit } from "./layout";
import type { Song } from "../../types/song";

const makeSong = (over: Partial<Song> = {}): Song => ({
  id: 1,
  title: "Rainy Window",
  artist: "Tape Deck",
  genre: "lofi",
  moods: ["calm", "focus"],
  bpm: 72,
  externalUrl: "#",
  coverUrl: null,
  ...over,
});

const songs = (n: number): Song[] =>
  Array.from({ length: n }, (_, i) =>
    makeSong({ id: i + 1, title: `Song ${i + 1}` }),
  );

describe("layout", () => {
  it("seededUnit is deterministic and in [0,1)", () => {
    const a = seededUnit("track:7");
    const b = seededUnit("track:7");
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(1);
  });

  it("computeOffset is stable for the same id/index", () => {
    expect(computeOffset(42, 0, 8)).toEqual(computeOffset(42, 0, 8));
  });

  it("different bubbles get different positions", () => {
    expect(computeOffset(1, 0, 8)).not.toEqual(computeOffset(2, 4, 8));
  });
});

describe("SongBubble", () => {
  it("renders title, artist, genre and first mood", () => {
    render(
      <SongBubble
        song={makeSong()}
        offset={{ dx: 10, dy: 10 }}
        onSelect={() => {}}
        reduced
      />,
    );
    expect(screen.getByText("Rainy Window")).toBeInTheDocument();
    expect(screen.getByText("Tape Deck")).toBeInTheDocument();
    expect(screen.getByText("lofi")).toBeInTheDocument();
    expect(screen.getByText("calm")).toBeInTheDocument();
  });

  it("calls onSelect with the song when clicked", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    const song = makeSong();
    render(
      <SongBubble
        song={song}
        offset={{ dx: 0, dy: 0 }}
        onSelect={onSelect}
        reduced
      />,
    );
    await user.click(screen.getByRole("button", { name: /play rainy window/i }));
    expect(onSelect).toHaveBeenCalledWith(song);
  });

  it("shows the AI pick badge only for AI songs", () => {
    const { rerender } = render(
      <SongBubble
        song={makeSong({ isAiPick: true })}
        offset={{ dx: 0, dy: 0 }}
        onSelect={() => {}}
        reduced
      />,
    );
    expect(screen.getByText(/ai pick/i)).toBeInTheDocument();

    rerender(
      <SongBubble
        song={makeSong({ isAiPick: false })}
        offset={{ dx: 0, dy: 0 }}
        onSelect={() => {}}
        reduced
      />,
    );
    expect(screen.queryByText(/ai pick/i)).not.toBeInTheDocument();
  });
});

describe("BubbleField", () => {
  it("renders one bubble per song", () => {
    render(<BubbleField songs={songs(5)} onSelect={() => {}} />);
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });

  it("caps visible bubbles at maxVisible (Task 7.7)", () => {
    render(<BubbleField songs={songs(20)} onSelect={() => {}} maxVisible={8} />);
    expect(screen.getAllByRole("button")).toHaveLength(8);
  });

  it("forwards selection from a bubble", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<BubbleField songs={songs(3)} onSelect={onSelect} />);
    await user.click(screen.getByRole("button", { name: /play song 2/i }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0].title).toBe("Song 2");
  });
});
