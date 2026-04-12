import "dotenv/config";
import { db, categoriesTable, productsTable } from "./index";

const categories = [
  { name: "Welding Wire & Rod", slug: "welding-wire-rod", description: "MIG wire, TIG rod, stick electrodes for all welding processes", imageUrl: null },
  { name: "Welding Helmets & Safety", slug: "welding-helmets-safety", description: "Auto-darkening helmets, welding gloves, jackets, and protective gear", imageUrl: null },
  { name: "Grinders & Cutting", slug: "grinders-cutting", description: "Angle grinders, cut-off wheels, flap discs, and abrasive tools", imageUrl: null },
  { name: "Clamps & Magnets", slug: "clamps-magnets", description: "Welding clamps, magnetic squares, stronghand tools, and fixturing", imageUrl: null },
  { name: "Sheet Metal & Plate", slug: "sheet-metal-plate", description: "Steel sheet, aluminum plate, expanded mesh, and structural stock", imageUrl: null },
  { name: "Gas & Regulators", slug: "gas-regulators", description: "Regulators, hoses, gas lenses, and accessories for shielding gas", imageUrl: null },
];

const products = [
  // Welding Wire & Rod
  { name: "ER70S-6 MIG Wire 0.030\" 11lb Spool", slug: "er70s-6-mig-wire-030-11lb", description: "Premium copper-coated ER70S-6 MIG wire. Excellent for mild steel, produces smooth welds with minimal spatter.", price: 28.99, sku: "WW-ER70S6-030", stockQty: 85, lowStockThreshold: 15, categorySlug: "welding-wire-rod", featured: true, specs: '{"diameter":"0.030\\"","weight":"11 lb","tensile_strength":"70,000 psi","process":"MIG/GMAW"}' },
  { name: "ER70S-6 MIG Wire 0.035\" 11lb Spool", slug: "er70s-6-mig-wire-035-11lb", description: "0.035\" ER70S-6 MIG wire for thicker mild steel. High silicon content for better puddle fluidity.", price: 29.99, sku: "WW-ER70S6-035", stockQty: 72, lowStockThreshold: 15, categorySlug: "welding-wire-rod", featured: false, specs: '{"diameter":"0.035\\"","weight":"11 lb","process":"MIG/GMAW"}' },
  { name: "ER4043 Aluminum MIG Wire 0.035\" 1lb", slug: "er4043-aluminum-mig-wire-035", description: "Silicon-aluminum alloy MIG wire for welding 4xxx and 6xxx series aluminum alloys.", price: 24.50, sku: "WW-ER4043-035", stockQty: 40, lowStockThreshold: 10, categorySlug: "welding-wire-rod", featured: false, specs: '{"alloy":"4043","diameter":"0.035\\"","weight":"1 lb"}' },
  { name: "ER308L TIG Rods 1/16\" 36\" 1lb Pack", slug: "er308l-tig-rod-116", description: "Stainless steel TIG rods for 304/308 grade stainless. Low carbon to minimize carbide precipitation.", price: 18.75, sku: "WW-ER308L-116", stockQty: 55, lowStockThreshold: 10, categorySlug: "welding-wire-rod", featured: false, specs: '{"alloy":"308L","diameter":"1/16\\"","length":"36\\"","weight":"1 lb"}' },

  // Welding Helmets & Safety
  { name: "Auto-Darkening Welding Helmet 9-13 Shade", slug: "auto-darkening-helmet-9-13", description: "Large 3.86x2.71 viewing area, 1/25,000s reaction time, shade 9-13 adjustable. Solar + battery powered.", price: 89.99, sku: "HS-ADH-913", stockQty: 22, lowStockThreshold: 5, categorySlug: "welding-helmets-safety", featured: true, specs: '{"viewing_area":"3.86x2.71\\"","reaction_time":"1/25000s","shade_range":"9-13","power":"Solar+Battery"}' },
  { name: "Leather Welding Gloves TIG Grade", slug: "tig-welding-gloves", description: "Goatskin leather TIG gloves with split-hide back. Superior feel and dexterity for precision TIG work.", price: 22.99, sku: "HS-GLOV-TIG", stockQty: 60, lowStockThreshold: 12, categorySlug: "welding-helmets-safety", featured: false, specs: '{"material":"Goatskin","style":"TIG","sizes":"S,M,L,XL"}' },
  { name: "FR Cotton Welding Jacket", slug: "fr-cotton-welding-jacket", description: "9oz flame-resistant cotton jacket. 30\" length, snap closure, inner sleeve protection. OSHA compliant.", price: 64.95, sku: "HS-JACK-FRC", stockQty: 18, lowStockThreshold: 5, categorySlug: "welding-helmets-safety", featured: false, specs: '{"material":"FR Cotton 9oz","length":"30\\"","compliance":"OSHA 1910.269"}' },

  // Grinders & Cutting
  { name: "4-1/2\" Angle Grinder 11A Corded", slug: "angle-grinder-4-5-11a", description: "11 amp, 11,000 RPM corded angle grinder. Includes side handle, guard, and 4.5\" grinding disc.", price: 74.99, sku: "GC-AG45-11A", stockQty: 14, lowStockThreshold: 5, categorySlug: "grinders-cutting", featured: true, specs: '{"amps":"11A","rpm":"11,000","disc_size":"4.5\\"","weight":"4.8 lbs"}' },
  { name: "Cut-Off Wheels 4-1/2\" x 0.040\" Box of 25", slug: "cutoff-wheels-4-5-box25", description: "Type 1 thin cut-off wheels for metal, stainless, and aluminum. 13,300 RPM max. Minimal burr.", price: 19.99, sku: "GC-COW-45-25", stockQty: 95, lowStockThreshold: 20, categorySlug: "grinders-cutting", featured: false, specs: '{"size":"4.5x0.040\\"","qty":"25","max_rpm":"13,300","material":"Metal/SS/Al"}' },
  { name: "Flap Disc 4-1/2\" 40 Grit T27 Box of 10", slug: "flap-disc-4-5-40grit-box10", description: "Zirconia alumina flap discs, Type 27, 40 grit. Long life, aggressive cut on weld seams and scale.", price: 32.50, sku: "GC-FD45-40", stockQty: 48, lowStockThreshold: 10, categorySlug: "grinders-cutting", featured: false, specs: '{"size":"4.5\\"","grit":"40","type":"T27","qty":"10","abrasive":"Zirconia Alumina"}' },

  // Clamps & Magnets
  { name: "5-in-1 Welding Clamp 11\"", slug: "welding-clamp-5in1-11", description: "Locking welding clamp, 11\" reach, 5 positions. Ground clamp, F-clamp, and pipe clamp in one tool.", price: 18.50, sku: "CM-CLAMP-5N1", stockQty: 35, lowStockThreshold: 8, categorySlug: "clamps-magnets", featured: false, specs: '{"reach":"11\\"","positions":"5","capacity":"0-4\\""}' },
  { name: "Magnetic Welding Square 90deg Strong Hold", slug: "mag-welding-square-90", description: "135lb pull magnetic welding square. Holds 90, 135, and 45-degree angles. On/Off switch.", price: 14.99, sku: "CM-MAGSQ-90", stockQty: 3, lowStockThreshold: 8, categorySlug: "clamps-magnets", featured: false, specs: '{"pull":"135 lbs","angles":"45, 90, 135 deg","switch":"On/Off"}' },
  { name: "Pipe and Tube Welding Clamp 3/4\"-4\"", slug: "pipe-tube-welding-clamp", description: "Self-centering pipe welding clamp for round tube 3/4\" to 4\" diameter. Holds alignment for full weld.", price: 42.00, sku: "CM-PIPECLAMP", stockQty: 20, lowStockThreshold: 5, categorySlug: "clamps-magnets", featured: true, specs: '{"capacity":"3/4\\" - 4\\" OD","material":"Steel"}' },

  // Sheet Metal & Plate
  { name: "Mild Steel Sheet 11ga 12\"x24\" (2-Pack)", slug: "mild-steel-sheet-11ga-12x24", description: "A36 mild steel sheet, 11 gauge (0.120\"). Degreased and ready to weld. 2-pack.", price: 38.00, sku: "SM-A36-11G-2P", stockQty: 30, lowStockThreshold: 8, categorySlug: "sheet-metal-plate", featured: false, specs: '{"gauge":"11ga (0.120\\")","size":"12x24\\"","grade":"A36","qty":"2"}' },
  { name: "6061 Aluminum Plate 1/8\" 12\"x12\"", slug: "6061-aluminum-plate-18-12x12", description: "6061-T6 aluminum plate, 1/8\" thick, 12x12 inch. Excellent for brackets, gussets, and enclosures.", price: 26.50, sku: "SM-AL6061-18", stockQty: 25, lowStockThreshold: 5, categorySlug: "sheet-metal-plate", featured: false, specs: '{"alloy":"6061-T6","thickness":"1/8\\"","size":"12x12\\""}' },

  // Gas & Regulators
  { name: "Argon/CO2 75/25 Regulator Dual Gauge", slug: "argon-co2-regulator-dual", description: "Heavy-duty CGA-580 regulator for 75/25 Ar/CO2 MIG shielding gas. Dual gauge, 0-4000 psi inlet, 0-60 CFH outlet.", price: 58.99, sku: "GR-REG-ARCO2", stockQty: 12, lowStockThreshold: 4, categorySlug: "gas-regulators", featured: true, specs: '{"gas":"Argon/CO2","fitting":"CGA-580","inlet_range":"0-4000 psi","outlet_range":"0-60 CFH"}' },
  { name: "Argon Regulator for TIG CGA-580", slug: "argon-tig-regulator", description: "Pure argon regulator for TIG welding. Solid brass body, 0-3000 psi inlet, 0-40 CFH flow gauge.", price: 54.50, sku: "GR-REG-ARTIG", stockQty: 8, lowStockThreshold: 4, categorySlug: "gas-regulators", featured: false, specs: '{"gas":"Pure Argon","fitting":"CGA-580","body":"Solid Brass"}' },
  { name: "MIG/TIG Gas Hose 12.5ft CGA-580", slug: "gas-hose-12-5ft", description: "Heavy-duty reinforced gas hose, 12.5 ft. CGA-580 to 5/8-18 RH fittings. Rated to 350 psi.", price: 16.99, sku: "GR-HOSE-125", stockQty: 42, lowStockThreshold: 10, categorySlug: "gas-regulators", featured: false, specs: '{"length":"12.5 ft","pressure":"350 psi","fittings":"CGA-580 to 5/8-18 RH"}' },
];

async function seed() {
  console.log("Seeding FabShop MySQL database...");

  for (const cat of categories) {
    const existing = await db.select().from(categoriesTable).where(
      (await import("drizzle-orm")).eq(categoriesTable.slug, cat.slug)
    );
    if (existing.length === 0) {
      await db.insert(categoriesTable).values(cat);
      console.log(`Inserted category: ${cat.name}`);
    } else {
      console.log(`Category already exists: ${cat.name}`);
    }
  }

  const allCats = await db.select().from(categoriesTable);
  const catMap = new Map(allCats.map((c) => [c.slug, c.id]));

  for (const product of products) {
    const { categorySlug, ...productData } = product;
    const categoryId = catMap.get(categorySlug) ?? null;

    const existing = await db.select().from(productsTable).where(
      (await import("drizzle-orm")).eq(productsTable.sku, product.sku)
    );
    if (existing.length === 0) {
      await db.insert(productsTable).values({
        ...productData,
        categoryId,
        imageUrl: null,
      });
      console.log(`Inserted product: ${product.name}`);
    } else {
      console.log(`Product already exists: ${product.name}`);
    }
  }

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
