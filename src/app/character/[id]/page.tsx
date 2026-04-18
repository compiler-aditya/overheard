import "server-only";
import Link from "next/link";
import { notFound } from "next/navigation";
import { queryOne } from "@/lib/db";
import { publicUrl } from "@/lib/r2";
import { loadAllSpecs } from "@/lib/specs/loader";
import { ConverseButton } from "@/components/ConverseButton";
import { EncounterPlayer } from "@/components/EncounterPlayer";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ g?: string; a?: string; t?: string; profile?: string }>;
}

export const dynamic = "force-dynamic";

interface CharacterView {
  id: string;
  kind: "category" | "landmark";
  display_name: string;
  photo_url?: string;
  mood?: string;
  quotes: { when: string; q: string; now?: boolean }[];
  cover_style: string;
}

export default async function CharacterPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const view = await resolveView(id);
  if (!view) notFound();

  const freshGreeting = sp?.g;
  const freshAmbient = sp?.a;
  const freshText = sp?.t;
  // Fresh encounter (?g= present) → greeting moment
  // Explicit ?profile=1 → magazine spread for return visits
  const isFreshEncounter = Boolean(freshGreeting) && sp?.profile !== "1";

  return isFreshEncounter ? (
    <GreetingMoment
      view={view}
      greetingUrl={freshGreeting}
      ambientUrl={freshAmbient}
      greetingText={freshText ?? view.quotes[0]?.q}
    />
  ) : (
    <ProfileSpread view={view} />
  );
}

// ────────────────────────────────────────────────────────────────
// GREETING MOMENT — what you see immediately after a photo.
// Full-bleed, photo backdrop, character name, one spoken line,
// auto-playing audio, Talk back. No stats. No timeline.
// ────────────────────────────────────────────────────────────────
function GreetingMoment({
  view,
  greetingUrl,
  ambientUrl,
  greetingText,
}: {
  view: CharacterView;
  greetingUrl?: string;
  ambientUrl?: string;
  greetingText?: string;
}) {
  const bg = view.photo_url
    ? `url("${view.photo_url}") center/cover no-repeat, ${view.cover_style}`
    : view.cover_style;

  return (
    <div
      className="relative min-h-[100svh] overflow-hidden text-[#f5efe0]"
      style={{ background: bg }}
    >
      {/* scrim for legibility */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(14,13,11,0.25) 0%, rgba(14,13,11,0.65) 60%, rgba(14,13,11,0.92) 100%)",
        }}
      />

      {/* top bar */}
      <div className="relative px-6 md:px-10 pt-6 md:pt-8 flex justify-between items-center z-10">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition">
          <span className="w-2 h-2 rounded-full bg-rust" />
          <span className="font-display italic text-xl md:text-2xl">Auris</span>
        </Link>
        <div className="font-mono text-[10px] tracking-[0.22em] uppercase opacity-60">
          {view.kind === "landmark" ? "landmark" : "category"}
        </div>
      </div>

      {/* centered stage */}
      <main className="relative z-10 min-h-[calc(100svh-120px)] flex flex-col items-center justify-center px-6 md:px-12 text-center">
        <div className="font-mono text-[11px] tracking-[0.32em] uppercase opacity-70 mb-5">
          {view.kind === "landmark"
            ? "Landmark · speaks in first person"
            : "A voice met just now"}
        </div>
        <h1 className="font-display font-normal text-5xl sm:text-6xl md:text-[92px] leading-[0.95] tracking-[-0.03em] max-w-[900px]">
          {view.display_name}
        </h1>
        <blockquote className="font-display italic text-xl md:text-3xl leading-[1.35] mt-8 max-w-[720px] opacity-90">
          &ldquo;{greetingText ?? view.quotes[0]?.q ?? ""}&rdquo;
        </blockquote>

        <div className="mt-10 md:mt-14 flex flex-col items-center gap-4">
          <EncounterPlayer
            greetingUrl={greetingUrl}
            ambientUrl={ambientUrl}
            greetingText={greetingText ?? view.quotes[0]?.q}
            tone="light"
          />
          <ConverseButton characterId={view.id} tone="light" />
        </div>
      </main>

      <footer className="relative z-10 px-6 md:px-10 pb-6 flex justify-between items-center font-mono text-[10px] tracking-[0.22em] uppercase opacity-50">
        <Link href="/" className="hover:opacity-100">← home</Link>
        <Link
          href={`/character/${view.id}?profile=1`}
          className="hover:opacity-100 hidden sm:inline"
        >
          see profile →
        </Link>
      </footer>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// PROFILE SPREAD — magazine view for return visits (from /voices)
// ────────────────────────────────────────────────────────────────
function ProfileSpread({ view }: { view: CharacterView }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      <section
        className="relative overflow-hidden min-h-[360px]"
        style={{ background: view.cover_style }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(14,13,11,0) 40%, rgba(14,13,11,0.6) 100%)",
          }}
        />
        <div className="absolute top-6 left-6 right-6 flex justify-between font-mono text-[10px] tracking-[0.2em] uppercase text-[#f5efe0]/70 z-[2]">
          <Link href="/voices" className="hover:text-[#f5efe0]">← shelf</Link>
          <span>{view.kind === "landmark" ? "Landmark" : "Category"}</span>
        </div>
        <div className="absolute bottom-10 left-10 right-10 text-[#f5efe0] z-[2]">
          <div className="font-mono text-[11px] tracking-[0.28em] uppercase text-[#d89a5a] mb-3.5">
            {view.kind === "landmark" ? "Landmark" : "Category"}
          </div>
          <h1 className="font-display font-normal text-5xl md:text-[76px] leading-[0.9] tracking-[-0.025em]">
            {view.display_name}
          </h1>
        </div>
      </section>

      <section className="p-9 md:p-10 flex flex-col gap-6">
        <Link
          href="/voices"
          className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] uppercase text-ink3 hover:text-ink self-start"
        >
          ← back to shelf
        </Link>

        {view.mood && (
          <div className="py-4 border-t border-b border-line">
            <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink3">mood</div>
            <div className="font-display italic text-[22px] leading-tight text-ink mt-1">
              {view.mood}
            </div>
          </div>
        )}

        {view.quotes.length > 0 && (
          <div>
            <h3 className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink3 m-0 mb-2.5">
              What they said
            </h3>
            <div className="flex flex-col gap-3.5">
              {view.quotes.map((q, i) => (
                <div
                  key={i}
                  className="pl-4 border-l"
                  style={{ borderColor: q.now ? "var(--accent)" : "var(--line)" }}
                >
                  <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink3 mb-1">
                    {q.when}
                  </div>
                  <div className="font-display italic text-[17px] leading-[1.35] text-ink2">
                    &ldquo;{q.q}&rdquo;
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-4">
          <ConverseButton characterId={view.id} variant="flush" />
        </div>
      </section>
    </div>
  );
}

async function resolveView(id: string): Promise<CharacterView | null> {
  const specs = await loadAllSpecs().catch(() => null);

  const obj = await queryOne<{
    id: string;
    category: string;
    display_name: string | null;
    image_r2_key: string;
  }>(
    `SELECT id, category, display_name, image_r2_key FROM objects WHERE id = $1`,
    [id],
  ).catch(() => null);

  if (obj && specs) {
    const spec = specs.categories.get(obj.category);
    const photoUrl = await publicUrl(obj.image_r2_key).catch(() => undefined);
    return {
      id: obj.id,
      kind: "category",
      display_name: spec?.display_name ?? obj.display_name ?? obj.category,
      photo_url: photoUrl,
      mood: spec?.personality.emotional_baseline,
      cover_style: coverForCategory(obj.category),
      quotes: (spec?.greeting_templates ?? ["Hello."]).slice(0, 3).map((q, i) => ({
        when: i === 0 ? "today" : ["earlier", "last time"][i - 1] ?? "before",
        q,
        now: i === 0,
      })),
    };
  }

  const lm = await queryOne<{ id: string; slug: string; name: string }>(
    `SELECT id, slug, name FROM landmarks WHERE id = $1`,
    [id],
  ).catch(() => null);

  if (lm && specs) {
    const spec = specs.landmarks.get(lm.slug);
    return {
      id: lm.id,
      kind: "landmark",
      display_name: spec?.display_name ?? lm.name,
      mood: spec?.personality.emotional_baseline,
      cover_style: coverForLandmark(lm.slug),
      quotes: (spec?.greeting_templates ?? ["Hello."]).slice(0, 3).map((q, i) => ({
        when: i === 0 ? "today" : ["earlier", "last time"][i - 1] ?? "before",
        q,
        now: i === 0,
      })),
    };
  }

  return null;
}

function coverForCategory(cat: string): string {
  const m: Record<string, string> = {
    houseplant: "radial-gradient(70% 60% at 40% 40%, #86a674 0%, #2e4a2c 70%, #14201a 100%)",
    animal: "radial-gradient(70% 60% at 50% 40%, #b4b6b3 0%, #555a55 60%, #1d1f1c 100%)",
    food: "radial-gradient(70% 60% at 50% 50%, #e0c9a8 0%, #8a5d3a 60%, #3a1f10 100%)",
    appliance: "radial-gradient(70% 60% at 40% 40%, #bfc9d0 0%, #4b5359 60%, #1a1d20 100%)",
    furniture: "radial-gradient(70% 60% at 50% 50%, #e8dac4 0%, #9a8369 60%, #2f271e 100%)",
    vehicle: "radial-gradient(70% 60% at 50% 50%, #9aa7b3 0%, #3f4e5a 60%, #14191f 100%)",
    tool: "radial-gradient(70% 60% at 50% 50%, #b0a090 0%, #5a4a3a 60%, #1a1410 100%)",
    accessory: "radial-gradient(70% 60% at 50% 50%, #d7c9b3 0%, #8a6d52 60%, #2a1f14 100%)",
    building: "radial-gradient(70% 60% at 50% 50%, #cbb89a 0%, #705838 60%, #1f150a 100%)",
    landscape: "radial-gradient(70% 60% at 50% 50%, #a8c0a6 0%, #3e5b3d 60%, #0f1f14 100%)",
    "street-object": "radial-gradient(70% 60% at 50% 50%, #9aa0a5 0%, #464c52 60%, #14171a 100%)",
    artwork: "radial-gradient(70% 60% at 50% 50%, #d0a878 0%, #6e4a26 60%, #20140a 100%)",
  };
  return m[cat] ?? "radial-gradient(70% 60% at 40% 40%, #86a674 0%, #2e4a2c 70%, #14201a 100%)";
}

function coverForLandmark(slug: string): string {
  const m: Record<string, string> = {
    "rajwada-indore": "linear-gradient(160deg, #f1c486 0%, #c46d2f 45%, #4a1f0c 100%)",
    "taj-mahal": "radial-gradient(60% 50% at 50% 30%, #ffd97a 0%, #8a521e 55%, #251308 100%)",
    "banyan-tree": "radial-gradient(70% 60% at 50% 50%, #6b8a5f 0%, #2e3f2a 60%, #14201a 100%)",
    "gateway-of-india": "radial-gradient(70% 60% at 50% 50%, #c8a878 0%, #5a4028 60%, #180e08 100%)",
    "red-fort": "radial-gradient(70% 60% at 50% 50%, #b55838 0%, #6a2818 60%, #1a0808 100%)",
    "chai-stall": "radial-gradient(70% 60% at 50% 50%, #c89668 0%, #5a3818 60%, #1a0e08 100%)",
    "arabian-sea": "radial-gradient(70% 60% at 50% 50%, #7a98b4 0%, #2a4358 60%, #08141f 100%)",
    "indian-railway-station":
      "radial-gradient(70% 60% at 50% 50%, #a89878 0%, #4a3828 60%, #18100a 100%)",
  };
  return m[slug] ?? "linear-gradient(160deg, #f1c486 0%, #c46d2f 45%, #4a1f0c 100%)";
}
