export interface SpecRow {
  name: string;
  value: string;
}

export interface PriceTier {
  minQty: number;
  priceCny: number;
  priceUsd: number;
}

export interface VariantRow {
  sku: string;
  options: Record<string, string>;
  priceUsd: number;
  stock: number;
}

export interface FactoryTerms {
  moq: number;
  unit: string;
  leadTime: string;
  payment: string;
  sample: string;
  warranty: string;
  returns: string;
  shipping: string;
  customization: string;
  inspection: string;
  packing: string;
}

export interface SourcedImage {
  path: string;
  alt: string;
  sourceUrl: string;
  position: number;
}

export interface SourcedProduct {
  id: string;
  signalSlug: string;
  status: "ready" | "draft";
  sourcePlatform: string;
  sourceUrl: string;
  sourceOfferId: string;
  liveFetch: boolean;
  title: string;
  titleZh: string;
  handle: string;
  vendor: string;
  productType: string;
  tags: string[];
  descriptionHtml: string;
  descriptionPlain: string;
  descriptionZh: string;
  specifications: SpecRow[];
  terms: FactoryTerms;
  priceTiers: PriceTier[];
  retailPriceUsd: number;
  compareAtUsd: number;
  factoryPriceUsd: number;
  variants: VariantRow[];
  optionNames: string[];
  images: SourcedImage[];
  weightGrams: number;
  seoTitle: string;
  seoDescription: string;
  generatedAt: string;
  updatedAt: string;
}

export interface FactoryExtras {
  offerId: string;
  vendor: string;
  vendorZh: string;
  gallery: string[];
  specs: SpecRow[];
  optionNames: string[];
  variants: VariantRow[];
  leadTime: string;
  warranty: string;
  customMoq: number;
  unit: string;
  weightGrams: number;
  packing: string;
  certifications: string[];
}
