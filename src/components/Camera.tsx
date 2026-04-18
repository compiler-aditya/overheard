"use client";

import { useState, useRef } from "react";

interface AnalyzeResponse {
  vision?: {
    primary?: { category: string; attributes: string[] };
    description?: string;
    landmark_slug?: string;
  };
  image_url?: string;
  greeting_text?: string;
  greeting_url?: string;
  error?: string;
}

export function Camera() {
  const [busy, setBusy] = useState(false);
  const [response, setResponse] = useState<AnalyzeResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="flex flex-col items-center gap-6 px-6 py-10">
      <div className="text-center max-w-md">
        <h2 className="text-3xl mb-2">Point your camera at anything.</h2>
        <p className="opacity-70">
          Overheard will listen and speak back in whatever voice fits.
        </p>
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

      {response?.error && (
        <p className="text-red-600">Error: {response.error}</p>
      )}

      {response?.greeting_url && (
        <div className="w-full max-w-md flex flex-col items-center gap-4">
          {response.image_url && (
            <img
              src={response.image_url}
              alt=""
              className="rounded-lg max-h-64 object-cover"
            />
          )}
          <p className="italic text-center opacity-80">
            &ldquo;{response.greeting_text}&rdquo;
          </p>
          <audio src={response.greeting_url} controls autoPlay className="w-full" />
          {response.vision?.primary && (
            <p className="text-xs opacity-60">
              identified as{" "}
              <strong>{response.vision.primary.category}</strong>
              {response.vision.landmark_slug
                ? ` · landmark: ${response.vision.landmark_slug}`
                : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
