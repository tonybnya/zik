import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CassettePlayer } from "./CassettePlayer";
import type { CassetteSong } from "./types";

const SONG: CassetteSong = { title: "Rainy Window", artist: "Tape Deck" };

describe("CassettePlayer", () => {
  it("shows the insert prompt and 'Press play' status with no song", () => {
    render(<CassettePlayer isPlaying={false} onPlayToggle={() => {}} />);
    expect(screen.getByText(/insert a track/i)).toBeInTheDocument();
    expect(screen.getByText(/press play to start/i)).toBeInTheDocument();
  });

  it("renders the song title and artist on the label", () => {
    render(
      <CassettePlayer isPlaying={false} onPlayToggle={() => {}} song={SONG} />,
    );
    expect(screen.getByText("Rainy Window")).toBeInTheDocument();
    expect(screen.getByText("Tape Deck")).toBeInTheDocument();
  });

  it("calls onPlayToggle when the play button is clicked", async () => {
    const onPlayToggle = vi.fn();
    const user = userEvent.setup();
    render(<CassettePlayer isPlaying={false} onPlayToggle={onPlayToggle} />);
    await user.click(screen.getByRole("button", { name: /play/i }));
    expect(onPlayToggle).toHaveBeenCalledOnce();
  });

  it("exposes Pause affordance and 'Now playing' status while playing", () => {
    render(
      <CassettePlayer isPlaying onPlayToggle={() => {}} song={SONG} />,
    );
    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
    expect(screen.getByText(/now playing/i)).toBeInTheDocument();
  });

  it("shows a loading control and disables it while loading", () => {
    render(
      <CassettePlayer
        isPlaying={false}
        onPlayToggle={() => {}}
        isLoading
        song={SONG}
      />,
    );
    const btn = screen.getByRole("button", { name: /loading track/i });
    expect(btn).toBeDisabled();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("does not fire onPlayToggle when loading (button disabled)", async () => {
    const onPlayToggle = vi.fn();
    const user = userEvent.setup();
    render(
      <CassettePlayer isPlaying={false} onPlayToggle={onPlayToggle} isLoading />,
    );
    await user.click(screen.getByRole("button", { name: /loading track/i }));
    expect(onPlayToggle).not.toHaveBeenCalled();
  });
});
