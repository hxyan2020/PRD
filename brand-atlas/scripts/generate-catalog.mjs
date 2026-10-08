#!/usr/bin/env node
/**
 * Builds public/data/catalog.json from curated seed lists.
 * Run via `npm run data` (also hooked to predev / prebuild).
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "data");
const outFile = join(outDir, "catalog.json");
const changelogFile = join(outDir, "changelog.json");

/** @typedef {{ id: string, name: string, aliases?: string[], origin?: string, tags?: string[], summary?: string }} ItemSeed */

/** @type {Record<string, { id: string, label: string, blurb: string, kind: 'brand' | 'nature' | 'food', items: ItemSeed[] }>} */
const CATEGORIES = {
  cars: {
    id: "cars",
    label: "Car brands",
    blurb: "Automakers still on the road.",
    kind: "brand",
    items: [
      { id: "toyota", name: "Toyota", aliases: ["トヨタ"], origin: "Japan", tags: ["sedan", "hybrid"] },
      { id: "honda", name: "Honda", aliases: ["ホンダ"], origin: "Japan", tags: ["civic", "accord"] },
      { id: "nissan", name: "Nissan", aliases: ["ニッサン", "datsun"], origin: "Japan" },
      { id: "mazda", name: "Mazda", aliases: ["マツダ"], origin: "Japan" },
      { id: "subaru", name: "Subaru", aliases: ["スバル"], origin: "Japan" },
      { id: "mitsubishi", name: "Mitsubishi", origin: "Japan" },
      { id: "suzuki", name: "Suzuki", origin: "Japan" },
      { id: "lexus", name: "Lexus", origin: "Japan", tags: ["luxury"] },
      { id: "ford", name: "Ford", origin: "USA", tags: ["mustang", "f-150"] },
      { id: "chevrolet", name: "Chevrolet", aliases: ["chevy", "gm"], origin: "USA" },
      { id: "tesla", name: "Tesla", origin: "USA", tags: ["ev", "electric"] },
      { id: "jeep", name: "Jeep", origin: "USA", tags: ["suv"] },
      { id: "cadillac", name: "Cadillac", origin: "USA" },
      { id: "bmw", name: "BMW", aliases: ["bavarian motor works"], origin: "Germany" },
      { id: "mercedes-benz", name: "Mercedes-Benz", aliases: ["mercedes", "benz"], origin: "Germany" },
      { id: "audi", name: "Audi", origin: "Germany", tags: ["rings"] },
      { id: "volkswagen", name: "Volkswagen", aliases: ["vw", "volkswagen"], origin: "Germany" },
      { id: "porsche", name: "Porsche", origin: "Germany" },
      { id: "opel", name: "Opel", origin: "Germany" },
      { id: "ferrari", name: "Ferrari", origin: "Italy", tags: ["supercar"] },
      { id: "lamborghini", name: "Lamborghini", origin: "Italy" },
      { id: "fiat", name: "Fiat", origin: "Italy" },
      { id: "alfa-romeo", name: "Alfa Romeo", origin: "Italy" },
      { id: "maserati", name: "Maserati", origin: "Italy" },
      { id: "volvo", name: "Volvo", origin: "Sweden" },
      { id: "saab", name: "Saab", origin: "Sweden" },
      { id: "hyundai", name: "Hyundai", origin: "South Korea" },
      { id: "kia", name: "Kia", origin: "South Korea" },
      { id: "genesis", name: "Genesis", origin: "South Korea" },
      { id: "peugeot", name: "Peugeot", origin: "France" },
      { id: "renault", name: "Renault", origin: "France" },
      { id: "citroen", name: "Citroën", aliases: ["citroen"], origin: "France" },
      { id: "jaguar", name: "Jaguar", origin: "UK" },
      { id: "land-rover", name: "Land Rover", aliases: ["range rover"], origin: "UK" },
      { id: "mini", name: "MINI", origin: "UK" },
      { id: "rolls-royce", name: "Rolls-Royce", origin: "UK" },
      { id: "bentley", name: "Bentley", origin: "UK" },
      { id: "aston-martin", name: "Aston Martin", origin: "UK" },
      { id: "byd", name: "BYD", origin: "China", tags: ["ev"] },
      { id: "geely", name: "Geely", origin: "China" },
    ],
  },
  cigarettes: {
    id: "cigarettes",
    label: "Cigarette brands",
    blurb: "Tobacco marks still in circulation (18+).",
    kind: "brand",
    items: [
      { id: "marlboro", name: "Marlboro", origin: "USA", tags: ["philip morris"] },
      { id: "camel", name: "Camel", origin: "USA", tags: ["rj reynolds"] },
      { id: "lucky-strike", name: "Lucky Strike", origin: "USA" },
      { id: "winston", name: "Winston", origin: "USA" },
      { id: "pall-mall", name: "Pall Mall", origin: "UK" },
      { id: "parliament", name: "Parliament", origin: "USA" },
      { id: "chesterfield", name: "Chesterfield", origin: "USA" },
      { id: "kent", name: "Kent", origin: "USA" },
      { id: "dunhill", name: "Dunhill", origin: "UK" },
      { id: "benson-hedges", name: "Benson & Hedges", aliases: ["b&h"], origin: "UK" },
      { id: "davidoff", name: "Davidoff", origin: "Switzerland" },
      { id: "gauloises", name: "Gauloises", origin: "France" },
      { id: "gitanes", name: "Gitanes", origin: "France" },
      { id: "mevius", name: "Mevius", aliases: ["mild seven"], origin: "Japan" },
      { id: "hope", name: "Hope", origin: "Japan" },
      { id: "seven-stars", name: "Seven Stars", origin: "Japan" },
      { id: "lawrence", name: "Lark", aliases: ["lark"], origin: "USA" },
      { id: "rothmans", name: "Rothmans", origin: "UK" },
      { id: "embassy", name: "Embassy", origin: "UK" },
      { id: "gold-flake", name: "Gold Flake", origin: "India" },
    ],
  },
  liquor: {
    id: "liquor",
    label: "Liquor brands",
    blurb: "Spirits houses still pouring worldwide.",
    kind: "brand",
    items: [
      { id: "johnnie-walker", name: "Johnnie Walker", aliases: ["johnny walker"], origin: "Scotland", tags: ["whisky"] },
      { id: "jack-daniels", name: "Jack Daniel's", aliases: ["jack daniels", "jd"], origin: "USA", tags: ["whiskey"] },
      { id: "jameson", name: "Jameson", origin: "Ireland", tags: ["whiskey"] },
      { id: "macallan", name: "The Macallan", aliases: ["macallan"], origin: "Scotland" },
      { id: "glenlivet", name: "The Glenlivet", aliases: ["glenlivet"], origin: "Scotland" },
      { id: "glenfiddich", name: "Glenfiddich", origin: "Scotland" },
      { id: "absolut", name: "Absolut", origin: "Sweden", tags: ["vodka"] },
      { id: "smirnoff", name: "Smirnoff", origin: "Russia", tags: ["vodka"] },
      { id: "grey-goose", name: "Grey Goose", origin: "France", tags: ["vodka"] },
      { id: "belvedere", name: "Belvedere", origin: "Poland", tags: ["vodka"] },
      { id: "bacardi", name: "Bacardi", origin: "Cuba", tags: ["rum"] },
      { id: "captain-morgan", name: "Captain Morgan", origin: "UK", tags: ["rum"] },
      { id: "havana-club", name: "Havana Club", origin: "Cuba", tags: ["rum"] },
      { id: "hennessy", name: "Hennessy", origin: "France", tags: ["cognac"] },
      { id: "remy-martin", name: "Rémy Martin", aliases: ["remy martin"], origin: "France", tags: ["cognac"] },
      { id: "courvoisier", name: "Courvoisier", origin: "France", tags: ["cognac"] },
      { id: "patron", name: "Patrón", aliases: ["patron"], origin: "Mexico", tags: ["tequila"] },
      { id: "jose-cuervo", name: "José Cuervo", aliases: ["jose cuervo", "cuervo"], origin: "Mexico", tags: ["tequila"] },
      { id: "don-julio", name: "Don Julio", origin: "Mexico", tags: ["tequila"] },
      { id: "tanqueray", name: "Tanqueray", origin: "UK", tags: ["gin"] },
      { id: "bombay-sapphire", name: "Bombay Sapphire", origin: "UK", tags: ["gin"] },
      { id: "hendricks", name: "Hendrick's", aliases: ["hendricks"], origin: "Scotland", tags: ["gin"] },
      { id: "jagermeister", name: "Jägermeister", aliases: ["jagermeister"], origin: "Germany", tags: ["liqueur"] },
      { id: "baileys", name: "Baileys", origin: "Ireland", tags: ["liqueur"] },
      { id: "campari", name: "Campari", origin: "Italy", tags: ["aperitif"] },
      { id: "aperol", name: "Aperol", origin: "Italy", tags: ["aperitif"] },
      { id: "suntory", name: "Suntory", origin: "Japan", tags: ["whisky"] },
      { id: "yamazaki", name: "Yamazaki", origin: "Japan", tags: ["whisky"] },
      { id: "hibiki", name: "Hibiki", origin: "Japan", tags: ["whisky"] },
      { id: "chivas", name: "Chivas Regal", aliases: ["chivas"], origin: "Scotland" },
    ],
  },
  wine: {
    id: "wine",
    label: "Wine brands",
    blurb: "Houses and labels still on shelves.",
    kind: "brand",
    items: [
      { id: "moet", name: "Moët & Chandon", aliases: ["moet", "moët"], origin: "France", tags: ["champagne"] },
      { id: "veuve-clicquot", name: "Veuve Clicquot", origin: "France", tags: ["champagne"] },
      { id: "dom-perignon", name: "Dom Pérignon", aliases: ["dom perignon"], origin: "France", tags: ["champagne"] },
      { id: "penfolds", name: "Penfolds", origin: "Australia" },
      { id: "yellow-tail", name: "Yellow Tail", origin: "Australia" },
      { id: "barefoot", name: "Barefoot", origin: "USA" },
      { id: "gallo", name: "Gallo", aliases: ["ernest gallo"], origin: "USA" },
      { id: "robert-mondavi", name: "Robert Mondavi", origin: "USA" },
      { id: "opus-one", name: "Opus One", origin: "USA" },
      { id: "chateau-margaux", name: "Château Margaux", aliases: ["margaux"], origin: "France" },
      { id: "lafite", name: "Château Lafite Rothschild", aliases: ["lafite"], origin: "France" },
      { id: "latour", name: "Château Latour", aliases: ["latour"], origin: "France" },
      { id: "antinori", name: "Antinori", origin: "Italy" },
      { id: "gaja", name: "Gaja", origin: "Italy" },
      { id: "torres", name: "Torres", origin: "Spain" },
      { id: "vega-sicilia", name: "Vega Sicilia", origin: "Spain" },
      { id: "concha-y-toro", name: "Concha y Toro", origin: "Chile" },
      { id: "santa-rita", name: "Santa Rita", origin: "Chile" },
      { id: "cloud-bay", name: "Cloudy Bay", origin: "New Zealand" },
      { id: "kim-crawford", name: "Kim Crawford", origin: "New Zealand" },
      { id: "jacob's-creek", name: "Jacob's Creek", aliases: ["jacobs creek"], origin: "Australia" },
      { id: "casillero", name: "Casillero del Diablo", origin: "Chile" },
      { id: "mateus", name: "Mateus", origin: "Portugal" },
      { id: "sandeman", name: "Sandeman", origin: "Portugal", tags: ["port"] },
      { id: "taylor-fladgate", name: "Taylor Fladgate", origin: "Portugal", tags: ["port"] },
    ],
  },
  sake: {
    id: "sake",
    label: "Sake brands",
    blurb: "Brewers and labels still pouring nihonshu.",
    kind: "brand",
    items: [
      { id: "dassai", name: "Dassai", aliases: ["獺祭"], origin: "Japan" },
      { id: "kubota", name: "Kubota", aliases: ["久保田"], origin: "Japan" },
      { id: "hakutsuru", name: "Hakutsuru", aliases: ["白鶴"], origin: "Japan" },
      { id: "gekkeikan", name: "Gekkeikan", aliases: ["月桂冠"], origin: "Japan" },
      { id: "ozeki", name: "Ozeki", aliases: ["大関"], origin: "Japan" },
      { id: "takara", name: "Takara", aliases: ["宝"], origin: "Japan" },
      { id: "juyondai", name: "Juyondai", aliases: ["十四代"], origin: "Japan" },
      { id: "born", name: "Born", aliases: ["梵"], origin: "Japan" },
      { id: "sake-one", name: "SakeOne", origin: "USA" },
      { id: "hotei", name: "Hotei", origin: "Japan" },
      { id: "kikusui", name: "Kikusui", aliases: ["菊水"], origin: "Japan" },
      { id: "dewazakura", name: "Dewazakura", aliases: ["出羽桜"], origin: "Japan" },
      { id: "nanbu-bijin", name: "Nanbu Bijin", aliases: ["南部美人"], origin: "Japan" },
      { id: "suigei", name: "Suigei", aliases: ["酔鯨"], origin: "Japan" },
      { id: "hakkaisan", name: "Hakkaisan", aliases: ["八海山"], origin: "Japan" },
      { id: "koshi-no-kanbai", name: "Koshi no Kanbai", aliases: ["越乃寒梅"], origin: "Japan" },
      { id: "tatenokawa", name: "Tatenokawa", aliases: ["楯野川"], origin: "Japan" },
      { id: "mutsu-hassen", name: "Mutsu Hassen", aliases: ["陸奥八仙"], origin: "Japan" },
      { id: "shichiken", name: "Shichiken", aliases: ["七賢"], origin: "Japan" },
      { id: "urakasumi", name: "Urakasumi", aliases: ["浦霞"], origin: "Japan" },
    ],
  },
  beer: {
    id: "beer",
    label: "Beer brands",
    blurb: "Breweries and labels still in glasses.",
    kind: "brand",
    items: [
      { id: "heineken", name: "Heineken", origin: "Netherlands" },
      { id: "budweiser", name: "Budweiser", aliases: ["bud"], origin: "USA" },
      { id: "corona", name: "Corona", origin: "Mexico" },
      { id: "stella-artois", name: "Stella Artois", aliases: ["stella"], origin: "Belgium" },
      { id: "guinness", name: "Guinness", origin: "Ireland" },
      { id: "carlsberg", name: "Carlsberg", origin: "Denmark" },
      { id: "asahi", name: "Asahi", origin: "Japan" },
      { id: "kirin", name: "Kirin", origin: "Japan" },
      { id: "sapporo", name: "Sapporo", origin: "Japan" },
      { id: "suntory-beer", name: "Suntory Beer", aliases: ["premium malt's"], origin: "Japan" },
      { id: "tsingtao", name: "Tsingtao", origin: "China" },
      { id: "harbin", name: "Harbin", origin: "China" },
      { id: "tiger", name: "Tiger", origin: "Singapore" },
      { id: "singha", name: "Singha", origin: "Thailand" },
      { id: "chang", name: "Chang", origin: "Thailand" },
      { id: "peroni", name: "Peroni", origin: "Italy" },
      { id: "moretti", name: "Birra Moretti", aliases: ["moretti"], origin: "Italy" },
      { id: "beckoni", name: "Beck's", aliases: ["becks"], origin: "Germany" },
      { id: "paulaner", name: "Paulaner", origin: "Germany" },
      { id: "erdinger", name: "Erdinger", origin: "Germany" },
      { id: "modelo", name: "Modelo", origin: "Mexico" },
      { id: "dos-equis", name: "Dos Equis", origin: "Mexico" },
      { id: "sierra-nevada", name: "Sierra Nevada", origin: "USA" },
      { id: "blue-moon", name: "Blue Moon", origin: "USA" },
      { id: "hoegaarden", name: "Hoegaarden", origin: "Belgium" },
      { id: "duvel", name: "Duvel", origin: "Belgium" },
      { id: "chimay", name: "Chimay", origin: "Belgium" },
      { id: "foster", name: "Foster's", aliases: ["fosters"], origin: "Australia" },
      { id: "victoria-bitter", name: "Victoria Bitter", aliases: ["vb"], origin: "Australia" },
      { id: "pilsner-urquell", name: "Pilsner Urquell", origin: "Czechia" },
    ],
  },
  coffee: {
    id: "coffee",
    label: "Coffee",
    blurb: "Roasters, chains, and bean houses still brewing.",
    kind: "brand",
    items: [
      { id: "starbucks", name: "Starbucks", origin: "USA" },
      { id: "dunkin", name: "Dunkin'", aliases: ["dunkin donuts", "dunkin"], origin: "USA" },
      { id: "peets", name: "Peet's Coffee", aliases: ["peets"], origin: "USA" },
      { id: "blue-bottle", name: "Blue Bottle Coffee", aliases: ["blue bottle"], origin: "USA" },
      { id: "illy", name: "Illy", origin: "Italy" },
      { id: "lavazza", name: "Lavazza", origin: "Italy" },
      { id: "nespresso", name: "Nespresso", origin: "Switzerland" },
      { id: "nescafe", name: "Nescafé", aliases: ["nescafe"], origin: "Switzerland" },
      { id: "folgers", name: "Folgers", origin: "USA" },
      { id: "maxwell-house", name: "Maxwell House", origin: "USA" },
      { id: "tim-hortons", name: "Tim Hortons", origin: "Canada" },
      { id: "costa", name: "Costa Coffee", aliases: ["costa"], origin: "UK" },
      { id: "pret", name: "Pret A Manger", aliases: ["pret"], origin: "UK" },
      { id: "uccc", name: "UCC", origin: "Japan" },
      { id: "doutor", name: "Doutor", origin: "Japan" },
      { id: "komeda", name: "Komeda Coffee", aliases: ["komeda"], origin: "Japan" },
      { id: "luckin", name: "Luckin Coffee", aliases: ["luckin"], origin: "China" },
      { id: "mccafe", name: "McCafé", aliases: ["mccafe"], origin: "USA" },
      { id: "hario", name: "Hario", origin: "Japan", tags: ["equipment"] },
      { id: "stumptown", name: "Stumptown", origin: "USA" },
      { id: "intelligentsia", name: "Intelligentsia", origin: "USA" },
      { id: "counter-culture", name: "Counter Culture", origin: "USA" },
      { id: "davidoff-cafe", name: "Davidoff Café", aliases: ["davidoff cafe"], origin: "Switzerland" },
      { id: "segafredo", name: "Segafredo", origin: "Italy" },
      { id: "kimbo", name: "Kimbo", origin: "Italy" },
    ],
  },
  tea: {
    id: "tea",
    label: "Tea",
    blurb: "Tea houses and bags still steeping.",
    kind: "brand",
    items: [
      { id: "lipton", name: "Lipton", origin: "UK" },
      { id: "twinings", name: "Twinings", origin: "UK" },
      { id: "pg-tips", name: "PG Tips", origin: "UK" },
      { id: "yorkshire", name: "Yorkshire Tea", origin: "UK" },
      { id: "tetley", name: "Tetley", origin: "UK" },
      { id: "harney", name: "Harney & Sons", aliases: ["harney"], origin: "USA" },
      { id: "tazo", name: "Tazo", origin: "USA" },
      { id: "mighty-leaf", name: "Mighty Leaf", origin: "USA" },
      { id: "dilmah", name: "Dilmah", origin: "Sri Lanka" },
      { id: "ahmad", name: "Ahmad Tea", aliases: ["ahmad"], origin: "UK" },
      { id: "twg", name: "TWG Tea", aliases: ["twg"], origin: "Singapore" },
      { id: "lupicia", name: "Lupicia", origin: "Japan" },
      { id: "ito-en", name: "Itō En", aliases: ["itoen", "ito en"], origin: "Japan" },
      { id: "yamamotoyama", name: "Yamamotoyama", origin: "Japan" },
      { id: "nana", name: "Nana's", origin: "Morocco", tags: ["mint"] },
      { id: "clipper", name: "Clipper", origin: "UK" },
      { id: "pukka", name: "Pukka", origin: "UK" },
      { id: "yogi", name: "Yogi Tea", aliases: ["yogi"], origin: "Germany" },
      { id: "celestial", name: "Celestial Seasonings", origin: "USA" },
      { id: "bigelow", name: "Bigelow", origin: "USA" },
      { id: "numi", name: "Numi", origin: "USA" },
      { id: "teavana", name: "Teavana", origin: "USA" },
      { id: "davids-tea", name: "DAVIDsTEA", aliases: ["davids tea"], origin: "Canada" },
      { id: "cha-tra-mue", name: "ChaTraMue", aliases: ["chatramue"], origin: "Thailand" },
      { id: "tenren", name: "Ten Ren", aliases: ["tenren"], origin: "Taiwan" },
    ],
  },
  clothes: {
    id: "clothes",
    label: "Clothes brands",
    blurb: "Fashion houses and streetwear still worn.",
    kind: "brand",
    items: [
      { id: "nike", name: "Nike", origin: "USA", tags: ["swoosh"] },
      { id: "adidas", name: "Adidas", origin: "Germany", tags: ["three stripes"] },
      { id: "puma", name: "Puma", origin: "Germany" },
      { id: "under-armour", name: "Under Armour", origin: "USA" },
      { id: "uniqlo", name: "Uniqlo", origin: "Japan" },
      { id: "zara", name: "Zara", origin: "Spain" },
      { id: "h-and-m", name: "H&M", aliases: ["hm", "h and m"], origin: "Sweden" },
      { id: "gap", name: "Gap", origin: "USA" },
      { id: "levi", name: "Levi's", aliases: ["levis", "levi strauss"], origin: "USA" },
      { id: "ralph-lauren", name: "Ralph Lauren", aliases: ["polo"], origin: "USA" },
      { id: "tommy", name: "Tommy Hilfiger", aliases: ["tommy"], origin: "USA" },
      { id: "calvin-klein", name: "Calvin Klein", aliases: ["ck"], origin: "USA" },
      { id: "gucci", name: "Gucci", origin: "Italy" },
      { id: "prada", name: "Prada", origin: "Italy" },
      { id: "versace", name: "Versace", origin: "Italy" },
      { id: "armani", name: "Armani", aliases: ["giorgio armani"], origin: "Italy" },
      { id: "burberry", name: "Burberry", origin: "UK" },
      { id: "lululemon", name: "Lululemon", origin: "Canada" },
      { id: "patagonia", name: "Patagonia", origin: "USA" },
      { id: "north-face", name: "The North Face", aliases: ["north face", "tnf"], origin: "USA" },
      { id: "supreme", name: "Supreme", origin: "USA" },
      { id: "off-white", name: "Off-White", origin: "Italy" },
      { id: "balenciaga", name: "Balenciaga", origin: "Spain" },
      { id: "muji", name: "MUJI", origin: "Japan" },
      { id: "gu", name: "GU", origin: "Japan" },
      { id: "cos", name: "COS", origin: "Sweden" },
      { id: "everlane", name: "Everlane", origin: "USA" },
      { id: "carhartt", name: "Carhartt", origin: "USA" },
      { id: "dickies", name: "Dickies", origin: "USA" },
      { id: "champion", name: "Champion", origin: "USA" },
    ],
  },
  luxury: {
    id: "luxury",
    label: "Luxury brands",
    blurb: "Maisons and houses still coveted.",
    kind: "brand",
    items: [
      { id: "louis-vuitton", name: "Louis Vuitton", aliases: ["lv", "vuitton"], origin: "France" },
      { id: "chanel", name: "Chanel", origin: "France" },
      { id: "hermes", name: "Hermès", aliases: ["hermes"], origin: "France" },
      { id: "dior", name: "Dior", aliases: ["christian dior"], origin: "France" },
      { id: "cartier", name: "Cartier", origin: "France" },
      { id: "tiffany", name: "Tiffany & Co.", aliases: ["tiffany"], origin: "USA" },
      { id: "rolex", name: "Rolex", origin: "Switzerland" },
      { id: "omega", name: "Omega", origin: "Switzerland" },
      { id: "patek", name: "Patek Philippe", aliases: ["patek"], origin: "Switzerland" },
      { id: "audemars", name: "Audemars Piguet", aliases: ["ap"], origin: "Switzerland" },
      { id: "bvlgari", name: "Bulgari", aliases: ["bvlgari"], origin: "Italy" },
      { id: "van-cleef", name: "Van Cleef & Arpels", origin: "France" },
      { id: "fendi", name: "Fendi", origin: "Italy" },
      { id: "bottega", name: "Bottega Veneta", aliases: ["bottega"], origin: "Italy" },
      { id: "celine", name: "Celine", aliases: ["céline"], origin: "France" },
      { id: "givenchy", name: "Givenchy", origin: "France" },
      { id: "ysl", name: "Yves Saint Laurent", aliases: ["ysl", "saint laurent"], origin: "France" },
      { id: "montblanc", name: "Montblanc", origin: "Germany" },
      { id: "rimowa", name: "Rimowa", origin: "Germany" },
      { id: "ferrari-fashion", name: "Ferrari Style", origin: "Italy", tags: ["lifestyle"] },
      { id: "bentley-home", name: "Bentley Home", origin: "UK" },
      { id: "asprey", name: "Asprey", origin: "UK" },
      { id: "harry-winston", name: "Harry Winston", origin: "USA" },
      { id: "graff", name: "Graff", origin: "UK" },
      { id: "chopard", name: "Chopard", origin: "Switzerland" },
    ],
  },
  trees: {
    id: "trees",
    label: "Trees",
    blurb: "Living tree species still rooted on Earth.",
    kind: "nature",
    items: [
      { id: "oak", name: "Oak", aliases: ["quercus"], tags: ["deciduous"] },
      { id: "maple", name: "Maple", aliases: ["acer"], tags: ["deciduous"] },
      { id: "pine", name: "Pine", aliases: ["pinus"], tags: ["conifer"] },
      { id: "cedar", name: "Cedar", aliases: ["cedrus"], tags: ["conifer"] },
      { id: "birch", name: "Birch", aliases: ["betula"] },
      { id: "willow", name: "Willow", aliases: ["salix"] },
      { id: "cherry-blossom", name: "Cherry blossom", aliases: ["sakura", "prunus"], origin: "Japan" },
      { id: "ginkgo", name: "Ginkgo", aliases: ["ginkgo biloba"], origin: "China" },
      { id: "baobab", name: "Baobab", origin: "Africa" },
      { id: "sequoia", name: "Giant sequoia", aliases: ["sequoiadendron"], origin: "USA" },
      { id: "redwood", name: "Coast redwood", aliases: ["sequoia sempervirens"], origin: "USA" },
      { id: "bamboo", name: "Bamboo", aliases: ["bambusoideae"], tags: ["grass"] },
      { id: "palm", name: "Palm", aliases: ["arecaceae"] },
      { id: "olive", name: "Olive tree", aliases: ["olea europaea"] },
      { id: "fig", name: "Fig tree", aliases: ["ficus"] },
      { id: "eucalyptus", name: "Eucalyptus", origin: "Australia" },
      { id: "cypress", name: "Cypress", aliases: ["cupressus"] },
      { id: "elm", name: "Elm", aliases: ["ulmus"] },
      { id: "ash", name: "Ash", aliases: ["fraxinus"] },
      { id: "beech", name: "Beech", aliases: ["fagus"] },
      { id: "spruce", name: "Spruce", aliases: ["picea"] },
      { id: "fir", name: "Fir", aliases: ["abies"] },
      { id: "jacaranda", name: "Jacaranda", origin: "South America" },
      { id: "magnolia", name: "Magnolia tree", aliases: ["magnolia"] },
      { id: "wisteria-tree", name: "Wisteria", aliases: ["wisteria"] },
    ],
  },
  flowers: {
    id: "flowers",
    label: "Flowers",
    blurb: "Blooms still opening around the world.",
    kind: "nature",
    items: [
      { id: "rose", name: "Rose", aliases: ["rosa"] },
      { id: "tulip", name: "Tulip", aliases: ["tulipa"] },
      { id: "sunflower", name: "Sunflower", aliases: ["helianthus"] },
      { id: "orchid", name: "Orchid", aliases: ["orchidaceae"] },
      { id: "lily", name: "Lily", aliases: ["lilium"] },
      { id: "lavender", name: "Lavender", aliases: ["lavandula"] },
      { id: "daisy", name: "Daisy", aliases: ["bellis"] },
      { id: "chrysanthemum", name: "Chrysanthemum", aliases: ["mums"] },
      { id: "peony", name: "Peony", aliases: ["paeonia"] },
      { id: "hydrangea", name: "Hydrangea" },
      { id: "jasmine", name: "Jasmine", aliases: ["jasminum"] },
      { id: "lotus", name: "Lotus", aliases: ["nelumbo"] },
      { id: "cherry-flower", name: "Cherry blossom flower", aliases: ["sakura flower"] },
      { id: "hibiscus", name: "Hibiscus" },
      { id: "marigold", name: "Marigold", aliases: ["tagetes"] },
      { id: "iris", name: "Iris" },
      { id: "poppy", name: "Poppy", aliases: ["papaver"] },
      { id: "violet", name: "Violet", aliases: ["viola"] },
      { id: "carnation", name: "Carnation", aliases: ["dianthus"] },
      { id: "daffodil", name: "Daffodil", aliases: ["narcissus"] },
      { id: "camellia", name: "Camellia" },
      { id: "azalea", name: "Azalea", aliases: ["rhododendron"] },
      { id: "bougainvillea", name: "Bougainvillea" },
      { id: "plumeria", name: "Plumeria", aliases: ["frangipani"] },
      { id: "protea", name: "Protea", origin: "South Africa" },
    ],
  },
  animals: {
    id: "animals",
    label: "Animals & insects",
    blurb: "Creatures still living with us — mammals to insects.",
    kind: "nature",
    items: [
      { id: "dog", name: "Dog", aliases: ["canis familiaris", "canine"] },
      { id: "cat", name: "Cat", aliases: ["feline", "felis"] },
      { id: "horse", name: "Horse", aliases: ["equus"] },
      { id: "cow", name: "Cow", aliases: ["cattle", "bovine"] },
      { id: "elephant", name: "Elephant" },
      { id: "lion", name: "Lion" },
      { id: "tiger", name: "Tiger" },
      { id: "panda", name: "Giant panda", aliases: ["panda"] },
      { id: "dolphin", name: "Dolphin" },
      { id: "whale", name: "Whale" },
      { id: "eagle", name: "Eagle" },
      { id: "owl", name: "Owl" },
      { id: "penguin", name: "Penguin" },
      { id: "butterfly", name: "Butterfly", aliases: ["lepidoptera"], tags: ["insect"] },
      { id: "bee", name: "Honey bee", aliases: ["bee", "apis"], tags: ["insect"] },
      { id: "ant", name: "Ant", aliases: ["formicidae"], tags: ["insect"] },
      { id: "dragonfly", name: "Dragonfly", tags: ["insect"] },
      { id: "ladybug", name: "Ladybug", aliases: ["ladybird", "coccinellidae"], tags: ["insect"] },
      { id: "mantis", name: "Praying mantis", aliases: ["mantis"], tags: ["insect"] },
      { id: "beetle", name: "Beetle", aliases: ["coleoptera"], tags: ["insect"] },
      { id: "spider", name: "Spider", aliases: ["arachnid"] },
      { id: "frog", name: "Frog", aliases: ["anura"] },
      { id: "snake", name: "Snake", aliases: ["serpent"] },
      { id: "turtle", name: "Turtle", aliases: ["tortoise"] },
      { id: "fox", name: "Fox" },
      { id: "wolf", name: "Wolf" },
      { id: "bear", name: "Bear" },
      { id: "deer", name: "Deer" },
      { id: "rabbit", name: "Rabbit", aliases: ["bunny"] },
      { id: "octopus", name: "Octopus" },
    ],
  },
  food: {
    id: "food",
    label: "Food",
    blurb: "Packaged foods and iconic edibles still on tables.",
    kind: "food",
    items: [
      { id: "coca-cola", name: "Coca-Cola", aliases: ["coke", "coca cola"], origin: "USA", tags: ["drink"] },
      { id: "pepsi", name: "Pepsi", origin: "USA", tags: ["drink"] },
      { id: "nutella", name: "Nutella", origin: "Italy" },
      { id: "oreo", name: "Oreo", origin: "USA" },
      { id: "kitkat", name: "KitKat", aliases: ["kit kat"], origin: "UK" },
      { id: "snickers", name: "Snickers", origin: "USA" },
      { id: "toblerone", name: "Toblerone", origin: "Switzerland" },
      { id: "haribo", name: "Haribo", origin: "Germany" },
      { id: "pringles", name: "Pringles", origin: "USA" },
      { id: "lay", name: "Lay's", aliases: ["lays"], origin: "USA" },
      { id: "doritos", name: "Doritos", origin: "USA" },
      { id: "heinz", name: "Heinz", origin: "USA", tags: ["ketchup"] },
      { id: "kelloggs", name: "Kellogg's", aliases: ["kelloggs"], origin: "USA" },
      { id: "nestle", name: "Nestlé", aliases: ["nestle"], origin: "Switzerland" },
      { id: "kraft", name: "Kraft", origin: "USA" },
      { id: "campbell", name: "Campbell's", aliases: ["campbells"], origin: "USA" },
      { id: "tabasco", name: "Tabasco", origin: "USA" },
      { id: "maggi", name: "Maggi", origin: "Switzerland" },
      { id: "knorr", name: "Knorr", origin: "Germany" },
      { id: "hellmanns", name: "Hellmann's", aliases: ["hellmanns"], origin: "USA" },
      { id: "philadelphia", name: "Philadelphia", origin: "USA", tags: ["cream cheese"] },
      { id: "ben-jerrys", name: "Ben & Jerry's", aliases: ["ben and jerrys"], origin: "USA" },
      { id: "haagen-dazs", name: "Häagen-Dazs", aliases: ["haagen dazs"], origin: "USA" },
      { id: "red-bull", name: "Red Bull", origin: "Austria", tags: ["drink"] },
      { id: "monster", name: "Monster Energy", aliases: ["monster"], origin: "USA", tags: ["drink"] },
      { id: "san-pellegrino", name: "S.Pellegrino", aliases: ["san pellegrino"], origin: "Italy" },
      { id: "evian", name: "Évian", aliases: ["evian"], origin: "France" },
      { id: "meiji", name: "Meiji", origin: "Japan" },
      { id: "calbee", name: "Calbee", origin: "Japan" },
      { id: "nissin", name: "Nissin", aliases: ["cup noodles"], origin: "Japan" },
    ],
  },
};

function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function coverHue(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % 360;
}

function buildItem(cat, seed, index) {
  const id = seed.id || slugify(seed.name);
  return {
    id: `${cat.id}__${id}`,
    slug: id,
    name: seed.name,
    aliases: seed.aliases ?? [],
    categoryId: cat.id,
    origin: seed.origin ?? null,
    tags: seed.tags ?? [],
    summary:
      seed.summary ??
      `${seed.name} — catalogued in ${cat.label.toLowerCase()}${seed.origin ? ` · ${seed.origin}` : ""}.`,
    coverHue: coverHue(`${cat.id}-${id}`),
    sort: index,
    status: "active",
  };
}

function buildCatalog(existingChangelog) {
  const categories = Object.values(CATEGORIES).map((cat) => ({
    id: cat.id,
    label: cat.label,
    blurb: cat.blurb,
    kind: cat.kind,
    itemCount: cat.items.length,
  }));

  const items = [];
  for (const cat of Object.values(CATEGORIES)) {
    cat.items.forEach((seed, i) => items.push(buildItem(cat, seed, i)));
  }

  const now = new Date().toISOString();
  return {
    meta: {
      name: "Seen Catalogue",
      version: 1,
      generatedAt: now,
      lastRefreshAt: existingChangelog?.appliedAt ?? now,
      nextRefreshAt: nextMondayISO(now),
      refreshCadence: "weekly",
      itemCount: items.length,
      categoryCount: categories.length,
      note: "Curated living catalogue of human-made brands and still-present nature. Refreshed weekly.",
    },
    categories,
    items,
  };
}

function nextMondayISO(fromISO) {
  const d = new Date(fromISO);
  const day = d.getUTCDay();
  const add = day === 0 ? 1 : 8 - day;
  d.setUTCDate(d.getUTCDate() + add);
  d.setUTCHours(6, 0, 0, 0);
  return d.toISOString();
}

/** Replay a list of mutations onto a catalog (mutates in place). */
function applyMutations(catalog, changes) {
  const byId = new Map(catalog.items.map((it) => [it.id, it]));
  const applied = [];
  for (const change of changes) {
    if (change.op === "remove" && byId.has(change.id)) {
      byId.get(change.id).status = "removed";
      applied.push(change);
    } else if (change.op === "modify" && byId.has(change.id)) {
      Object.assign(byId.get(change.id), change.patch ?? {});
      applied.push(change);
    } else if (change.op === "add" && change.item) {
      const cat = catalog.categories.find((c) => c.id === change.item.categoryId);
      if (cat) {
        const item = {
          ...change.item,
          id: change.item.id ?? `${change.item.categoryId}__${change.item.slug}`,
          status: "active",
        };
        if (!byId.has(item.id)) {
          cat.itemCount += 1;
        }
        byId.set(item.id, item);
        applied.push(change);
      }
    }
  }
  catalog.items = [...byId.values()].filter((it) => it.status !== "removed");
  for (const cat of catalog.categories) {
    cat.itemCount = catalog.items.filter((it) => it.categoryId === cat.id).length;
  }
  catalog.meta.itemCount = catalog.items.length;
  return applied;
}

mkdirSync(outDir, { recursive: true });

let changelog = {
  appliedAt: null,
  applied: [],
  pending: [],
  ledger: [],
  history: [],
};
if (existsSync(changelogFile)) {
  try {
    changelog = { ...changelog, ...JSON.parse(readFileSync(changelogFile, "utf8")) };
  } catch {
    /* keep defaults */
  }
}

// Migrate: fold last applied batch into durable ledger once
if (!changelog.ledger?.length && changelog.applied?.length) {
  changelog.ledger = [...changelog.applied];
}

const catalog = buildCatalog(changelog);

// Always replay durable ledger so weekly adds/removes survive regenerate
if (changelog.ledger?.length) {
  applyMutations(catalog, changelog.ledger);
  catalog.meta.lastRefreshAt = changelog.appliedAt ?? catalog.meta.lastRefreshAt;
  catalog.meta.nextRefreshAt = nextMondayISO(catalog.meta.lastRefreshAt);
}

// Apply newly pending mutations, then append them to the ledger
if (changelog.pending?.length) {
  const freshlyApplied = applyMutations(catalog, changelog.pending);
  catalog.meta.lastRefreshAt = new Date().toISOString();
  catalog.meta.nextRefreshAt = nextMondayISO(catalog.meta.lastRefreshAt);
  changelog = {
    ...changelog,
    appliedAt: catalog.meta.lastRefreshAt,
    applied: freshlyApplied,
    pending: [],
    ledger: [...(changelog.ledger ?? []), ...freshlyApplied],
    history: [
      ...(changelog.history ?? []),
      { at: catalog.meta.lastRefreshAt, count: freshlyApplied.length },
    ].slice(-52),
  };
}

writeFileSync(changelogFile, JSON.stringify(changelog, null, 2) + "\n");
writeFileSync(outFile, JSON.stringify(catalog, null, 2) + "\n");
console.log(
  `Wrote ${catalog.items.length} items across ${catalog.categories.length} categories → ${outFile}`,
);
