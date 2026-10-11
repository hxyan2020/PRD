import type { CategoryKind } from "../types/catalog";

export interface TraitOption {
  id: string;
  label: string;
}

export interface TraitField {
  id: string;
  label: string;
  hint: string;
  options: TraitOption[];
  /** How this trait shapes Wikipedia search queries */
  searchHint: string;
}

export interface CategoryInterestSpec {
  categoryId: string;
  kind: CategoryKind;
  subject: string;
  listQuery: string;
  fields: TraitField[];
}

const ORIGIN_OPTIONS: TraitOption[] = [
  { id: "japan", label: "Japan" },
  { id: "china", label: "China" },
  { id: "usa", label: "USA" },
  { id: "germany", label: "Germany" },
  { id: "uk", label: "United Kingdom" },
  { id: "france", label: "France" },
  { id: "italy", label: "Italy" },
  { id: "south-korea", label: "South Korea" },
  { id: "sweden", label: "Sweden" },
  { id: "india", label: "India" },
  { id: "brazil", label: "Brazil" },
  { id: "australia", label: "Australia" },
  { id: "spain", label: "Spain" },
  { id: "vietnam", label: "Vietnam" },
  { id: "mexico", label: "Mexico" },
  { id: "switzerland", label: "Switzerland" },
];

function originField(label = "Origin country / region"): TraitField {
  return {
    id: "origin",
    label,
    hint: "Where the brand or species is rooted.",
    options: ORIGIN_OPTIONS,
    searchHint: "origin",
  };
}

const SPECS: Record<string, CategoryInterestSpec> = {
  cars: {
    categoryId: "cars",
    kind: "brand",
    subject: "automobile manufacturer brand",
    listQuery: "automobile manufacturers",
    fields: [
      originField("Origin country"),
      {
        id: "propulsion",
        label: "Propulsion",
        hint: "Powertrain focus you care about.",
        options: [
          { id: "ev", label: "Electric (EV)" },
          { id: "hybrid", label: "Hybrid" },
          { id: "ice", label: "Petrol / diesel" },
          { id: "rising", label: "Rising / new makers" },
        ],
        searchHint: "propulsion",
      },
      {
        id: "segment",
        label: "Segment",
        hint: "Body style or market tier.",
        options: [
          { id: "luxury", label: "Luxury" },
          { id: "supercar", label: "Supercar" },
          { id: "suv", label: "SUV / crossover" },
          { id: "truck", label: "Truck / pickup" },
          { id: "mass", label: "Mass market" },
        ],
        searchHint: "segment",
      },
    ],
  },
  cigarettes: {
    categoryId: "cigarettes",
    kind: "brand",
    subject: "cigarette tobacco brand",
    listQuery: "cigarette brands",
    fields: [originField()],
  },
  alcohol: {
    categoryId: "alcohol",
    kind: "brand",
    subject: "alcohol beverage brand",
    listQuery: "alcohol brands liquor wine sake beer",
    fields: [
      originField(),
      {
        id: "drink",
        label: "Drink type",
        hint: "Spirits, wine, sake, or beer.",
        options: [
          { id: "liquor", label: "Spirits / liquor" },
          { id: "wine", label: "Wine" },
          { id: "sake", label: "Sake" },
          { id: "beer", label: "Beer" },
          { id: "whisky", label: "Whisky / whiskey" },
          { id: "vodka", label: "Vodka" },
          { id: "gin", label: "Gin" },
          { id: "rum", label: "Rum" },
          { id: "tequila", label: "Tequila / mezcal" },
          { id: "sparkling", label: "Sparkling wine" },
        ],
        searchHint: "type",
      },
    ],
  },
  coffee: {
    categoryId: "coffee",
    kind: "brand",
    subject: "coffee brand roaster chain",
    listQuery: "coffee brands",
    fields: [
      originField(),
      {
        id: "type",
        label: "Type",
        hint: "Chain, roaster, or instant.",
        options: [
          { id: "chain", label: "Café chain" },
          { id: "roaster", label: "Specialty roaster" },
          { id: "instant", label: "Instant / retail" },
        ],
        searchHint: "type",
      },
    ],
  },
  tea: {
    categoryId: "tea",
    kind: "brand",
    subject: "tea brand",
    listQuery: "tea brands",
    fields: [
      originField(),
      {
        id: "type",
        label: "Tea type",
        hint: "Leaf style.",
        options: [
          { id: "black", label: "Black" },
          { id: "green", label: "Green" },
          { id: "oolong", label: "Oolong" },
          { id: "herbal", label: "Herbal" },
          { id: "matcha", label: "Matcha" },
        ],
        searchHint: "type",
      },
    ],
  },
  clothes: {
    categoryId: "clothes",
    kind: "brand",
    subject: "clothing fashion brand",
    listQuery: "clothing brands",
    fields: [
      originField(),
      {
        id: "style",
        label: "Style",
        hint: "Fashion lane.",
        options: [
          { id: "streetwear", label: "Streetwear" },
          { id: "sportswear", label: "Sportswear" },
          { id: "fast-fashion", label: "Fast fashion" },
          { id: "denim", label: "Denim" },
          { id: "outdoor", label: "Outdoor" },
        ],
        searchHint: "style",
      },
    ],
  },
  luxury: {
    categoryId: "luxury",
    kind: "brand",
    subject: "luxury fashion maison brand",
    listQuery: "luxury brands",
    fields: [
      originField(),
      {
        id: "craft",
        label: "Craft",
        hint: "What the house is known for.",
        options: [
          { id: "fashion", label: "Fashion" },
          { id: "leather", label: "Leather goods" },
          { id: "jewellery", label: "Jewellery" },
          { id: "watches", label: "Watches" },
          { id: "fragrance", label: "Fragrance" },
        ],
        searchHint: "craft",
      },
    ],
  },
  trees: {
    categoryId: "trees",
    kind: "nature",
    subject: "tree species",
    listQuery: "tree species",
    fields: [
      {
        id: "climate",
        label: "Climate / region",
        hint: "Where you usually see them.",
        options: [
          { id: "temperate", label: "Temperate" },
          { id: "tropical", label: "Tropical" },
          { id: "boreal", label: "Boreal / cold" },
          { id: "mediterranean", label: "Mediterranean" },
          { id: "east-asia", label: "East Asia" },
          { id: "north-america", label: "North America" },
          { id: "europe", label: "Europe" },
        ],
        searchHint: "climate",
      },
      {
        id: "type",
        label: "Type",
        hint: "Leaf habit.",
        options: [
          { id: "deciduous", label: "Deciduous" },
          { id: "conifer", label: "Conifer" },
          { id: "palm", label: "Palm" },
          { id: "flowering", label: "Flowering" },
        ],
        searchHint: "type",
      },
    ],
  },
  flowers: {
    categoryId: "flowers",
    kind: "nature",
    subject: "flower plant species",
    listQuery: "flower species",
    fields: [
      {
        id: "climate",
        label: "Climate / region",
        hint: "Growing region.",
        options: [
          { id: "temperate", label: "Temperate" },
          { id: "tropical", label: "Tropical" },
          { id: "mediterranean", label: "Mediterranean" },
          { id: "east-asia", label: "East Asia" },
        ],
        searchHint: "climate",
      },
      {
        id: "colour",
        label: "Colour family",
        hint: "Bloom colour you notice.",
        options: [
          { id: "red", label: "Red / pink" },
          { id: "yellow", label: "Yellow / orange" },
          { id: "blue", label: "Blue / purple" },
          { id: "white", label: "White" },
        ],
        searchHint: "colour",
      },
    ],
  },
  animals: {
    categoryId: "animals",
    kind: "nature",
    subject: "animal insect species",
    listQuery: "animal species",
    fields: [
      {
        id: "class",
        label: "Class",
        hint: "Kind of creature.",
        options: [
          { id: "mammal", label: "Mammal" },
          { id: "bird", label: "Bird" },
          { id: "insect", label: "Insect" },
          { id: "reptile", label: "Reptile" },
          { id: "amphibian", label: "Amphibian" },
        ],
        searchHint: "class",
      },
      {
        id: "region",
        label: "Region",
        hint: "Where they live.",
        options: [
          { id: "worldwide", label: "Worldwide" },
          { id: "asia", label: "Asia" },
          { id: "africa", label: "Africa" },
          { id: "europe", label: "Europe" },
          { id: "americas", label: "Americas" },
          { id: "oceania", label: "Oceania" },
        ],
        searchHint: "region",
      },
    ],
  },
  food: {
    categoryId: "food",
    kind: "food",
    subject: "food brand product",
    listQuery: "food brands",
    fields: [
      originField("Cuisine / brand origin"),
      {
        id: "type",
        label: "Type",
        hint: "What kind of food mark.",
        options: [
          { id: "snack", label: "Snack" },
          { id: "sauce", label: "Sauce / condiment" },
          { id: "dairy", label: "Dairy" },
          { id: "noodle", label: "Noodle / instant" },
          { id: "confectionery", label: "Confectionery" },
        ],
        searchHint: "type",
      },
    ],
  },
};

const LEGACY_ALCOHOL = new Set(["liquor", "wine", "sake", "beer"]);

export function interestSpecFor(categoryId: string): CategoryInterestSpec | null {
  if (LEGACY_ALCOHOL.has(categoryId)) return SPECS.alcohol ?? null;
  return SPECS[categoryId] ?? null;
}

export function optionLabel(field: TraitField, optionId: string): string {
  return field.options.find((o) => o.id === optionId)?.label ?? optionId;
}
