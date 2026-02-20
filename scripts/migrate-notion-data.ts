/**
 * One-time migration script: generates YAML files from Notion coffee data.
 * Run with: bun run scripts/migrate-notion-data.ts
 * Delete after migration is complete.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { stringify } from "yaml";

const HOBBIES_DIR = join(import.meta.dirname, "../hobbies/coffee");

// Roaster URL -> slug mapping
const roastersByUrl: Record<string, string> = {
  "55d0cc7bcaad45079c93aa17eb31622f": "docent",
  "ccf240a6b42b4cbd9ec6fc98108bab11": "east-pole",
  "990bfd7c397a4a40a53afd2cfca3cada": "corvus-coffee-roasters",
  "5777a7d7a2cb42d9bbc3c820182a4350": "huckleberry-coffee-roasters",
  "386ca1b4dd69438f8f08e5add886ad5f": "edison-coffee-co",
  "13476fbb4d4a4d02a7f74c706686940b": "prodigal-coffee",
  "79ef0e38ec9642d6ad517899d7114299": "onyx-coffee-lab",
  "9b1c7624365c424591180a319dd0f902": "central-market",
  "fb89e57b8b1b4aaeacb2ab6b77fcf1f9": "civil-goat",
  "d3684c9f62364eaeb5cb11a5658df64c": "madrone-coffee-co",
  "6ea6a923be504624b739af928f424cbc": "blue-copper",
  "45bce8e8d84f4981b5f3daf68fba6a21": "bandit-coffee",
  "cb97578972544b029e91b9b9f8619109": "queen-city-collective-coffee",
  "545a0078864b4b07a8b0e55335bb0310": "kiln",
  "17b0f79902a0802cac19ce77d09e7b1b": "chrome-yellow",
  "2be3ca1f6e254201961e993fac6a6011": "equator-coffees",
  "df802acda8bc4d3caea3c1d19f58e61d": "panther-coffee",
  "009b7d829b1041d9bd0713143f1d3a32": "fulcrum-coffee",
  "3958434b576144448a387075143d3908": "middlestate-coffee",
  "789e7eeede58483f92ea9f4ff959dd76": "publik-coffee-roasters",
  "860a32af2dee4e8782a8e4d9f971867d": "herkimer-coffee",
  "37ba35a051ab485a95350208d70162a0": "sweet-bloom-coffee-roasters",
  "16d0f79902a08005bf3df29169a4d246": "black-rifle-coffee-company",
  "20f0f79902a080f8b802d158eda70bd4": "methodical",
  "51783d4de4f94c39bdc289803ad6632b": "rcb-roasters",
  "a9f3d8a0c17445e1967d127e3f528427": "pink-elephant-coffee-roasters",
  "f064fa56ea434739906a8e07ac146fda": "medici-roasting",
  "53793bef38354bdea1dc486368cd3156": "merit",
  "776bf767b99d43428b9a4e18ade986c7": "bestslope-coffee-company",
  "5eabb0e7563f4bdda5b008d6941df6d8": "superthing-coffee",
  "6899cf7318064dd188721de87418c272": "roseline-coffee",
  "89915cd96d734586b029c46e3fd0c760": "pablos-coffee",
  "1dd0f79902a08060b519d15cfd57b617": "treeline-coffee-roasters",
  "41d016d6d6fc457d91412f73fe353eb7": "stouthaus-coffee-roasters",
};

function resolveRoaster(urls: string[]): string {
  if (!urls.length) return "unknown";
  // Extract ID from URL like "https://www.notion.so/55d0cc7bcaad45079c93aa17eb31622f"
  const id = urls[0].replace("https://www.notion.so/", "");
  return roastersByUrl[id] ?? "unknown";
}

function isoToDate(iso: string): string {
  return iso.split("T")[0];
}

type Roaster = {
  name: string;
  slug: string;
  location: string;
  website: string;
  notes: string;
  image_url: string;
};

const roasters: Roaster[] = [
  { name: "Docent", slug: "docent", location: "Atlanta, GA", website: "https://docentcoffee.com/", notes: "", image_url: "" },
  { name: "East Pole", slug: "east-pole", location: "Atlanta, GA", website: "https://eastpole.coffee/", notes: "", image_url: "" },
  { name: "Corvus Coffee Roasters", slug: "corvus-coffee-roasters", location: "Denver, CO", website: "https://www.corvuscoffee.com/", notes: "", image_url: "" },
  { name: "Huckleberry Coffee Roasters", slug: "huckleberry-coffee-roasters", location: "Denver, CO", website: "", notes: "", image_url: "" },
  { name: "Edison Coffee Co.", slug: "edison-coffee-co", location: "", website: "", notes: "", image_url: "" },
  { name: "Prodigal Coffee", slug: "prodigal-coffee", location: "", website: "", notes: "", image_url: "" },
  { name: "Onyx Coffee Lab", slug: "onyx-coffee-lab", location: "Rogers, AR", website: "https://onyxcoffeelab.com/", notes: "", image_url: "" },
  { name: "Central Market", slug: "central-market", location: "Austin, TX", website: "https://centralmarket.com/offers/in-house-roasted-coffee/", notes: "", image_url: "" },
  { name: "Civil Goat", slug: "civil-goat", location: "Austin, TX", website: "https://www.civilgoat.com/", notes: "", image_url: "" },
  { name: "Madrone Coffee Co.", slug: "madrone-coffee-co", location: "Austin, TX", website: "https://madronemountaincoffee.com/", notes: "", image_url: "" },
  { name: "Blue Copper", slug: "blue-copper", location: "Salt Lake City, UT", website: "https://www.bluecopperslc.com/", notes: "", image_url: "" },
  { name: "Bandit Coffee", slug: "bandit-coffee", location: "", website: "", notes: "", image_url: "" },
  { name: "Queen City Collective Coffee", slug: "queen-city-collective-coffee", location: "Denver, CO", website: "https://queencitycollectivecoffee.com/", notes: "", image_url: "" },
  { name: "Kiln", slug: "kiln", location: "Grand Junction, CO", website: "https://www.kilncoffeebar.com", notes: "", image_url: "" },
  { name: "Chrome Yellow", slug: "chrome-yellow", location: "", website: "", notes: "", image_url: "" },
  { name: "Equator Coffees", slug: "equator-coffees", location: "San Rafael, CA", website: "https://www.equatorcoffees.com/", notes: "", image_url: "" },
  { name: "Panther Coffee", slug: "panther-coffee", location: "Miami, FL", website: "https://www.panthercoffee.com/", notes: "", image_url: "" },
  { name: "Fulcrum Coffee", slug: "fulcrum-coffee", location: "Seattle, WA", website: "https://fulcrumcoffee.com/", notes: "", image_url: "" },
  { name: "MiddleState Coffee", slug: "middlestate-coffee", location: "Denver, CO", website: "https://www.middlestatecoffee.com/", notes: "", image_url: "" },
  { name: "Publik Coffee Roasters", slug: "publik-coffee-roasters", location: "Salt Lake City, UT", website: "https://www.publikcoffee.com/", notes: "", image_url: "" },
  { name: "Herkimer Coffee", slug: "herkimer-coffee", location: "Seattle, WA", website: "https://herkimercoffee.com/", notes: "", image_url: "" },
  { name: "Sweet Bloom Coffee Roasters", slug: "sweet-bloom-coffee-roasters", location: "Denver, CO", website: "https://sweetbloomcoffee.com/", notes: "", image_url: "" },
  { name: "Black Rifle Coffee Company", slug: "black-rifle-coffee-company", location: "", website: "", notes: "", image_url: "" },
  { name: "Methodical", slug: "methodical", location: "", website: "", notes: "", image_url: "" },
  { name: "RCB Roasters", slug: "rcb-roasters", location: "Austin, TX", website: "https://www.rcbroasters.com/", notes: "", image_url: "" },
  { name: "Pink Elephant Coffee Roasters", slug: "pink-elephant-coffee-roasters", location: "Park City, UT", website: "https://pinkelephantcoffee.com/", notes: "", image_url: "" },
  { name: "Medici Roasting", slug: "medici-roasting", location: "Austin, TX", website: "https://mediciroasting.com/", notes: "", image_url: "" },
  { name: "Merit", slug: "merit", location: "Austin, TX", website: "https://meritcoffee.com/", notes: "", image_url: "" },
  { name: "Bestslope Coffee Company", slug: "bestslope-coffee-company", location: "Fruita, CO", website: "https://bestslopecoffeeco.com/", notes: "", image_url: "" },
  { name: "Superthing Coffee", slug: "superthing-coffee", location: "Austin, TX", website: "https://superthingcoffee.com/", notes: "", image_url: "" },
  { name: "Roseline Coffee", slug: "roseline-coffee", location: "Portland, OR", website: "", notes: "", image_url: "" },
  { name: "Pablo's Coffee", slug: "pablos-coffee", location: "Denver, CO", website: "https://www.pabloscoffee.com/", notes: "", image_url: "" },
  { name: "Treeline Coffee Roasters", slug: "treeline-coffee-roasters", location: "", website: "", notes: "", image_url: "" },
  { name: "Stouthaus Coffee Roasters", slug: "stouthaus-coffee-roasters", location: "Austin, TX", website: "https://www.stouthauscoffee.com/", notes: "", image_url: "" },
];

type Bean = {
  name: string;
  slug: string;
  roaster_urls: string[];
  rating: number | null;
  origins: string[];
  flavors: string[];
  process: string | null;
  currently_brewing: boolean;
  price_12oz: number | null;
  notes: string;
  created: string;
};

// Beans data — 5 directly fetched (trusted) + 43 from agent
const beans: Bean[] = [
  // === 5 directly fetched from Notion (corrected) ===
  { name: "Conceit", slug: "conceit", roaster_urls: ["https://www.notion.so/55d0cc7bcaad45079c93aa17eb31622f"], rating: 5, origins: ["Ethiopia"], flavors: ["Fruity", "Sweet"], process: null, currently_brewing: false, price_12oz: 18, notes: "", created: "2022-02-23T01:28:14.979Z" },
  { name: "Cerro Ahuaca", slug: "cerro-ahuaca", roaster_urls: ["https://www.notion.so/5777a7d7a2cb42d9bbc3c820182a4350"], rating: null, origins: ["Ecuador"], flavors: ["Fruity", "Sweet", "Sour / Fermented"], process: "Washed", currently_brewing: false, price_12oz: null, notes: "", created: "2025-06-17T21:43:14.909Z" },
  { name: "Traffic", slug: "traffic", roaster_urls: ["https://www.notion.so/ccf240a6b42b4cbd9ec6fc98108bab11"], rating: null, origins: ["Columbia"], flavors: [], process: null, currently_brewing: false, price_12oz: null, notes: "", created: "2025-06-06T11:50:19.452Z" },
  { name: "AK Espresso", slug: "black-rifle-ak", roaster_urls: ["https://www.notion.so/16d0f79902a08005bf3df29169a4d246"], rating: 4, origins: ["Columbia", "Brazil"], flavors: ["Nutty / Cocoa"], process: null, currently_brewing: false, price_12oz: null, notes: "", created: "2024-12-31T19:02:56.979Z" },
  { name: "Methodical Ethiopia Bombe Abore", slug: "methodical-bombe-abore", roaster_urls: ["https://www.notion.so/20f0f79902a080f8b802d158eda70bd4"], rating: null, origins: ["Ethiopia"], flavors: [], process: "Natural", currently_brewing: false, price_12oz: null, notes: "", created: "2025-06-11T19:47:05.505Z" },

  // === Agent-fetched beans ===
  { name: "Kii Coffee Factory - AB", slug: "kii-coffee-factory", roaster_urls: ["https://www.notion.so/cb97578972544b029e91b9b9f8619109"], rating: null, origins: ["Kenya"], flavors: ["Sweet", "Fruity"], process: "Washed", currently_brewing: false, price_12oz: null, notes: "", created: "2024-01-29T17:18:22.748Z" },
  { name: "Dinkalem Ademe", slug: "dinkalem-ademe", roaster_urls: ["https://www.notion.so/ccf240a6b42b4cbd9ec6fc98108bab11"], rating: 4, origins: ["Ethiopia"], flavors: [], process: "Natural", currently_brewing: false, price_12oz: null, notes: "", created: "2025-03-07T14:39:55.958Z" },
  { name: "Tre Bukken", slug: "tre-bukken", roaster_urls: ["https://www.notion.so/990bfd7c397a4a40a53afd2cfca3cada"], rating: null, origins: ["Indonesia"], flavors: [], process: "Blend", currently_brewing: false, price_12oz: null, notes: "", created: "2025-06-06T11:48:43.857Z" },
  { name: "Montenegro Mara", slug: "montenegro-mara", roaster_urls: ["https://www.notion.so/5777a7d7a2cb42d9bbc3c820182a4350"], rating: 2, origins: ["Nicaragua"], flavors: [], process: "Washed", currently_brewing: false, price_12oz: null, notes: "", created: "2025-01-14T22:04:13.766Z" },
  { name: "Shakiso", slug: "shakiso", roaster_urls: ["https://www.notion.so/386ca1b4dd69438f8f08e5add886ad5f"], rating: 4, origins: ["Ethiopia"], flavors: ["Fruity"], process: "Natural", currently_brewing: false, price_12oz: 22, notes: "", created: "2024-08-05T13:15:04.432Z" },
  { name: "Orchard Thief", slug: "orchard-thief", roaster_urls: ["https://www.notion.so/990bfd7c397a4a40a53afd2cfca3cada"], rating: 4, origins: [], flavors: [], process: null, currently_brewing: false, price_12oz: null, notes: "", created: "2024-11-11T14:07:51.551Z" },
  { name: "Women Microlot", slug: "women-microlot", roaster_urls: ["https://www.notion.so/ccf240a6b42b4cbd9ec6fc98108bab11"], rating: 4, origins: ["Guatemala"], flavors: [], process: "Washed", currently_brewing: false, price_12oz: null, notes: "", created: "2025-02-20T00:09:09.615Z" },
  { name: "Counter Point", slug: "counter-point", roaster_urls: ["https://www.notion.so/17b0f79902a0802cac19ce77d09e7b1b"], rating: 5, origins: ["Columbia", "Ethiopia"], flavors: [], process: "Blend", currently_brewing: false, price_12oz: null, notes: "", created: "2025-01-14T22:05:41.435Z" },
  { name: "Fruity Espresso", slug: "prodigal-fruity", roaster_urls: ["https://www.notion.so/13476fbb4d4a4d02a7f74c706686940b"], rating: 4, origins: ["Columbia"], flavors: ["Fruity", "Sweet"], process: "Washed", currently_brewing: false, price_12oz: 21, notes: "", created: "2024-02-10T16:10:02.051Z" },
  { name: "Espresso Milk Blend", slug: "prodigal-espresso-milk-blend", roaster_urls: ["https://www.notion.so/13476fbb4d4a4d02a7f74c706686940b"], rating: 4, origins: ["Brazil", "Columbia"], flavors: [], process: null, currently_brewing: false, price_12oz: 14.5, notes: "", created: "2024-02-14T23:46:59.081Z" },
  { name: "Tigerwalk Espresso", slug: "tigerwalk", roaster_urls: ["https://www.notion.so/2be3ca1f6e254201961e993fac6a6011"], rating: 4, origins: ["Columbia", "Kenya", "Brazil"], flavors: ["Fruity", "Spices"], process: "Washed", currently_brewing: false, price_12oz: 16, notes: "", created: "2022-08-25T19:06:00.000Z" },
  { name: "West Coast Espresso", slug: "west-coast-espresso", roaster_urls: ["https://www.notion.so/df802acda8bc4d3caea3c1d19f58e61d"], rating: 4, origins: [], flavors: ["Sweet", "Nutty / Cocoa", "Fruity"], process: null, currently_brewing: false, price_12oz: 19, notes: "", created: "2023-01-26T19:55:50.987Z" },
  { name: "Phantom Limb Blend", slug: "phantom-limb", roaster_urls: ["https://www.notion.so/5777a7d7a2cb42d9bbc3c820182a4350"], rating: 4, origins: [], flavors: [], process: null, currently_brewing: false, price_12oz: 16.2, notes: "Really good blend for espresso", created: "2024-09-16T17:10:18.731Z" },
  { name: "Civitas Blend", slug: "civitas-blend", roaster_urls: ["https://www.notion.so/5777a7d7a2cb42d9bbc3c820182a4350"], rating: 3, origins: [], flavors: ["Nutty / Cocoa", "Roasted"], process: null, currently_brewing: false, price_12oz: 19, notes: "", created: "2024-07-16T13:41:31.321Z" },
  { name: "Holiday Blend", slug: "holiday-blend", roaster_urls: ["https://www.notion.so/545a0078864b4b07a8b0e55335bb0310", "https://www.notion.so/776bf767b99d43428b9a4e18ade986c7"], rating: 3, origins: ["Guatemala"], flavors: [], process: null, currently_brewing: false, price_12oz: 18, notes: "", created: "2022-02-23T01:28:14.979Z" },
  { name: "Moonrise", slug: "moonrise", roaster_urls: ["https://www.notion.so/cb97578972544b029e91b9b9f8619109"], rating: null, origins: [], flavors: ["Nutty / Cocoa"], process: null, currently_brewing: false, price_12oz: null, notes: "Fall blend. \u201cNotes of chocolate and blackberries to keep you warm as the crisp days of autumn shorten.\u201d", created: "2023-11-27T15:44:50.592Z" },
  { name: "Muhari - Natural", slug: "muhari", roaster_urls: ["https://www.notion.so/cb97578972544b029e91b9b9f8619109"], rating: null, origins: ["Rwanda"], flavors: [], process: "Natural", currently_brewing: false, price_12oz: null, notes: "", created: "2025-03-22T23:36:26.368Z" },
  { name: "Pink Bourbon Natural", slug: "pink-bourbon-natural", roaster_urls: ["https://www.notion.so/386ca1b4dd69438f8f08e5add886ad5f"], rating: 5, origins: ["Columbia"], flavors: ["Fruity"], process: "Natural", currently_brewing: false, price_12oz: 23, notes: "", created: "2024-04-30T14:01:46.707Z" },
  { name: "Costa Rica Las Lajas Natural", slug: "las-lajas-natural", roaster_urls: ["https://www.notion.so/79ef0e38ec9642d6ad517899d7114299"], rating: 4, origins: ["Costa Rica"], flavors: ["Fruity", "Sweet"], process: "Natural", currently_brewing: false, price_12oz: 24, notes: "", created: "2022-02-23T01:28:14.979Z" },
  { name: "Belafonte", slug: "belafonte", roaster_urls: ["https://www.notion.so/cb97578972544b029e91b9b9f8619109"], rating: null, origins: ["Columbia", "Ethiopia"], flavors: ["Nutty / Cocoa", "Fruity"], process: null, currently_brewing: false, price_12oz: null, notes: "columbia \u2192 washed. ethiopia \u2192 natural", created: "2024-01-29T17:19:28.601Z" },
  { name: "Beekeeper", slug: "beekeeper", roaster_urls: ["https://www.notion.so/789e7eeede58483f92ea9f4ff959dd76"], rating: 4, origins: ["Ethiopia", "Mexico"], flavors: ["Fruity", "Sweet"], process: null, currently_brewing: false, price_12oz: 18, notes: "Ethiopian part is naturally processed\nMexican part is washed", created: "2022-02-23T01:28:14.979Z" },
  { name: "Ethiopia Koke Honey", slug: "ethiopia-koke-honey", roaster_urls: ["https://www.notion.so/17b0f79902a0802cac19ce77d09e7b1b"], rating: 5, origins: ["Ethiopia"], flavors: [], process: null, currently_brewing: false, price_12oz: null, notes: "", created: "2025-01-14T22:07:14.108Z" },
  { name: "Ethiopia Buncho Honey", slug: "ethiopia-buncho-honey", roaster_urls: ["https://www.notion.so/51783d4de4f94c39bdc289803ad6632b"], rating: 3, origins: ["Ethiopia"], flavors: [], process: "Honey", currently_brewing: false, price_12oz: 20, notes: "", created: "2022-03-22T14:52:00.000Z" },
  { name: "Aricha Adorsi Ethiopia", slug: "aricha-adorsi", roaster_urls: ["https://www.notion.so/3958434b576144448a387075143d3908"], rating: null, origins: ["Ethiopia"], flavors: [], process: "Washed", currently_brewing: false, price_12oz: 22, notes: "", created: "2023-08-04T13:54:59.451Z" },
  { name: "Ethiopia Worka Sakaro", slug: "ethiopia-worka-sakaro", roaster_urls: ["https://www.notion.so/9b1c7624365c424591180a319dd0f902"], rating: 3, origins: ["Ethiopia"], flavors: [], process: null, currently_brewing: false, price_12oz: 10.5, notes: "", created: "2022-04-04T01:15:00.000Z" },
  { name: "Ethiopia Negusse Nare Bombe", slug: "negusse-nare-bombe", roaster_urls: ["https://www.notion.so/79ef0e38ec9642d6ad517899d7114299"], rating: 4, origins: ["Ethiopia"], flavors: ["Fruity", "Nutty / Cocoa"], process: "Natural", currently_brewing: false, price_12oz: 23, notes: "", created: "2022-02-23T01:28:14.979Z" },
  { name: "Wenago Ethiopia Yirgacheffe", slug: "wenago", roaster_urls: ["https://www.notion.so/37ba35a051ab485a95350208d70162a0"], rating: 3, origins: ["Ethiopia"], flavors: [], process: null, currently_brewing: false, price_12oz: null, notes: "", created: "2023-04-17T13:29:34.576Z" },
  { name: "Civil Goat Ethiopia Yirgacheffe", slug: "ethipia-yirgacheffe", roaster_urls: ["https://www.notion.so/fb89e57b8b1b4aaeacb2ab6b77fcf1f9"], rating: 4, origins: ["Ethiopia"], flavors: ["Floral", "Fruity"], process: "Washed", currently_brewing: false, price_12oz: 14, notes: "", created: "2022-07-28T18:01:00.000Z" },
  { name: "Guatemala Los Encinos", slug: "los-encinos", roaster_urls: ["https://www.notion.so/fb89e57b8b1b4aaeacb2ab6b77fcf1f9"], rating: 5, origins: ["Guatemala"], flavors: ["Fruity", "Nutty / Cocoa"], process: "Washed", currently_brewing: false, price_12oz: 13.5, notes: "", created: "2022-06-29T22:42:00.000Z" },
  { name: "Guatemala Huehuetenango", slug: "kiln-huehuetenango", roaster_urls: ["https://www.notion.so/545a0078864b4b07a8b0e55335bb0310"], rating: 3, origins: ["Guatemala"], flavors: [], process: null, currently_brewing: false, price_12oz: 16, notes: "", created: "2022-02-23T01:28:14.979Z" },
  { name: "Guatemala Pixquin", slug: "pixquin", roaster_urls: ["https://www.notion.so/860a32af2dee4e8782a8e4d9f971867d"], rating: null, origins: ["Guatemala"], flavors: ["Sour / Fermented", "Fruity", "Green / Vegetative"], process: "Natural", currently_brewing: false, price_12oz: 16, notes: "", created: "2023-08-09T17:24:36.193Z" },
  { name: "Bumba Honey", slug: "bumba-honey", roaster_urls: ["https://www.notion.so/5777a7d7a2cb42d9bbc3c820182a4350"], rating: null, origins: ["Burundi"], flavors: [], process: "Honey", currently_brewing: false, price_12oz: 24, notes: "", created: "2023-06-15T00:31:04.114Z" },
  { name: "Las Guas", slug: "prodigal-las-guas", roaster_urls: ["https://www.notion.so/13476fbb4d4a4d02a7f74c706686940b"], rating: 4, origins: ["Ecuador"], flavors: ["Fruity", "Sweet"], process: "Washed", currently_brewing: false, price_12oz: 18, notes: "", created: "2024-02-14T23:48:33.225Z" },
  { name: "La Nueva Montana", slug: "la-nueva-montana", roaster_urls: ["https://www.notion.so/386ca1b4dd69438f8f08e5add886ad5f"], rating: null, origins: ["Guatemala"], flavors: [], process: "Natural", currently_brewing: false, price_12oz: null, notes: "", created: "2025-04-08T14:53:15.585Z" },
  { name: "Maravilla La Cumbre", slug: "maravilla-la-cumbre", roaster_urls: ["https://www.notion.so/990bfd7c397a4a40a53afd2cfca3cada"], rating: 4, origins: ["Guatemala"], flavors: ["Nutty / Cocoa"], process: "Washed", currently_brewing: false, price_12oz: null, notes: "", created: "2025-01-10T21:11:01.243Z" },
  { name: "Gesha Reckoning", slug: "gesha-reckoning", roaster_urls: ["https://www.notion.so/990bfd7c397a4a40a53afd2cfca3cada"], rating: 4, origins: [], flavors: [], process: null, currently_brewing: false, price_12oz: null, notes: "", created: "2024-11-11T14:08:33.911Z" },
  { name: "Exotic Pink Bourbon EF2", slug: "exotic-pink-bourbon", roaster_urls: ["https://www.notion.so/990bfd7c397a4a40a53afd2cfca3cada"], rating: 2, origins: ["Columbia"], flavors: ["Fruity", "Nutty / Cocoa"], process: "Natural", currently_brewing: false, price_12oz: 26, notes: "", created: "2022-02-23T01:28:14.979Z" },
  { name: "Fabian Acevedo Pink Bourbon", slug: "fabian-acevedo-pink-bourbon", roaster_urls: ["https://www.notion.so/ccf240a6b42b4cbd9ec6fc98108bab11"], rating: null, origins: ["Columbia"], flavors: [], process: "Washed", currently_brewing: false, price_12oz: null, notes: "", created: "2025-04-29T13:26:24.354Z" },
  { name: "Pueblo Libre Peru", slug: "pueblo-libre", roaster_urls: ["https://www.notion.so/3958434b576144448a387075143d3908"], rating: null, origins: ["Peru"], flavors: [], process: "Washed", currently_brewing: false, price_12oz: 22, notes: "", created: "2023-08-04T13:52:56.492Z" },
  { name: "Madrone Select - Rwanda", slug: "madrone-select-rwanda", roaster_urls: ["https://www.notion.so/d3684c9f62364eaeb5cb11a5658df64c"], rating: 3, origins: ["Rwanda"], flavors: [], process: "Natural", currently_brewing: false, price_12oz: null, notes: "", created: "2022-06-01T19:00:00.000Z" },
  { name: "Tropical Weather", slug: "tropical-weather", roaster_urls: ["https://www.notion.so/79ef0e38ec9642d6ad517899d7114299"], rating: 4, origins: ["Ethiopia"], flavors: ["Fruity", "Sweet"], process: null, currently_brewing: false, price_12oz: 20, notes: "", created: "2022-02-23T01:28:14.979Z" },
  { name: "Coconut Lemonade", slug: "coconut-lemonade", roaster_urls: ["https://www.notion.so/386ca1b4dd69438f8f08e5add886ad5f"], rating: 3, origins: ["Columbia"], flavors: ["Fruity", "Sour / Fermented"], process: null, currently_brewing: false, price_12oz: 23, notes: "co-fermented with citrus, coconut, molasses, and sugar", created: "2024-04-30T14:03:29.236Z" },
  { name: "Guatamala Huehuetenango", slug: "pink-elephant-huehuetenango", roaster_urls: ["https://www.notion.so/a9f3d8a0c17445e1967d127e3f528427"], rating: 2, origins: ["Guatemala"], flavors: ["Fruity", "Nutty / Cocoa"], process: "Washed", currently_brewing: false, price_12oz: 18, notes: "", created: "2022-02-23T01:28:14.979Z" },
  { name: "West Arsi - Werka", slug: "west-arsi-werka", roaster_urls: ["https://www.notion.so/cb97578972544b029e91b9b9f8619109"], rating: 3, origins: ["Ethiopia"], flavors: ["Fruity", "Sour / Fermented"], process: "Natural", currently_brewing: false, price_12oz: null, notes: "", created: "2023-10-25T13:51:38.440Z" },
  { name: "Monarch", slug: "monarch", roaster_urls: ["https://www.notion.so/79ef0e38ec9642d6ad517899d7114299"], rating: 5, origins: ["Ethiopia", "Columbia"], flavors: ["Nutty / Cocoa", "Sweet"], process: null, currently_brewing: false, price_12oz: null, notes: "", created: "2022-06-30T14:45:00.000Z" },
  { name: "Catapult", slug: "catapult", roaster_urls: ["https://www.notion.so/6899cf7318064dd188721de87418c272"], rating: 4, origins: ["Ethiopia", "Honduras"], flavors: ["Nutty / Cocoa", "Fruity"], process: "Washed", currently_brewing: false, price_12oz: 19.5, notes: "", created: "2024-05-21T17:53:48.490Z" },
  { name: "Frequency", slug: "frequency", roaster_urls: ["https://www.notion.so/386ca1b4dd69438f8f08e5add886ad5f"], rating: 5, origins: ["Costa Rica", "Guatemala"], flavors: ["Fruity"], process: null, currently_brewing: false, price_12oz: 18, notes: "", created: "2024-06-29T19:47:13.907Z" },
  { name: "Yirgacheffe Fosan", slug: "yirgacheffe-fosan", roaster_urls: ["https://www.notion.so/cb97578972544b029e91b9b9f8619109"], rating: null, origins: ["Ethiopia"], flavors: [], process: "Washed", currently_brewing: false, price_12oz: null, notes: "", created: "2025-03-22T23:38:13.050Z" },
  { name: "Madrone Select - Nicaragua", slug: "madrone-select-nicaragua", roaster_urls: ["https://www.notion.so/d3684c9f62364eaeb5cb11a5658df64c"], rating: 2, origins: ["Nicaragua"], flavors: [], process: null, currently_brewing: false, price_12oz: 20, notes: "Nicaragua. Los Pedernales. Jinotega", created: "2022-07-19T20:47:00.000Z" },
  { name: "El Salvador", slug: "el-salvador", roaster_urls: ["https://www.notion.so/6ea6a923be504624b739af928f424cbc"], rating: 3, origins: ["El Salvador"], flavors: ["Fruity", "Nutty / Cocoa"], process: null, currently_brewing: false, price_12oz: 20, notes: "", created: "2022-02-23T01:28:14.979Z" },
  { name: "Congo Muungano", slug: "congo-muungano", roaster_urls: ["https://www.notion.so/009b7d829b1041d9bd0713143f1d3a32"], rating: 3, origins: ["Congo"], flavors: [], process: "Natural", currently_brewing: false, price_12oz: 16, notes: "", created: "2022-02-23T01:28:14.979Z" },
  { name: "Dead Reckoning", slug: "dead-reckoning", roaster_urls: ["https://www.notion.so/990bfd7c397a4a40a53afd2cfca3cada"], rating: 4, origins: ["Ethiopia", "Guatemala", "Columbia"], flavors: [], process: "Blend", currently_brewing: false, price_12oz: null, notes: "", created: "2025-05-06T12:59:28.388Z" },
  { name: "Nano Genji", slug: "nano-genji", roaster_urls: ["https://www.notion.so/45bce8e8d84f4981b5f3daf68fba6a21"], rating: null, origins: ["Ethiopia"], flavors: [], process: "Washed", currently_brewing: false, price_12oz: null, notes: "", created: "2025-03-17T17:29:24.202Z" },
];

async function main() {
  await mkdir(join(HOBBIES_DIR, "beans"), { recursive: true });
  await mkdir(join(HOBBIES_DIR, "roasters"), { recursive: true });

  // Write roaster files
  for (const r of roasters) {
    const data: Record<string, unknown> = {
      name: r.name,
      slug: r.slug,
      location: r.location,
      website: r.website,
      notes: r.notes,
      image_url: r.image_url,
    };
    const yaml = stringify(data, { lineWidth: 0 });
    await writeFile(join(HOBBIES_DIR, "roasters", `${r.slug}.yaml`), yaml);
  }
  console.log(`Wrote ${roasters.length} roaster files`);

  // Write bean files
  for (const b of beans) {
    const singleOrigin = b.origins.length === 1;
    const data: Record<string, unknown> = {
      name: b.name,
      slug: b.slug,
      roaster: resolveRoaster(b.roaster_urls),
      rating: b.rating,
      origins: b.origins,
      flavors: b.flavors,
      process: b.process ?? "",
      single_origin: singleOrigin,
      currently_brewing: b.currently_brewing,
      price_12oz: b.price_12oz,
      notes: b.notes,
      image_url: "",
      created: isoToDate(b.created),
    };
    const yaml = stringify(data, { lineWidth: 0 });
    await writeFile(join(HOBBIES_DIR, "beans", `${b.slug}.yaml`), yaml);
  }
  console.log(`Wrote ${beans.length} bean files`);
}

main();
