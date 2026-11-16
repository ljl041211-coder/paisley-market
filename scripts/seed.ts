// Fills the database with demonstration data: two markets, their pitches,
// a set of trader applications at different stages, and one organiser account.
//
//   npm run seed            adds the data if the database is empty
//   npm run seed -- --reset deletes everything first, then adds the data
//
// Every trader below is invented for the demonstration.
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { pathToFileURL } from "node:url";
import type { ApplicationStatus, PriceBand } from "../app/lib/constants";
import { connectDb } from "../app/lib/db.server";
import { loadEnv } from "../app/lib/env.server";
import { Application, Market, Pitch, User } from "../app/lib/models.server";

const DAY = 24 * 60 * 60 * 1000;
const day = (iso: string, time = "12:00:00") => new Date(`${iso}T${time}Z`);

interface SeedApplication {
  reference: string;
  businessName: string;
  contactName: string;
  email: string;
  category: string;
  description: string;
  priceBand: PriceBand;
  stallType: string;
  needsPower?: boolean;
  foodHygieneNumber?: string;
  website?: string;
  status: ApplicationStatus;
  pitch?: string;
  publicListing?: boolean;
  note?: string;
  deletionRequested?: boolean;
}

const christmasApplications: SeedApplication[] = [
  {
    reference: "PCM-SEED01",
    businessName: "Die Glühwein Hütte",
    contactName: "Greta Lindqvist",
    email: "greta@example.com",
    category: "Food & drink",
    description:
      "Mulled wine made to a family recipe from the Mosel, plus alcohol-free Kinderpunsch, served in a keepsake mug.",
    priceBand: "under-10",
    stallType: "food",
    needsPower: true,
    foodHygieneNumber: "RC-FB-20418",
    status: "approved",
    pitch: "A1",
    publicListing: true,
  },
  {
    reference: "PCM-SEED02",
    businessName: "Bratwurst am Abbey",
    contactName: "Jonas Keller",
    email: "jonas@example.com",
    category: "Food & drink",
    description:
      "Thuringian-style bratwurst grilled over beech charcoal, with fried onions, curry sauce and fresh rolls.",
    priceBand: "under-10",
    stallType: "food",
    needsPower: true,
    foodHygieneNumber: "RC-FB-20977",
    status: "approved",
    pitch: "A2",
    publicListing: true,
  },
  {
    reference: "PCM-SEED03",
    businessName: "Renfrewshire Roasted Chestnuts",
    contactName: "Callum Baird",
    email: "callum@example.com",
    category: "Food & drink",
    description: "Hot chestnuts and sugar-roasted almonds by the bag, roasted on site every day.",
    priceBand: "under-10",
    stallType: "food",
    needsPower: true,
    foodHygieneNumber: "RC-FB-18802",
    status: "approved",
    pitch: "A4",
    publicListing: true,
  },
  {
    reference: "PCM-SEED04",
    businessName: "The Lebkuchen Bakehouse",
    contactName: "Ines Hoffmann",
    email: "ines@example.com",
    category: "Food & drink",
    description:
      "Hand-iced gingerbread hearts, stollen and spiced biscuits baked in small batches. Names iced while you wait.",
    priceBand: "under-10",
    stallType: "food",
    needsPower: true,
    foodHygieneNumber: "RC-FB-21550",
    website: "https://lebkuchen-bakehouse.example",
    status: "approved",
    pitch: "A5",
    publicListing: true,
  },
  {
    reference: "PCM-SEED05",
    businessName: "Thistle & Tannenbaum",
    contactName: "Fiona Drummond",
    email: "fiona@example.com",
    category: "Christmas decorations",
    description:
      "Hand-blown glass baubles and carved wooden tree ornaments, each one boxed and ready to give.",
    priceBand: "10-25",
    stallType: "chalet",
    status: "approved",
    pitch: "B1",
    publicListing: true,
  },
  {
    reference: "PCM-SEED06",
    businessName: "Paisley Pattern Scarves",
    contactName: "Amara Okafor",
    email: "amara@example.com",
    category: "Clothing & textiles",
    description:
      "Wool and silk scarves woven with the teardrop pattern the town gave its name to.",
    priceBand: "25-50",
    stallType: "chalet",
    website: "https://paisley-pattern-scarves.example",
    status: "approved",
    pitch: "B2",
    publicListing: true,
  },
  {
    reference: "PCM-SEED07",
    businessName: "Wee Wooden Toy Workshop",
    contactName: "Hamish Rennie",
    email: "hamish@example.com",
    category: "Gifts & toys",
    description:
      "Pull-along animals, puzzles and spinning tops turned from Scottish beech and finished with child-safe oils.",
    priceBand: "10-25",
    stallType: "chalet",
    status: "approved",
    pitch: "B4",
    publicListing: true,
  },
  {
    reference: "PCM-SEED08",
    businessName: "Candle Close",
    contactName: "Priya Nair",
    email: "priya@example.com",
    category: "Handmade crafts",
    description:
      "Soy candles poured in Paisley in winter scents: clove orange, pine resin and peat smoke.",
    priceBand: "10-25",
    stallType: "chalet",
    status: "approved",
    pitch: "B5",
    publicListing: true,
  },
  {
    reference: "PCM-SEED09",
    businessName: "Glen Gryffe Ceramics",
    contactName: "Eilidh Murray",
    email: "eilidh@example.com",
    category: "Handmade crafts",
    description:
      "Stoneware mugs, bowls and tree decorations thrown and glazed in a one-woman studio.",
    priceBand: "25-50",
    stallType: "stall",
    status: "approved",
    pitch: "C2",
    publicListing: true,
  },
  {
    // Approved, but did not agree to the public list: the map shows the
    // pitch as allocated without naming the business.
    reference: "PCM-SEED10",
    businessName: "Abbey Bell Silver",
    contactName: "Tomasz Zielinski",
    email: "tomasz@example.com",
    category: "Gifts & toys",
    description:
      "Sterling silver jewellery cast from wax carvings of thistles, snowflakes and the abbey's stonework.",
    priceBand: "over-50",
    stallType: "chalet",
    status: "approved",
    pitch: "B7",
    publicListing: false,
  },
  {
    reference: "PCM-SEED11",
    businessName: "Hot Chocolate Hut",
    contactName: "Sofia Marino",
    email: "sofia@example.com",
    category: "Food & drink",
    description:
      "Thick Italian-style hot chocolate with whipped cream, toasted marshmallows and a choice of six toppings.",
    priceBand: "under-10",
    stallType: "food",
    needsPower: true,
    foodHygieneNumber: "RC-FB-22013",
    status: "submitted",
    publicListing: true,
  },
  {
    reference: "PCM-SEED12",
    businessName: "Knit One Purl Paisley",
    contactName: "Margaret Sinclair",
    email: "margaret@example.com",
    category: "Clothing & textiles",
    description: "Hand-knitted hats, mittens and socks in undyed Shetland wool.",
    priceBand: "10-25",
    stallType: "stall",
    status: "submitted",
    publicListing: true,
  },
  {
    reference: "PCM-SEED13",
    businessName: "Cartside Soap Co",
    contactName: "Daniel Whyte",
    email: "daniel@example.com",
    category: "Handmade crafts",
    description: "Cold-process soaps and bath salts scented with juniper, cedar and winter spice.",
    priceBand: "under-10",
    stallType: "stall",
    status: "submitted",
    publicListing: false,
    deletionRequested: true,
  },
  {
    reference: "PCM-SEED14",
    businessName: "Raclette on the Close",
    contactName: "Luc Favre",
    email: "luc@example.com",
    category: "Food & drink",
    description:
      "Alpine raclette cheese melted to order over new potatoes, pickles and cured ham.",
    priceBand: "10-25",
    stallType: "food",
    needsPower: true,
    foodHygieneNumber: "RC-FB-19340",
    status: "waitlisted",
    publicListing: true,
    note: "Food chalets with extraction are fully requested. You are first on the waiting list.",
  },
  {
    reference: "PCM-SEED15",
    businessName: "Phone Case Kingdom",
    contactName: "Ryan Cooper",
    email: "ryan@example.com",
    category: "Gifts & toys",
    description: "Printed phone cases, chargers and screen protectors for every make of phone.",
    priceBand: "10-25",
    stallType: "stall",
    status: "rejected",
    publicListing: true,
    note: "This market is for handmade and seasonal goods, so mass-produced accessories do not fit this year's selection.",
  },
];

const springApplications: SeedApplication[] = [
  {
    reference: "PSMM-SEED01",
    businessName: "Sma' Shot Prints",
    contactName: "Niamh Gallagher",
    email: "niamh@example.com",
    category: "Handmade crafts",
    description: "Lino and screen prints of Paisley mills, closes and tenements, printed by hand.",
    priceBand: "10-25",
    stallType: "stall",
    status: "approved",
    pitch: "B2",
    publicListing: true,
  },
  {
    reference: "PSMM-SEED02",
    businessName: "Gleniffer Honey",
    contactName: "Alasdair Boyd",
    email: "alasdair@example.com",
    category: "Food & drink",
    description: "Raw heather and blossom honey from hives on the Gleniffer Braes.",
    priceBand: "under-10",
    stallType: "food",
    foodHygieneNumber: "RC-FB-17266",
    status: "approved",
    pitch: "A3",
    publicListing: true,
  },
  {
    reference: "PSMM-SEED03",
    businessName: "Seedling Swap Table",
    contactName: "Joyce Adeyemi",
    email: "joyce@example.com",
    category: "Plants & garden",
    description: "Vegetable seedlings, herb pots and wildflower seed mixes raised in peat-free compost.",
    priceBand: "under-10",
    stallType: "stall",
    status: "submitted",
    publicListing: true,
  },
];

function row(letter: string, count: number, y: number, stallType: string, power: (n: number) => boolean) {
  const width = 100;
  const gap = 10;
  const left = (1000 - (count * width + (count - 1) * gap)) / 2;
  return Array.from({ length: count }, (_, i) => ({
    code: `${letter}${i + 1}`,
    zone: `Row ${letter}`,
    stallType,
    hasPower: power(i + 1),
    x: left + i * (width + gap),
    y,
    w: width,
    h: 84,
  }));
}

async function addApplications(
  marketId: mongoose.Types.ObjectId,
  marketEnd: Date,
  applications: SeedApplication[],
) {
  const now = Date.now();
  for (const [index, a] of applications.entries()) {
    const submittedAt = new Date(now - (applications.length - index + 2) * DAY);
    const decidedAt = new Date(submittedAt.getTime() + DAY);
    const history: { status: ApplicationStatus; at: Date; by: string; note: string }[] = [
      { status: "submitted", at: submittedAt, by: "Trader", note: "Application submitted online" },
    ];
    if (a.status !== "submitted") {
      history.push({ status: a.status, at: decidedAt, by: "Morag Fraser", note: a.note ?? "" });
    }
    const application = await Application.create({
      market: marketId,
      reference: a.reference,
      businessName: a.businessName,
      contactName: a.contactName,
      email: a.email,
      phone: `07700 900${String(100 + index)}`, // numbers reserved for TV and radio drama
      website: a.website ?? "",
      category: a.category,
      description: a.description,
      priceBand: a.priceBand,
      stallType: a.stallType,
      needsPower: a.needsPower ?? false,
      foodHygieneNumber: a.foodHygieneNumber ?? "",
      status: a.status,
      consent: {
        privacyAcceptedAt: submittedAt,
        publicListing: a.publicListing ?? false,
        marketing: index % 3 === 0,
      },
      history,
      deletionRequestedAt: a.deletionRequested ? new Date(now - DAY) : null,
      retainUntil: new Date(marketEnd.getTime() + 365 * DAY),
      createdAt: submittedAt,
    });
    if (a.pitch) {
      await Pitch.updateOne({ market: marketId, code: a.pitch }, { $set: { application: application._id } });
    }
  }
}

export async function seedDatabase({ reset }: { reset: boolean }): Promise<"seeded" | "skipped"> {
  await connectDb();

  if (reset) {
    await Promise.all([
      Market.deleteMany({}),
      Pitch.deleteMany({}),
      Application.deleteMany({}),
      User.deleteMany({}),
    ]);
  } else if ((await Market.countDocuments()) > 0) {
    return "skipped";
  }

  const christmas = await Market.create({
    slug: "paisley-christmas-market",
    name: "Paisley Christmas Market",
    tagline:
      "Four weeks of German-style chalets, Glühwein and handmade gifts in the shadow of Paisley Abbey.",
    description:
      "For its first year, Paisley Christmas Market brings twenty-four timber chalets and stalls to Abbey Close. Expect bratwurst from the grill, gingerbread iced with your name, and makers from across Renfrewshire selling things you will not find on the high street.\n\nThe market is free to enter and step-free throughout. Come after work for a mug of something hot under the lights, or bring the family at the weekend.",
    venue: "Abbey Close",
    address: "Paisley PA1 1JG",
    startDate: day("2027-11-26"),
    endDate: day("2027-12-23"),
    openingHours: "Sunday to Thursday 11am to 8pm, Friday and Saturday 11am to 10pm",
    applicationsOpen: day("2026-11-01", "00:00:00"),
    applicationsClose: day("2027-03-31", "22:59:59"),
    announcement: "",
    featured: true,
    theme: { brand: "#b3202e", ground: "#12382e", accent: "#f2c14e" },
    categories: [
      { name: "Food & drink", isFood: true },
      { name: "Handmade crafts", isFood: false },
      { name: "Gifts & toys", isFood: false },
      { name: "Clothing & textiles", isFood: false },
      { name: "Christmas decorations", isFood: false },
    ],
    stallTypes: [
      {
        key: "food",
        label: "Food chalet",
        size: "4 m x 2.5 m",
        price: 720,
        description: "Timber chalet with power, water and a serving hatch for hot food and drink.",
      },
      {
        key: "chalet",
        label: "Wooden chalet",
        size: "3 m x 2 m",
        price: 480,
        description: "Lockable timber chalet with lighting, for the full four weeks.",
      },
      {
        key: "stall",
        label: "Open stall",
        size: "3 m x 3 m",
        price: 260,
        description: "Covered table stall, suited to craft and weekend traders.",
      },
    ],
  });
  await Pitch.insertMany(
    [
      ...row("A", 8, 70, "food", () => true),
      ...row("B", 8, 220, "chalet", (n) => n % 2 === 1),
      ...row("C", 8, 370, "stall", () => false),
    ].map((pitch) => ({ ...pitch, market: christmas._id, application: null })),
  );
  await addApplications(christmas._id, christmas.endDate, christmasApplications);

  const spring = await Market.create({
    slug: "paisley-spring-makers-market",
    name: "Paisley Spring Makers Market",
    tagline: "A weekend of local makers, growers and bakers in County Square.",
    description:
      "Two days of stalls from people who make, grow and bake within twenty miles of Paisley. Pick up seedlings for the garden, a print for the hall and something sweet for the walk home.",
    venue: "County Square",
    address: "Paisley PA1 1BN",
    startDate: day("2027-04-17"),
    endDate: day("2027-04-18"),
    openingHours: "Saturday and Sunday 10am to 5pm",
    applicationsOpen: day("2026-11-01", "00:00:00"),
    applicationsClose: day("2027-02-28", "22:59:59"),
    announcement: "",
    featured: false,
    theme: { brand: "#1f7a4d", ground: "#ffe9a8", accent: "#7c2d7a" },
    categories: [
      { name: "Food & drink", isFood: true },
      { name: "Handmade crafts", isFood: false },
      { name: "Plants & garden", isFood: false },
      { name: "Clothing & textiles", isFood: false },
    ],
    stallTypes: [
      {
        key: "food",
        label: "Food pitch",
        size: "4 m x 3 m",
        price: 95,
        description: "Space for a food stall or small trailer, with power nearby.",
      },
      {
        key: "stall",
        label: "Covered stall",
        size: "3 m x 3 m",
        price: 60,
        description: "A covered table stall for the whole weekend.",
      },
    ],
  });
  await Pitch.insertMany(
    [...row("A", 6, 120, "food", () => true), ...row("B", 6, 300, "stall", () => false)].map(
      (pitch) => ({ ...pitch, market: spring._id, application: null }),
    ),
  );
  await addApplications(spring._id, spring.endDate, springApplications);

  const email = (process.env.ADMIN_EMAIL ?? "organiser@marktplatz.example").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "Abbey-Close-Chalets-27";
  await User.create({
    name: "Morag Fraser",
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: "admin",
  });

  return "seeded";
}

// Runs only when this file is started directly (npm run seed), not when
// another script imports seedDatabase from it.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  loadEnv();
  const reset = process.argv.includes("--reset");
  try {
    const outcome = await seedDatabase({ reset });
    console.log(
      outcome === "seeded"
        ? "Demonstration data added. Organiser sign-in details are in .env.example."
        : "The database already has data, so nothing was changed. Use `npm run seed -- --reset` to replace it.",
    );
  } catch (error) {
    console.error("Seeding failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
