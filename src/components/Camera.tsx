"use client";

import { useState, useRef, useEffect } from "react";

interface AnalyzeResponse {
  character?: {
    id: string;
    kind: "category" | "landmark" | "pairing";
    display_name: string;
    agent_id: string | null;
  };
  vision?: {
    primary?: { category: string; attributes: string[] };
    description?: string;
    landmark_slug?: string;
  };
  image_url?: string;
  greeting_text?: string;
  greeting_url?: string;
  ambient_url?: string | null;
  error?: string;
}

export function Camera() {
  const [busy, setBusy] = useState(false);
  const [response, setResponse] = useState<AnalyzeResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const ambientRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (response?.ambient_url && ambientRef.current) {
      ambientRef.current.volume = 0.25;
      ambientRef.current.loop = true;
      ambientRef.current.play().catch(() => {});
    }
  }, [response?.ambient_url]);

  async function handleFile(file: File) {
    setBusy(true);
    setResponse(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/photos/analyze", { method: "POST", body: fd });
      const data: AnalyzeResponse = await res.json();
      setResponse(data);
    } catch (err) {
      setResponse({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(false);
    }
  }

  const character = response?.character;
  const isPairing = character?.kind === "pairing";

  return (
    <div className="flex flex-col items-center gap-6 px-6 py-10">
      <div className="text-center max-w-md">
        <h2 className="text-3xl mb-2">Point your camera at anything.</h2>
        <p className="opacity-70">Overheard will listen and speak back.</p>
      </div>

      <button
        type="button"
        className="rounded-full bg-ember text-parchment px-8 py-4 text-lg shadow-md hover:opacity-90 disabled:opacity-40"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        {busy ? "Listening…" : "Take a photo"}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {response?.error && <p className="text-red-600">Error: {response.error}</p>}

      {response?.greeting_url && (
        <div className="w-full max-w-md flex flex-col items-center gap-4">
          {response.image_url && (
            <img
              src={response.image_url}
              alt=""
              className="rounded-lg max-h-64 object-cover"
            />
          )}
          {character && (
            <p className="text-sm uppercase tracking-widest opacity-60">
              {character.display_name}
              {isPairing && " · pair unlock"}
            </p>
          )}
          <p className="italic text-center opacity-80">
            &ldquo;{response.greeting_text}&rdquo;
          </p>
          <audio src={response.greeting_url} controls autoPlay className="w-full" />
          {response.ambient_url && (
            <audio ref={ambientRef} src={response.ambient_url} className="hidden" />
          )}
          {character?.agent_id && (
            <TalkBackButton characterId={character.id} />
          )}
        </div>
      )}
    </div>
  );
}

function TalkBackButton({ characterId }: { characterId: string }) {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");

  async function handleClick() {
    setStatus("connecting");
    try {
      const res = await fetch("/api/converse/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character_id: characterId }),
      });
      const data = (await res.json()) as { signed_url?: string; error?: string };
      if (!data.signed_url) throw new Error(data.error ?? "no signed_url");
      setStatus("connected");
      // Day 3: replace this alert with an inline WebSocket conversation using @elevenlabs/client.
      window.open(data.signed_url, "_blank");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  const label = {
    idle: "Talk back",
    connecting: "Connecting…",
    connected: "Opened",
    error: "Unavailable",
  }[status];

  return (
    <button
      type="button"
      className="rounded-full border border-ember text-ember px-6 py-2 text-sm hover:bg-ember hover:text-parchment disabled:opacity-40"
      onClick={handleClick}
      disabled={status === "connecting" || status === "connected"}
    >
      {label}
    </button>
  );
}
