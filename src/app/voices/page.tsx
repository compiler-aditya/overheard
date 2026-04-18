import Link from "next/link";
import { query, getDemoUserId } from "@/lib/db";
import { publicUrl } from "@/lib/r2";
import { loadAllSpecs } from "@/lib/specs/loader";

export const dynamic = "force-dynamic";

interface VoiceCard {
  id: string;
  name: string;
  quote: string;
  kind: "Category" | "Landmark" | "Pair unlock";
  when: string;
  cover: string;              // gradient fallback
  photo_url?: string;         // the user's original photo, when present
  pair?: boolean;
}

export default async function VoicesPage() {
  const cards = await fetchCards();
  const totals = {
    categories: cards.filter((c) => c.kind === "Category").length,
    landmarks: cards.filter((c) => c.kind === "Landmark").length,
    pairs: cards.filter((c) => c.kind === "Pair unlock").length,
  };

  return (
    <div className="min-h-screen">
      <nav className="px-8 py-6 flex items-center justify-between max-w-[1480px] mx-auto">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
          <span className="w-2 h-2 rounded-full bg-rust" />
          <span className="font-display italic text-2xl">Auris</span>
        </Link>
        <Link
          href="/"
          className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink3 hover:text-ink transition"
        >
          ← take a photo
        </Link>
      </nav>

      <main className="px-8 md:px-12 py-10 max-w-[1480px] mx-auto">
        <header className="flex justify-between items-end flex-wrap gap-4 mb-7">
          <div>
            <h1 className="font-display italic font-normal text-4xl md:text-5xl leading-none tracking-[-0.02em] m-0">
              Voices you&rsquo;ve met
            </h1>
            <div className="text-ink3 text-sm mt-1.5">
              {totals.categories} character{totals.categories === 1 ? "" : "s"} · {totals.landmarks}
              {" "}landmark{totals.landmarks === 1 ? "" : "s"} · {totals.pairs} rare pairing
              {totals.pairs === 1 ? "" : "s"}
            </div>
          </div>
        </header>

        {cards.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {cards.map((c) => (
              <Link
                key={c.id}
                href={`/character/${c.id}?profile=1`}
                className={
                  "bg-paper2 border rounded-[18px] overflow-hidden flex flex-col relative hover:shadow-md transition " +
                  (c.pair ? "border-rustsoft" : "border-line")
                }
              >
                <div
                  className="aspect-square relative overflow-hidden bg-cover bg-center"
                  style={{
                    background: c.photo_url
                      ? `url("${c.photo_url}") center/cover no-repeat, ${c.cover}`
                      : c.cover,
                  }}
                >
                  {c.pair && (
                    <div
                      className="absolute inset-0 z-[1]"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(196,74,43,0.35), transparent 60%)",
                      }}
                    />
                  )}
                  <div
                    className="absolute inset-0 z-[1]"
                    style={{
                      background:
                        "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.55) 100%)",
                    }}
                  />
                  <div
                    className={
                      "absolute top-3 left-3 px-2.5 py-1 rounded-full font-mono text-[9px] tracking-[0.18em] uppercase z-[2] " +
                      (c.pair
                        ? "bg-rust text-white"
                        : "bg-white/92 text-ink2 backdrop-blur-sm")
                    }
                  >
                    {c.pair ? `◇ ${c.kind}` : c.kind}
                  </div>
                  <div className="absolute bottom-3 left-3.5 right-3.5 text-white z-[2] font-display italic text-[26px] leading-none tracking-[-0.01em]">
                    {c.name}
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <div
                    className="font-display italic text-[15px] leading-[1.35] text-ink2 overflow-hidden"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    &ldquo;{c.quote}&rdquo;
                  </div>
                  <div className="flex justify-between items-center mt-auto font-mono text-[10px] tracking-[0.14em] uppercase text-ink3">
                    <span>{c.kind}</span>
                    <span>
                      <span className="text-ink4">· </span>
                      {c.when}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <footer className="mt-14 pt-5 border-t border-line flex justify-between font-mono text-[11px] tracking-[0.18em] uppercase text-ink3">
          <Link href="/" className="hover:text-ink transition">← home</Link>
          <span>
            {cards.length} voice{cards.length === 1 ? "" : "s"} · memory
          </span>
        </footer>
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-24 flex flex-col items-center gap-6 border border-dashed border-line rounded-[18px] bg-paper2/40">
      <div className="font-display italic text-2xl text-ink2">No voices yet.</div>
      <p className="max-w-[420px] text-center text-ink3 text-sm">
        Go take a photo. Whatever it is — a plant, a pigeon, a street sign — it&rsquo;ll show up here after you listen.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2.5 pl-3.5 pr-6 py-3.5 bg-ink text-paper rounded-full text-sm"
      >
        <span className="w-6 h-6 rounded-full bg-rust" />
        Take a photo
      </Link>
    </div>
  );
}

async function fetchCards(): Promise<VoiceCard[]> {
  const specs = await loadAllSpecs().catch(() => null);
  if (!specs) return [];

  try {
    const userId = await getDemoUserId();

    const objects = await query<{
      id: string;
      category: string;
      display_name: string | null;
      image_r2_key: string;
      created_at: string;
      last_seen_at: string;
    }>(
      `SELECT id, category, display_name, image_r2_key, created_at, last_seen_at
         FROM objects
        WHERE user_id = $1
        ORDER BY last_seen_at DESC
        LIMIT 24`,
      [userId],
    );

    const pairInstances = await query<{
      id: string;
      slug: string;
      photo_r2_key: string;
      unlocked_at: string;
    }>(
      `SELECT pi.id, ps.slug, pi.photo_r2_key, pi.unlocked_at
         FROM pair_instances pi
         JOIN pair_specs ps ON ps.id = pi.pair_spec_id
        WHERE pi.user_id = $1
        ORDER BY pi.unlocked_at DESC
        LIMIT 12`,
      [userId],
    );

    // Resolve all R2 keys → URLs in parallel so the grid renders the actual
    // photos the user took (not just gradients).
    const objectUrls = await Promise.all(
      objects.map((o) => publicUrl(o.image_r2_key).catch(() => undefined)),
    );
    const pairUrls = await Promise.all(
      pairInstances.map((p) => publicUrl(p.photo_r2_key).catch(() => undefined)),
    );

    const cards: VoiceCard[] = [];

    objects.forEach((o, i) => {
      const spec = specs.categories.get(o.category);
      cards.push({
        id: o.id,
        name: o.display_name ?? spec?.display_name ?? o.category,
        quote: spec?.greeting_templates[0] ?? "Hello.",
        kind: "Category",
        when: relTime(o.last_seen_at),
        cover: coverForCategory(o.category),
        photo_url: objectUrls[i],
      });
    });

    pairInstances.forEach((p, i) => {
      const spec = specs.pairings.get(p.slug);
      cards.push({
        id: p.id,
        name: spec?.display_name ?? p.slug,
        quote: spec?.greeting_templates[0] ?? "You found me.",
        kind: "Pair unlock",
        when: relTime(p.unlocked_at),
        cover: "radial-gradient(60% 50% at 30% 50%,#c44a2b 0%,#661f0f 50%,#0a0906 100%)",
        photo_url: pairUrls[i],
        pair: true,
      });
    });

    return cards;
  } catch (err) {
    console.warn("[voices] DB read failed, returning empty:", err);
    return [];
  }
}

function relTime(iso: string): string {
  try {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const sec = Math.max(0, Math.floor((now - then) / 1000));
    if (sec < 60) return "just now";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} min ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} hr ago`;
    const day = Math.floor(hr / 24);
    if (day === 1) return "yesterday";
    if (day < 7) return `${day} days ago`;
    return `${Math.floor(day / 7)} wk ago`;
  } catch {
    return "earlier";
  }
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
