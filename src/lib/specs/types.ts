export type Kind = "category" | "landmark" | "pairing";

export interface CharacterSpec {
  schema_version: number;
  kind: Kind;
  slug: string;
  display_name: string;
  archetype: string;
  era_or_age?: string;
  voice_profile: {
    design_prompt: string;
    voice_id_override?: string | null;
    model_id?: "eleven_multilingual_ttv_v2" | "eleven_ttv_v3";
  };
  personality: {
    traits: string[];
    speaking_quirks: string[];
    emotional_baseline: string;
  };
  greeting_templates: string[];
  memory_style: string;
  first_person_transforms: Array<{ fact: string; voiced: string }>;
  ambient_signature: {
    prompt: string;
    duration_seconds: number;
  };
  forbidden_registers: string[];
  // pairing-only
  signature_a?: string | null;
  signature_b?: string | null;
}

export interface Subject {
  category: string;
  attributes: string[];
  confidence: number;
}

export interface VisionResult {
  primary: Subject;
  secondary?: Subject;
  landmark_slug?: string;
  description: string;
}

export interface CharacterRecord {
  id: string;
  kind: Kind;
  display_name: string;
  voice_id: string;
  agent_id: string | null;
  ambient_r2_key: string | null;
  greeting_text: string;
  image_r2_key?: string;
}
