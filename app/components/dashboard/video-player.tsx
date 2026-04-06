"use client"

import React from "react"

import { useState, useRef, useCallback } from "react"
import { Play, Pause, Maximize, Volume2, VolumeX } from "lucide-react"

interface VideoPlayerProps {
  /** Video source URL (mp4 or similar) */
  src?: string
  /** Poster / thumbnail image URL */
  poster?: string
  /** Title shown as overlay */
  title: string
}

/**
 * Custom themed HTML5 video player.
 * Uses the DIB Academy rose/plum color scheme for controls.
 */
export function VideoPlayer({
  src,
  poster,
  title,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.play()
      setIsPlaying(true)
    } else {
      v.pause()
      setIsPlaying(false)
    }
  }, [])

  const toggleMute = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setIsMuted(v.muted)
  }, [])

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current
    if (!v || !v.duration) return
    setProgress((v.currentTime / v.duration) * 100)
  }, [])

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current
    if (!v || !v.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    v.currentTime = ratio * v.duration
  }, [])

  const handleFullscreen = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.requestFullscreen) v.requestFullscreen()
  }, [])

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-foreground">
      {/* Video element */}
      <video
        ref={videoRef}
        className="aspect-video w-full bg-foreground"
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        preload="metadata"
        playsInline
      >
        {src && <source src={src} type="video/mp4" />}
      </video>

      {/* Placeholder overlay when no source */}
      {!src && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-secondary/95">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
            <Play className="h-7 w-7 text-primary" />
          </div>
          <p className="text-sm font-medium text-secondary-foreground">{title}</p>
          <p className="text-xs text-secondary-foreground/60">
            Видео будет доступно после подключения
          </p>
        </div>
      )}

      {/* Custom controls overlay */}
      {src && (
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-foreground/80 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
          {/* Progress bar */}
          <div
            className="h-1.5 w-full cursor-pointer rounded-full bg-secondary-foreground/20"
            onClick={handleSeek}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-8 w-8 items-center justify-center rounded text-secondary-foreground transition-colors hover:text-primary"
              aria-label={isPlaying ? "Пауза" : "Воспроизвести"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="flex h-8 w-8 items-center justify-center rounded text-secondary-foreground transition-colors hover:text-primary"
              aria-label={isMuted ? "Включить звук" : "Выключить звук"}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleFullscreen}
              className="flex h-8 w-8 items-center justify-center rounded text-secondary-foreground transition-colors hover:text-primary"
              aria-label="Полный экран"
            >
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Click to play/pause */}
      {src && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 z-10 cursor-pointer bg-transparent"
          aria-label={isPlaying ? "Пауза" : "Воспроизвести"}
        />
      )}
    </div>
  )
}
