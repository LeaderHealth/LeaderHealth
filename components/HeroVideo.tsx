"use client";

import { useEffect, useRef } from "react";

export function HeroVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    const play = () => {
      void video.play().catch(() => {});
    };
    play();
    video.addEventListener("canplay", play);
    video.addEventListener("loadeddata", play);
    const onVisible = () => {
      if (!document.hidden) play();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      video.removeEventListener("canplay", play);
      video.removeEventListener("loadeddata", play);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [src]);

  return (
    <video
      ref={ref}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      className="absolute inset-0 h-full w-full object-cover"
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
