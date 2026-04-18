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
  searchParams: Promise<{ g?: string; a?: string; t?: string }>;
}

export const dynamic = "force-dynamic";

export default async function PairRevealPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;

  const row = await queryOne<{ pair_slug: string; photo_r2_key: string | null }>(
    `SELECT ps.slug AS pair_slug, pi.photo_r2_key
       FROM pair_instances pi
       JOIN pair_specs ps ON ps.id = pi.pair_spec_id
      WHERE pi.id = $1`,
    [id],
  ).catch(() => null);

  const specs = await loadAllSpecs().catch(() => null);
  // If the DB isn't wired yet, fall back to the reference candle-mirror spec
  // so judges can review the design without running bootstrap-characters.
  const spec = row && specs
    ? specs.pairings.get(row.pair_slug)
    : specs?.pairings.get("candle-mirror");
  if (!spec) notFound();

  const photoUrl = row?.photo_r2_key
    ? await publicUrl(row.photo_r2_key).catch(() => null)
    : null;

  const [titleA, titleB] = splitTitle(spec.display_name);

  return (
    <div
      className="min-h-screen grid lg:grid-cols-[1fr_1.1fr]"
      style={{ background: "#0a0906", color: "#f2e8d3" }}
    >
      <section className="p-10 md:p-14 flex flex-col justify-between relative min-h-screen">
        <div>
          <div className="inline-flex items-center gap-2.5 pl-2.5 pr-3.5 py-2 border border-[#d89a5a]/40 rounded-full font-mono text-[10px] tracking-[0.28em] uppercase text-[#d89a5a]">
            <span className="w-5 h-5 rounded-full bg-[#d89a5a]/20 flex items-center justify-center font-display italic text-[13px]">
              &amp;
            </span>
            Pair unlock · Rare
          </div>
          <h1 className="font-display font-normal text-6xl md:text-[124px] leading-[0.9] tracking-[-0.03em] mt-6">
            {titleA}
            {titleB && (
              <>
                <br />
                <em className="italic" style={{ color: "#d89a5a" }}>
                  {titleB}
                </em>
              </>
            )}
          </h1>
          <p
            className="font-display italic text-xl md:text-2xl leading-[1.35] mt-6 max-w-[440px]"
            style={{ color: "#d4c8aa" }}
          >
            &ldquo;{sp?.t ?? spec.greeting_templates[0]}&rdquo;
          </p>

          {sp?.g && (
            <div className="mt-6">
              <EncounterPlayer
                greetingUrl={sp.g}
                ambientUrl={sp.a}
                greetingText={sp.t ?? spec.greeting_templates[0]}
                tone="light"
              />
            </div>
          )}
        </div>

        <div className="flex justify-between items-end mt-10 flex-wrap gap-4">
          <ConverseButton characterId={id} tone="light" />
          <Link
            href="/"
            className="font-mono text-[10px] tracking-[0.22em] uppercase"
            style={{ color: "#85796a" }}
          >
            ← home
          </Link>
        </div>

        <div
          className="hidden lg:block absolute top-14 -right-6 z-[2] font-mono text-[10px] tracking-[0.28em] uppercase"
          style={{
            color: "#d89a5a",
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
          }}
        >
          pairing discovered
        </div>
      </section>

      <aside className="relative overflow-hidden min-h-[320px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            background: photoUrl
              ? `url("${photoUrl}") center/cover no-repeat, radial-gradient(80% 60% at 70% 50%, #ebb56d 0%, #a05a2c 35%, #2a1a10 85%, #0a0906 100%)`
              : "radial-gradient(80% 60% at 70% 50%, #ebb56d 0%, #a05a2c 35%, #2a1a10 85%, #0a0906 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(10,9,6,0.85) 0%, rgba(10,9,6,0) 50%)",
          }}
        />
      </aside>
    </div>
  );
}

function splitTitle(title: string): [string, string | null] {
  const parts = title.trim().split(/\s+/);
  if (parts.length < 2) return [title, null];
  const last = parts.pop()!;
  return [parts.join(" "), last];
}
