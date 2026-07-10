"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

/** Exam audio player: play/replay only (no scrubbing), max 2 plays like APTIS. */
export function AudioPlayer({
  src,
  plays,
  maxPlays = 2,
  onPlay,
}: {
  src: string;
  plays: number;
  maxPlays?: number;
  onPlay: () => void;
}) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const exhausted = plays >= maxPlays;

  function start() {
    if (exhausted || playing || !ref.current) return;
    onPlay();
    ref.current.currentTime = 0;
    ref.current.play();
    setPlaying(true);
  }

  return (
    <div className="flex items-center gap-3 rounded-card border border-line bg-cream-50 px-4 py-3">
      <audio ref={ref} src={src} preload="auto" onEnded={() => setPlaying(false)} />
      <Button
        type="button"
        variant={exhausted && !playing ? "secondary" : "primary"}
        onClick={start}
        disabled={exhausted || playing}
      >
        {playing ? "Playing…" : plays === 0 ? "▶ Play audio" : "▶ Play again"}
      </Button>
      <span className="figures text-[13px] text-ink-muted">
        {Math.max(0, maxPlays - plays)} play{maxPlays - plays === 1 ? "" : "s"} left
      </span>
    </div>
  );
}
