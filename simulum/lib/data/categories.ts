import type { Category } from "@/lib/types";

export const CATEGORIES: Omit<Category, "evidenceCount">[] = [
  {
    id: "cat-physics",
    slug: "physics-cosmology",
    name: "Physics & Cosmology",
    description: "Discrete spacetime, holographic bounds, cosmological fine-tuning, and lab constraints.",
    sortOrder: 10,
  },
  {
    id: "cat-computation",
    slug: "computation-information",
    name: "Computation & Information",
    description: "It-from-bit, digital physics, error-correcting codes, and informational ontology.",
    sortOrder: 20,
  },
  {
    id: "cat-philosophy",
    slug: "philosophy-metaphysics",
    name: "Philosophy & Metaphysics",
    description: "Classic skeptical scenarios, ancestor simulations, and probability arguments.",
    sortOrder: 30,
  },
  {
    id: "cat-consciousness",
    slug: "consciousness-mind",
    name: "Consciousness & Mind",
    description: "Observer roles, substrate independence, and mind-upload style claims.",
    sortOrder: 40,
  },
  {
    id: "cat-math",
    slug: "mathematical-structure",
    name: "Mathematical Structure",
    description: "Mathematical universe ideas, computability limits, and lattice discretizations.",
    sortOrder: 50,
  },
  {
    id: "cat-anomalies",
    slug: "anomalies-glitches",
    name: "Anomalies & Glitches",
    description: "Reported inconsistencies, Mandela-effect style lore, and popular glitch claims.",
    sortOrder: 60,
  },
  {
    id: "cat-thought",
    slug: "thought-experiments",
    name: "Thought Experiments",
    description: "Formal scenarios designed to test whether reality could be computed.",
    sortOrder: 70,
  },
  {
    id: "cat-cultural",
    slug: "cultural-historical",
    name: "Cultural & Historical",
    description: "Long-running myths and traditions that frame the world as maya, dream, or stage.",
    sortOrder: 80,
  },
  {
    id: "cat-experimental",
    slug: "experimental-claims",
    name: "Experimental Claims",
    description: "Papers and proposals that claim measurable signatures of a simulated substrate.",
    sortOrder: 90,
  },
  {
    id: "cat-popular",
    slug: "public-discourse",
    name: "Public Discourse",
    description: "Widely cited contemporary statements that popularized the simulation idea.",
    sortOrder: 100,
  },
];
