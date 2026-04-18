import "server-only";
import { notFound } from "next/navigation";
import { queryOne } from "@/lib/db";
import { publicUrl } from "@/lib/r2";
import { loadAllSpecs } from "@/lib/specs/loader";
import { ConverseButton } from "@/components/ConverseButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function PairRevealPage({ params }: PageProps) {
  const { id } = await params;
  const row = await queryOne<{
    pair_spec_id: string;
    photo_r2_key: string;
    pair_slug: string;
    voice_id: string;
    agent_id: string;
  }>(
    `
    SELECT pi.pair_spec_id, pi.photo_r2_key, ps.slug AS pair_slug, ps.voice_id, ps.agent_id
    FROM pair_instances pi
    JOIN pair_specs ps ON ps.id = pi.pair_spec_id
    WHERE pi.id = $1
    `,
    [id],
  );
  if (!row) notFound();

  const specs = await loadAllSpecs();
  const spec = specs.pairings.get(row.pair_slug);
  if (!spec) notFound();

  const photoUrl = await publicUrl(row.photo_r2_key);

  return (
    <div className="min-h-screen bg-ink text-parchment flex flex-col items-center justify-center gap-8 px-6 py-16">
      <p className="uppercase tracking-[0.3em] text-xs opacity-60">Pair unlock</p>
      <h1 className="text-4xl md:text-5xl font-serif text-center">
        {spec.display_name}
      </h1>
      <img
        src={photoUrl}
        alt=""
        className="rounded-lg max-h-80 object-cover border border-ember/20"
      />
      <blockquote className="max-w-md text-center italic text-lg opacity-80">
        &ldquo;{spec.greeting_templates[0]}&rdquo;
      </blockquote>
      <ConverseButton characterId={id} />
      <a href="/" className="text-sm underline opacity-70 hover:opacity-100">
        ← back
      </a>
    </div>
  );
}
