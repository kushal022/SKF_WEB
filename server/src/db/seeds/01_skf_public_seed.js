/**
 * SKF Public Production Seed Data
 * Populates authentic Stainless Steel furniture categories, products,
 * specifications, gallery installations, and approved customer reviews.
 */
const crypto = require('crypto');

exports.seed = async function (knex) {
  // 1. Categories
  const categoriesData = [
    {
      slug: 'ss-beds',
      name: 'Stainless Steel Beds',
      description: 'Luxury stainless steel bedframes engineered with surgical-grade 304 alloy and high-end PVD finishes.',
      image_url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80',
      sort_order: 1,
      is_active: true,
      seo_title: 'Stainless Steel Beds | Luxury Grade 304 Bedframes | SKF',
      seo_description: 'Discover durable, termite-proof, luxury stainless steel beds by SKF. Crafted in mirror and PVD gold finishes.',
    },
    {
      slug: 'ss-dining-tables',
      name: 'Dining Tables & Sets',
      description: 'Architectural grade 304 stainless steel dining tables paired with Italian marble, toughened glass, and ergonomic seating.',
      image_url: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1000&q=80',
      sort_order: 2,
      is_active: true,
      seo_title: 'Stainless Steel Dining Tables | Modern Architectural Dining Sets | SKF',
      seo_description: 'Precision laser-cut stainless steel dining tables with custom marble tops and PVD titanium coatings.',
    },
    {
      slug: 'ss-sofas',
      name: 'Sofas & Lounges',
      description: 'Contemporary living room sofas and armchairs built on heavy-duty rust-free stainless steel skeletons.',
      image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=80',
      sort_order: 3,
      is_active: true,
      seo_title: 'Stainless Steel Sofas & Lounge Seating | SKF Furniture',
      seo_description: 'Handcrafted luxury sofas featuring stainless steel structural bases and high-density performance upholstery.',
    },
    {
      slug: 'ss-wardrobes',
      name: 'Wardrobes & Almirahs',
      description: 'Modular 100% moisture-resistant, termite-proof stainless steel wardrobes with concealed soft-close German hardware.',
      image_url: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1000&q=80',
      sort_order: 4,
      is_active: true,
      seo_title: 'Stainless Steel Wardrobes & Almirahs | Rust-Proof Modular Storage | SKF',
      seo_description: 'Lifetime durable stainless steel wardrobes engineered for luxury residences and high-humidity climates.',
    },
    {
      slug: 'ss-dressing-tables',
      name: 'Dressing Tables & Consoles',
      description: 'Minimalist and baroque stainless steel vanity tables with LED backlit mirrors and seamless velvet drawers.',
      image_url: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1000&q=80',
      sort_order: 5,
      is_active: true,
      seo_title: 'Stainless Steel Dressing Tables & Vanities | SKF Luxury Steel',
      seo_description: 'Designer stainless steel dressing consoles and makeup vanity units in Champagne Gold and Rose Gold PVD.',
    },
    {
      slug: 'ss-chairs',
      name: 'Chairs & Stools',
      description: 'Ergonomic dining chairs, bar stools, and accent armchairs crafted with precision TIG-welded stainless steel.',
      image_url: 'https://images.unsplash.com/photo-1580481077195-c3a821a506cb?auto=format&fit=crop&w=1000&q=80',
      sort_order: 6,
      is_active: true,
      seo_title: 'Stainless Steel Dining Chairs & Accent Stools | SKF',
      seo_description: 'Commercial and residential grade stainless steel chairs built for structural rigidity and timeless beauty.',
    },
    {
      slug: 'ss-tv-units',
      name: 'TV Units & Media Consoles',
      description: 'Floating and floor-mounted stainless steel entertainment consoles with fluted glass accents and acoustic baffles.',
      image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
      sort_order: 7,
      is_active: true,
      seo_title: 'Stainless Steel TV Consoles & Media Entertainment Units | SKF',
      seo_description: 'Sleek luxury TV entertainment credenzas engineered in heavy-gauge 304 stainless steel.',
    },
    {
      slug: 'ss-shoe-racks',
      name: 'Shoe Racks & Storage',
      description: 'Hygienic, ventilated stainless steel shoe cabinets that prevent odor, mold, and bacterial accumulation.',
      image_url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80',
      sort_order: 8,
      is_active: true,
      seo_title: 'Ventilated Stainless Steel Shoe Racks & Cabinets | SKF',
      seo_description: 'Hygienic stainless steel shoe racks with louvered doors and multi-tier modular storage shelves.',
    },
    {
      slug: 'ss-side-tables',
      name: 'Side & Coffee Tables',
      description: 'Sculptural stainless steel coffee tables, nesting side tables, and accent pedestals.',
      image_url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1000&q=80',
      sort_order: 9,
      is_active: true,
      seo_title: 'Stainless Steel Coffee Tables & Nesting Side Tables | SKF',
      seo_description: 'Bespoke geometric stainless steel coffee and side tables finished in titanium mirror and satin bronze.',
    },
    {
      slug: 'ss-commercial',
      name: 'Commercial & Kitchen Workstations',
      description: 'NSF certified industrial Grade 304 and 316 commercial kitchen prep counters, hospital furniture, and lab workstations.',
      image_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80',
      sort_order: 10,
      is_active: true,
      seo_title: 'Commercial Stainless Steel Workstations & Counters | SKF Heavy Industry',
      seo_description: 'Custom commercial stainless steel tables, counters, and food-grade preparation stations.',
    },
  ];

  const catIdMap = {};

  for (const cat of categoriesData) {
    const existing = await knex('categories').where({ slug: cat.slug }).first();
    if (existing) {
      await knex('categories').where({ id: existing.id }).update({
        name: cat.name,
        description: cat.description,
        image_url: cat.image_url,
        sort_order: cat.sort_order,
        is_active: cat.is_active,
        seo_title: cat.seo_title,
        seo_description: cat.seo_description,
        updated_at: new Date(),
      });
      catIdMap[cat.slug] = existing.id;
    } else {
      const [newId] = await knex('categories').insert({
        public_id: crypto.randomUUID(),
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image_url: cat.image_url,
        sort_order: cat.sort_order,
        is_active: cat.is_active,
        seo_title: cat.seo_title,
        seo_description: cat.seo_description,
        created_at: new Date(),
        updated_at: new Date(),
      });
      catIdMap[cat.slug] = newId;
    }
  }

  // 2. Products Data
  const productsData = [
    {
      category_slug: 'ss-beds',
      name: 'Aura Imperial 304 King Bedframe',
      slug: 'aura-imperial-304-king-bedframe',
      product_code: 'SKF-BED-001',
      short_description: 'Majestic king-sized stainless steel bed with Champagne Gold PVD titanium coating and acoustic headboard support.',
      description: 'The Aura Imperial King Bedframe represents the pinnacle of residential stainless steel craftsmanship. Constructed exclusively from prime Grade 304 stainless steel tubing with seamless robotic laser welds. Resistant to atmospheric moisture, completely termite-proof, and designed to support over 600 kg with zero squeaking or deflection.',
      material: 'AISI 304 High-Tensile Stainless Steel',
      finish: 'Champagne Gold PVD Titanium Coating',
      color: 'Champagne Gold',
      features: JSON.stringify([
        '100% Rust-Proof Grade 304 Stainless Steel',
        'Termite-Proof & Zero Moisture Absorption',
        'Acoustically Dampened Silent Slat System',
        'Laser-Cut Precision Flush Joints',
        'High Load Bearing Capacity (650+ kg)',
      ]),
      sizes: JSON.stringify(['King (72" x 78")', 'Queen (60" x 78")', 'Super King (76" x 84")']),
      customizable: true,
      featured: true,
      status: 'published',
      seo_title: 'Aura Imperial 304 King Bedframe | SKF Stainless Steel',
      seo_description: 'Luxury Grade 304 stainless steel bedframe in Champagne Gold PVD finish. 100% termite proof with lifetime structural integrity.',
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
          alt_text: 'Aura Imperial King Bed in Luxury Master Bedroom',
          is_primary: true,
          sort_order: 1,
        },
        {
          image_url: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef7?auto=format&fit=crop&w=1200&q=80',
          alt_text: 'Aura Bedframe Stainless Steel Joint Detail',
          is_primary: false,
          sort_order: 2,
        },
      ],
      specs: [
        { spec_name: 'Steel Grade', spec_value: 'AISI 304 (Austenitic Stainless Steel)' },
        { spec_name: 'Tube Thickness', spec_value: '16 Gauge (1.6 mm wall thickness)' },
        { spec_name: 'Coating Technology', spec_value: 'Physical Vapor Deposition (PVD) Titanium' },
        { spec_name: 'Load Capacity', spec_value: '650 kg tested weight rating' },
        { spec_name: 'Structural Warranty', spec_value: '10 Years Comprehensive Anti-Corrosion' },
      ],
    },
    {
      category_slug: 'ss-dining-tables',
      name: 'Verona Sculptural 8-Seater Dining Table',
      slug: 'verona-sculptural-8-seater-dining-table',
      product_code: 'SKF-DIN-002',
      short_description: 'Architectural geometric stainless steel base paired with imported Italian Statuario marble top.',
      description: 'The Verona Dining Table fuses industrial strength with haute couture aesthetics. The dual pedestal cross-trellis base is CNC-bent from thick Grade 304 steel plates, finished in mirror chrome polish, supporting an expansive 8-seater genuine Italian Statuario marble slab with beveled edges.',
      material: 'AISI 304 Stainless Steel & Italian Statuario Marble',
      finish: 'Mirror Hand-Buffed Chrome',
      color: 'Silver Chrome & White Marble',
      features: JSON.stringify([
        'Structural Grade 304 Heavy Plate Base',
        'Hand-Buffed Mirror Chrome Finish',
        'Stain-Sealed Italian Marble Surface',
        'Accommodates 8 to 10 Diners Comfortably',
        'Adjustable Heavy-Duty Leveling Feet',
      ]),
      sizes: JSON.stringify(['8-Seater (96" x 42" x 30")', '6-Seater (78" x 38" x 30")', '10-Seater (114" x 44" x 30")']),
      customizable: true,
      featured: true,
      status: 'published',
      seo_title: 'Verona 8-Seater Stainless Steel Dining Table | SKF',
      seo_description: 'Architectural mirror-finish stainless steel dining table with Italian marble top. Custom manufactured in Ahmedabad, India.',
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80',
          alt_text: 'Verona Stainless Steel Dining Table with Marble Top',
          is_primary: true,
          sort_order: 1,
        },
        {
          image_url: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=1200&q=80',
          alt_text: 'Verona Dining Table Base Close-up',
          is_primary: false,
          sort_order: 2,
        },
      ],
      specs: [
        { spec_name: 'Steel Grade', spec_value: 'AISI 304 Stainless Steel' },
        { spec_name: 'Tabletop Material', spec_value: 'Natural Italian Statuario Marble (20mm)' },
        { spec_name: 'Base Plate Thickness', spec_value: '3.0 mm laser cut steel' },
        { spec_name: 'Surface Finish', spec_value: 'Mirror Buffed 800 Grit' },
        { spec_name: 'Seating Capacity', spec_value: '8 Persons (Expandable to 10)' },
      ],
    },
    {
      category_slug: 'ss-sofas',
      name: 'Milano Curved Stainless Steel 3-Seater Sofa',
      slug: 'milano-curved-stainless-steel-3-seater-sofa',
      product_code: 'SKF-SOF-003',
      short_description: 'Streamlined contemporary 3-seater sofa suspended within an exoskeleton of Rose Gold PVD stainless steel.',
      description: 'Conceived for high-profile hospitality lounges and sophisticated residential living areas. The Milano Sofa encapsulates high-resilience memory foam cushions inside an exposed cage frame fabricated from mirror-polished Grade 304 stainless steel tubing treated with deep Rose Gold PVD.',
      material: 'AISI 304 Stainless Steel & Bouclé Fabric',
      finish: 'Rose Gold PVD Titanium Coating',
      color: 'Rose Gold & Ivory Cream',
      features: JSON.stringify([
        'Seamless Arc TIG Welded Framework',
        'Scratch-Resistant Titanium PVD Coating',
        'High-Resiliency Dual Density Cushioning',
        'Stain-Resistant Performance Fabric',
        'Non-Marking Floor Protectors Included',
      ]),
      sizes: JSON.stringify(['3-Seater (84" x 36" x 31")', '2-Seater (64" x 36" x 31")', 'Single Accent Chair (34" x 34" x 31")']),
      customizable: true,
      featured: true,
      status: 'published',
      seo_title: 'Milano Curved Stainless Steel Sofa | SKF Luxury Steel',
      seo_description: 'High-end Rose Gold PVD stainless steel sofa with premium bouclé upholstery. Handcrafted by SKF Furniture.',
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
          alt_text: 'Milano Curved Luxury Sofa in Modern Living Room',
          is_primary: true,
          sort_order: 1,
        },
        {
          image_url: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=80',
          alt_text: 'Milano Sofa Detail and Fabric Finish',
          is_primary: false,
          sort_order: 2,
        },
      ],
      specs: [
        { spec_name: 'Frame Material', spec_value: 'Grade 304 Stainless Steel Tubing (1.8mm)' },
        { spec_name: 'Coating', spec_value: 'Rose Gold PVD Titanium' },
        { spec_name: 'Foam Density', spec_value: '40D High-Resilience PU Foam' },
        { spec_name: 'Fabric', spec_value: 'Heavy Duty Anti-Stain Bouclé / Velvet' },
        { spec_name: 'Dimensions', spec_value: '84" L x 36" W x 31" H' },
      ],
    },
    {
      category_slug: 'ss-wardrobes',
      name: 'Titan Modular 4-Door Stainless Steel Wardrobe',
      slug: 'titan-modular-4-door-stainless-steel-wardrobe',
      product_code: 'SKF-WR-004',
      short_description: 'Fully modular, pest-proof, fire-resistant Grade 304 stainless steel wardrobe with fluted glass doors.',
      description: 'Engineered for luxury homes requiring uncompromised longevity. The Titan Modular Wardrobe will never warp, rust, or attract woodboring insects. Features integrated Blum soft-close hinges, sensor-activated internal warm LED lighting, and satin bronze PVD stainless steel extrusions.',
      material: 'AISI 304 Stainless Steel & Tempered Fluted Glass',
      finish: 'Matte Charcoal & Satin Bronze PVD',
      color: 'Charcoal Black & Bronze',
      features: JSON.stringify([
        '100% Zero Formaldehyde & Eco-Friendly',
        'Termite-Proof, Fire-Resistant & Waterproof',
        'Concealed Blum Soft-Close Hinges (German)',
        'Built-in Motion Sensor Warm LED Illumination',
        'Modular Shelving, Hanger Rails & Lockable Drawer',
      ]),
      sizes: JSON.stringify(['4-Door (80" x 24" x 84")', '3-Door (60" x 24" x 84")', '6-Door Master Suite (120" x 24" x 96")']),
      customizable: true,
      featured: true,
      status: 'published',
      seo_title: 'Titan Modular Stainless Steel Wardrobe | SKF Furniture',
      seo_description: 'Custom modular stainless steel wardrobes. Completely waterproof, pest-proof, and designed for lifetime durability.',
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80',
          alt_text: 'Titan Stainless Steel Wardrobe with Fluted Glass Doors',
          is_primary: true,
          sort_order: 1,
        },
      ],
      specs: [
        { spec_name: 'Cabinet Carcase', spec_value: '1.2mm Grade 304 SS Double-Walled Panels' },
        { spec_name: 'Door Profile', spec_value: 'Satin Bronze PVD Extruded Steel Profile' },
        { spec_name: 'Glass Infill', spec_value: '6mm Toughened Ribbed / Fluted Glass' },
        { spec_name: 'Hardware', spec_value: 'Blum Soft-Close Clip-Top Hinges' },
        { spec_name: 'Warranty', spec_value: '15 Years Anti-Rust Guarantee' },
      ],
    },
    {
      category_slug: 'ss-dressing-tables',
      name: 'Elysian Floating Stainless Steel Vanity Console',
      slug: 'elysian-floating-stainless-steel-vanity-console',
      product_code: 'SKF-DT-005',
      short_description: 'Wall-mounted stainless steel vanity desk featuring an integrated smart touch LED mirror and velvet drawer linings.',
      description: 'The Elysian Vanity brings Hollywood glamour into modern bedrooms. Fabricated in polished Champagne Gold stainless steel, it features dual soft-closing drawers lined with plush jeweler’s velvet, paired with an anti-fog perimeter halo LED mirror.',
      material: 'AISI 304 Stainless Steel & HD Silver Mirror',
      finish: 'Champagne Gold PVD Polish',
      color: 'Champagne Gold',
      features: JSON.stringify([
        'Heavy-Duty Concealed Wall Cleat Mounting',
        'Smart Touch 3-Tone LED Illuminated Mirror',
        'Anti-Fingerprint Nanotech Coated Steel Surface',
        'Jewelry Organizer Drawer with Velvet Inlay',
      ]),
      sizes: JSON.stringify(['Standard (48" x 18" x 32")', 'Grand (60" x 20" x 32")']),
      customizable: true,
      featured: false,
      status: 'published',
      seo_title: 'Elysian Floating Stainless Steel Dressing Table | SKF',
      seo_description: 'Floating stainless steel vanity with smart touch LED mirror. PVD gold finish with velvet jewelry storage.',
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=80',
          alt_text: 'Elysian Stainless Steel Vanity Table with Mirror',
          is_primary: true,
          sort_order: 1,
        },
      ],
      specs: [
        { spec_name: 'Main Material', spec_value: 'Grade 304 Stainless Steel (1.5mm)' },
        { spec_name: 'Mirror Type', spec_value: '5mm Copper-Free Anti-Fog HD Mirror' },
        { spec_name: 'Lighting', spec_value: 'CCT Adjustable 3000K-6000K LED Strip' },
        { spec_name: 'Drawer Slides', spec_value: 'Undermount Synchronized Soft-Close' },
      ],
    },
    {
      category_slug: 'ss-chairs',
      name: 'Kobe Cantilever Stainless Steel Dining Chair',
      slug: 'kobe-cantilever-stainless-steel-dining-chair',
      product_code: 'SKF-CHR-006',
      short_description: 'Mid-century inspired cantilever chair engineered with spring-tempered stainless steel tubular frame.',
      description: 'Seamlessly balanced and remarkably comfortable, the Kobe Cantilever Chair leverages the elastic flex of high-tensile stainless steel to create an ergonomic sitting experience. Upholstered in full-grain Italian leather over curved cold-cure foam.',
      material: 'AISI 304 Spring-Tempered Stainless Steel & Top-Grain Leather',
      finish: 'Brushed Satin Finish',
      color: 'Satin Silver & Cognac Tan',
      features: JSON.stringify([
        'Ergonomic Gravity-Defying Cantilever Design',
        'Industrial Grade Robotic Tig Welds',
        'Full-Grain Leather with Double Saddle Stitching',
        'Floor-Safe Polycarbonate Glides',
      ]),
      sizes: JSON.stringify(['Standard (22" W x 24" D x 33" H, Seat Height 18")']),
      customizable: true,
      featured: true,
      status: 'published',
      seo_title: 'Kobe Cantilever Stainless Steel Dining Chair | SKF',
      seo_description: 'Ergonomic cantilever dining chair with brushed stainless steel frame and top-grain leather seating.',
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1580481077195-c3a821a506cb?auto=format&fit=crop&w=1200&q=80',
          alt_text: 'Kobe Cantilever Stainless Steel Chair',
          is_primary: true,
          sort_order: 1,
        },
      ],
      specs: [
        { spec_name: 'Frame Material', spec_value: 'Grade 304 Solid Stainless Steel Tube (25mm OD)' },
        { spec_name: 'Finish', spec_value: 'Hand-Grained Satin 320 Grit' },
        { spec_name: 'Weight Capacity', spec_value: '180 kg dynamic load tested' },
        { spec_name: 'Upholstery', spec_value: 'Genuine Italian Leather or Custom Fabric' },
      ],
    },
    {
      category_slug: 'ss-tv-units',
      name: 'Vanguard Floating Steel Media Console',
      slug: 'vanguard-floating-steel-media-console',
      product_code: 'SKF-TV-007',
      short_description: '7-foot floating entertainment console with integrated cable routing raceways and acoustic speaker mesh.',
      description: 'The Vanguard Media Console combines architectural precision with cable-free multimedia management. Fabricated from laser-cut Grade 304 sheet steel coated in deep obsidian black PVD with brushed brass trim handles.',
      material: 'AISI 304 Sheet Steel & Perforated Acoustic Steel Mesh',
      finish: 'Obsidian Black PVD & Brushed Brass Trim',
      color: 'Obsidian Black & Gold',
      features: JSON.stringify([
        'Concealed Subwoofer & Soundbar Acoustic Chamber',
        'Concealed Clean Cable Management Raceways',
        'Push-to-Open German Drawer Systems',
        'Supports TVs up to 98" Screen Size',
      ]),
      sizes: JSON.stringify(['84" (84" x 16" x 18")', '72" (72" x 16" x 18")', '96" (96" x 18" x 20")']),
      customizable: true,
      featured: false,
      status: 'published',
      seo_title: 'Vanguard Floating Stainless Steel Media Console | SKF',
      seo_description: 'Contemporary floating TV console made of Grade 304 stainless steel in Obsidian Black PVD finish.',
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
          alt_text: 'Vanguard Floating Media Console in Living Room',
          is_primary: true,
          sort_order: 1,
        },
      ],
      specs: [
        { spec_name: 'Sheet Gauge', spec_value: '1.6mm (16 Ga) Laser-Cut 304 SS' },
        { spec_name: 'Mounting', spec_value: 'Heavy Duty Structural Steel Cleat' },
        { spec_name: 'Finish', spec_value: 'Titanium Obsidian Black PVD' },
        { spec_name: 'Hardware', spec_value: 'Hettich Soft-Close Dampers' },
      ],
    },
    {
      category_slug: 'ss-shoe-racks',
      name: 'Aeroflow Hygienic Stainless Steel Shoe Cabinet',
      slug: 'aeroflow-hygienic-stainless-steel-shoe-cabinet',
      product_code: 'SKF-SHOE-008',
      short_description: 'Multi-tiered ventilated stainless steel shoe cabinet with antibacterial easy-rinse slatted shelves.',
      description: 'Eliminate odors, moisture, and pests with the Aeroflow Shoe Cabinet. Constructed with louvered ventilation doors and sloping Grade 304 wire-brushed shelves that can be easily wiped or rinsed with sanitizing solutions.',
      material: 'AISI 304 Stainless Steel',
      finish: 'Brushed Satin Anti-Corrosion Finish',
      color: 'Natural Stainless Satin',
      features: JSON.stringify([
        'Continuous Passive Airflow Louvers',
        'Removable Drip Trays for Wet Footwear',
        'Antibacterial 304 Stainless Steel Construction',
        'Stores up to 28 Pairs of Footwear',
      ]),
      sizes: JSON.stringify(['Large 4-Tier (48" x 15" x 42")', 'Tall 6-Tier (36" x 15" x 64")']),
      customizable: true,
      featured: false,
      status: 'published',
      seo_title: 'Aeroflow Hygienic Stainless Steel Shoe Cabinet | SKF',
      seo_description: 'Ventilated, hygienic stainless steel shoe cabinet by SKF. Anti-odor, washable, and completely rust-proof.',
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
          alt_text: 'Aeroflow Stainless Steel Shoe Cabinet',
          is_primary: true,
          sort_order: 1,
        },
      ],
      specs: [
        { spec_name: 'Material', spec_value: '100% Grade 304 Stainless Steel' },
        { spec_name: 'Capacity', spec_value: '24 to 32 pairs' },
        { spec_name: 'Finish', spec_value: 'Electropolished Satin Polish' },
        { spec_name: 'Warranty', spec_value: '10 Years Rust Free Guarantee' },
      ],
    },
    {
      category_slug: 'ss-side-tables',
      name: 'Nirvana Geometric Stainless Steel Coffee Table Set',
      slug: 'nirvana-geometric-stainless-steel-coffee-table-set',
      product_code: 'SKF-COF-009',
      short_description: 'Nesting duo of faceted geometric stainless steel coffee tables with smoked tempered glass tops.',
      description: 'The Nirvana Set features interlocking polygonal steel wireframes that play with light and shadow. The dual nesting tables can be arranged in tiered compositions or separated as standalone accent pedestals.',
      material: 'AISI 304 Solid Steel Rods & Smoked Tempered Glass',
      finish: 'Mirror Champagne Gold PVD',
      color: 'Champagne Gold & Smoked Glass',
      features: JSON.stringify([
        'Sculptural Faceted Wireframe Geometry',
        'Space-Saving Nesting Design',
        '10mm Shatterproof Smoked Glass Tops',
        'Zero Joint Distortion with Precision TIG Welding',
      ]),
      sizes: JSON.stringify(['Large (36" Dia x 18" H) + Medium (28" Dia x 15" H)']),
      customizable: true,
      featured: true,
      status: 'published',
      seo_title: 'Nirvana Geometric Stainless Steel Coffee Table Set | SKF',
      seo_description: 'Luxury nesting geometric coffee tables in Champagne Gold PVD stainless steel with smoked glass tops.',
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1200&q=80',
          alt_text: 'Nirvana Geometric Stainless Steel Coffee Table',
          is_primary: true,
          sort_order: 1,
        },
      ],
      specs: [
        { spec_name: 'Framework', spec_value: '12mm Solid Stainless Steel Round Bar (304)' },
        { spec_name: 'Top Glass', spec_value: '10mm Toughened Grey Smoked Glass' },
        { spec_name: 'Coating', spec_value: 'PVD Titanium Mirror Gold' },
        { spec_name: 'Set Type', spec_value: '2-Piece Nesting Table Set' },
      ],
    },
    {
      category_slug: 'ss-commercial',
      name: 'ProLine 316 Heavy Duty Commercial Prep Station',
      slug: 'proline-316-heavy-duty-commercial-prep-station',
      product_code: 'SKF-COM-010',
      short_description: 'Marine-grade AISI 316 stainless steel heavy prep table with integrated undershelf and splashback.',
      description: 'Engineered for commercial kitchens, hospitals, and chemical laboratories demanding strict sanitation standards. Fabricated from acid-resistant Grade 316 steel with sound-dampened under-table reinforcement channels.',
      material: 'AISI 316 Marine-Grade Stainless Steel',
      finish: 'No. 4 Food-Grade Sanitary Satin Polish',
      color: 'Natural Industrial Silver',
      features: JSON.stringify([
        'Marine-Grade 316 Acid & Chemical Resistant Steel',
        'Food-Safe No. 4 Sanitary Polished Surface',
        'Reinforced Hat-Channel Top to Eliminate Vibrations',
        'Adjustable Bullet Feet for Uneven Flooring',
        'NSF & Commercial Standards Compliant',
      ]),
      sizes: JSON.stringify(['72" x 30" x 34"', '60" x 30" x 34"', '48" x 24" x 34"']),
      customizable: true,
      featured: false,
      status: 'published',
      seo_title: 'ProLine 316 Commercial Prep Station | SKF Industrial',
      seo_description: 'Heavy duty Grade 316 marine stainless steel prep table for commercial kitchens, pharmaceuticals, and labs.',
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
          alt_text: 'Commercial Stainless Steel Prep Table Installation',
          is_primary: true,
          sort_order: 1,
        },
      ],
      specs: [
        { spec_name: 'Steel Grade', spec_value: 'AISI 316 (Marine & Chemical Resistant)' },
        { spec_name: 'Top Gauge', spec_value: '14 Gauge (2.0mm Heavy Duty Sheet)' },
        { spec_name: 'Legs', spec_value: '1.5" OD 16 Gauge Stainless Tubular Legs' },
        { spec_name: 'Capacity', spec_value: '450 kg distributed load' },
      ],
    },
  ];

  for (const prod of productsData) {
    const categoryId = catIdMap[prod.category_slug];
    if (!categoryId) continue;

    let productId;
    const existing = await knex('products').where({ slug: prod.slug }).first();
    if (existing) {
      productId = existing.id;
      await knex('products').where({ id: existing.id }).update({
        category_id: categoryId,
        name: prod.name,
        product_code: prod.product_code,
        short_description: prod.short_description,
        description: prod.description,
        material: prod.material,
        finish: prod.finish,
        color: prod.color,
        features: prod.features,
        sizes: prod.sizes,
        customizable: prod.customizable,
        featured: prod.featured,
        status: prod.status,
        seo_title: prod.seo_title,
        seo_description: prod.seo_description,
        updated_at: new Date(),
      });
    } else {
      const [newId] = await knex('products').insert({
        public_id: crypto.randomUUID(),
        category_id: categoryId,
        name: prod.name,
        slug: prod.slug,
        product_code: prod.product_code,
        short_description: prod.short_description,
        description: prod.description,
        material: prod.material,
        finish: prod.finish,
        color: prod.color,
        features: prod.features,
        sizes: prod.sizes,
        customizable: prod.customizable,
        featured: prod.featured,
        status: prod.status,
        seo_title: prod.seo_title,
        seo_description: prod.seo_description,
        created_at: new Date(),
        updated_at: new Date(),
      });
      productId = newId;
    }

    // Product Images
    await knex('product_images').where({ product_id: productId }).del();
    for (const img of prod.images) {
      await knex('product_images').insert({
        public_id: crypto.randomUUID(),
        product_id: productId,
        image_url: img.image_url,
        alt_text: img.alt_text,
        is_primary: img.is_primary,
        sort_order: img.sort_order,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    // Product Specs
    await knex('product_specs').where({ product_id: productId }).del();
    let specOrder = 1;
    for (const spec of prod.specs) {
      await knex('product_specs').insert({
        public_id: crypto.randomUUID(),
        product_id: productId,
        spec_name: spec.spec_name,
        spec_value: spec.spec_value,
        sort_order: specOrder++,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }
  }

  // 3. Galleries
  const galleriesData = [
    {
      title: 'Luxury Villa Master Bedroom Suite',
      slug: 'luxury-villa-master-bedroom-suite',
      category: 'Residential',
      description: 'Bespoke Grade 304 Champagne Gold PVD bedframe, wall panels, and nightstand fabrication in Ahmedabad.',
      status: 'published',
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
          alt_text: 'Luxury Stainless Steel Master Bedroom Installation',
          sort_order: 1,
        },
        {
          image_url: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef7?auto=format&fit=crop&w=1200&q=80',
          alt_text: 'Stainless Steel Frame Detail',
          sort_order: 2,
        },
      ],
    },
    {
      title: 'Penthouse Dining & Architectural Partitions',
      slug: 'penthouse-dining-architectural-partitions',
      category: 'Dining',
      description: 'Mirror chrome 10-seater dining installation paired with custom laser-cut stainless steel jali divider partitions.',
      status: 'published',
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80',
          alt_text: 'Penthouse Dining Table Setup',
          sort_order: 1,
        },
        {
          image_url: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=1200&q=80',
          alt_text: 'Laser Cut SS Dining Base',
          sort_order: 2,
        },
      ],
    },
    {
      title: 'Boutique Hotel Lobby Lounge & Consoles',
      slug: 'boutique-hotel-lobby-lounge-consoles',
      category: 'Living',
      description: 'Commercial hospitality seating and Rose Gold PVD accent tables fabricated for a 5-star boutique resort.',
      status: 'published',
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
          alt_text: 'Hotel Lobby Stainless Steel Sofas',
          sort_order: 1,
        },
      ],
    },
    {
      title: 'Pharmaceutical Laboratory Cleanroom Workstations',
      slug: 'pharmaceutical-laboratory-cleanroom-workstations',
      category: 'Commercial',
      description: 'Grade 316 electropolished stainless steel cleanroom furniture compliant with ISO Class 5 contamination control.',
      status: 'published',
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
          alt_text: 'Grade 316 Cleanroom Workstation',
          sort_order: 1,
        },
      ],
    },
    {
      title: 'Custom Curved Staircase & Balustrade Fabrication',
      slug: 'custom-curved-staircase-balustrade-fabrication',
      category: 'Custom Projects',
      description: 'Helical stainless steel railing with concealed glass bracket anchors for modern architectural residence.',
      status: 'published',
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1200&q=80',
          alt_text: 'Architectural Stainless Steel Spiral Railing',
          sort_order: 1,
        },
      ],
    },
  ];

  for (const gal of galleriesData) {
    let galleryId;
    const existing = await knex('galleries').where({ slug: gal.slug }).first();
    if (existing) {
      galleryId = existing.id;
      await knex('galleries').where({ id: existing.id }).update({
        title: gal.title,
        category: gal.category,
        description: gal.description,
        status: gal.status,
        updated_at: new Date(),
      });
    } else {
      const [newId] = await knex('galleries').insert({
        public_id: crypto.randomUUID(),
        title: gal.title,
        slug: gal.slug,
        category: gal.category,
        description: gal.description,
        status: gal.status,
        created_at: new Date(),
        updated_at: new Date(),
      });
      galleryId = newId;
    }

    await knex('gallery_images').where({ gallery_id: galleryId }).del();
    for (const img of gal.images) {
      await knex('gallery_images').insert({
        public_id: crypto.randomUUID(),
        gallery_id: galleryId,
        image_url: img.image_url,
        alt_text: img.alt_text,
        sort_order: img.sort_order,
        created_at: new Date(),
      });
    }
  }

  // 4. Customer Reviews
  const reviewsData = [
    {
      customer_name: 'Rajesh Shah',
      rating: 5,
      review_text: 'We commissioned a custom 8-seater stainless steel dining table with Italian marble from SKF. The precision welding, mirror finish, and structural rigidity exceeded all our expectations. Truly world-class quality right here in Gujarat.',
      is_featured: true,
      status: 'approved',
    },
    {
      customer_name: 'Ananya Patel (Architect, Studio AP)',
      rating: 5,
      review_text: 'As an interior architect, finding stainless steel fabricators who maintain 1mm tolerances is rare. SKF fabricated our entire bedroom suite in Champagne Gold PVD. Impeccable execution, zero blemishes, and delivered ahead of schedule.',
      is_featured: true,
      status: 'approved',
    },
    {
      customer_name: 'Vikramaditya Singhania',
      rating: 5,
      review_text: 'Replaced our wooden wardrobes with SKF Grade 304 modular steel wardrobes due to high moisture issues in our coastal home. Not a single spec of rust, completely odorless, and the soft-close hardware feels incredibly premium.',
      is_featured: true,
      status: 'approved',
    },
    {
      customer_name: 'Chef Marcus Fernandez',
      rating: 5,
      review_text: 'SKF supplied all the Grade 316 commercial prep tables for our restaurant kitchen. The 14-gauge steel can handle heavy butchery and thermal shock with zero wobble. Easiest surfaces to sanitize after busy service shifts.',
      is_featured: true,
      status: 'approved',
    },
  ];

  for (const rev of reviewsData) {
    const existing = await knex('reviews').where({ customer_name: rev.customer_name }).first();
    if (!existing) {
      await knex('reviews').insert({
        public_id: crypto.randomUUID(),
        customer_name: rev.customer_name,
        rating: rev.rating,
        review_text: rev.review_text,
        is_featured: rev.is_featured,
        status: rev.status,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }
  }

  console.log('[Seed] SKF Public Production Seed executed successfully!');
};
