import mongoose from "mongoose";
import { Category } from "../models/Category";
import { Product } from "../models/Product";
import { mockCategories } from "../repositories/categoryRepository";
import { mockProducts, InMemoryProduct } from "../repositories/productRepository";

const SEED_CATEGORIES = [
  { id: "electronics", name: "Electronics", slug: "electronics", description: "Laptops, phones, headphones and more", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80", isActive: true },
  { id: "fashion", name: "Fashion", slug: "fashion", description: "Premium designer outerwear and apparel", image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80", isActive: true },
  { id: "shoes", name: "Shoes", slug: "shoes", description: "Athletic and casual lifestyle footwear", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80", isActive: true },
  { id: "home", name: "Home & Living", slug: "home", description: "Modern furniture and premium appliances", image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=400&q=80", isActive: true },
  { id: "beauty", name: "Beauty", slug: "beauty", description: "Luxury skin care oils and treatments", image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=400&q=80", isActive: true },
  { id: "sports", name: "Sports & Outdoors", slug: "sports", description: "Engineered equipment and athletic accessories", image: "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?auto=format&fit=crop&w=400&q=80", isActive: true },
  { id: "books", name: "Books", slug: "books", description: "Bestselling literature and educational print", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80", isActive: true },
  { id: "gaming", name: "Gaming", slug: "gaming", description: "Controllers, mechanical keyboards and accessories", image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80", isActive: true },
];

const SEED_PRODUCTS = [
  {
    id: "prod-1",
    name: "MacBook Pro 16\" M3 Max",
    brand: "Apple",
    category: "electronics",
    description: "The ultimate pro laptop. Featuring the mind-blowing M3 Max chip, an stunning Liquid Retina XDR display, up to 22 hours of battery life, and a sleek space black finish. Designed for developers, creators, and power users who demand uncompromising performance.",
    price: 3499,
    discountPrice: 3199,
    rating: 4.9,
    reviewsCount: 148,
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80"
    ],
    specifications: {
      "Processor": "Apple M3 Max Chip (16-core CPU)",
      "Memory": "48GB Unified RAM",
      "Storage": "1TB Superfast SSD",
      "Display": "16.2-inch Liquid Retina XDR",
      "Operating System": "macOS Sonoma",
      "Weight": "4.7 lbs (2.14 kg)"
    },
    isFeatured: true,
    isNew: true,
    stock: 12
  },
  {
    id: "prod-2",
    name: "iPhone 15 Pro Max 256GB",
    brand: "Apple",
    category: "electronics",
    description: "Forged in titanium and featuring the groundbreaking A17 Pro chip, a customizable Action button, and the most powerful iPhone camera system ever with a 5x optical zoom lens. Designed to take mobile photography and mobile gaming to a whole new level.",
    price: 1199,
    discountPrice: 1099,
    rating: 4.8,
    reviewsCount: 312,
    images: [
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80"
    ],
    specifications: {
      "Material": "Aerospace-grade Titanium design",
      "Chipset": "A17 Pro chip with 6-core GPU",
      "Camera": "48MP Main | 12MP Ultra Wide | 12MP 5x Telephoto",
      "Display": "6.7-inch Super Retina XDR OLED",
      "Battery Life": "Up to 29 hours video playback",
      "Connector": "USB-C with USB 3 support"
    },
    isFeatured: true,
    isNew: false,
    stock: 24
  },
  {
    id: "prod-3",
    name: "WH-1000XM5 Wireless Headphones",
    brand: "Sony",
    category: "electronics",
    description: "Industry-leading noise canceling headphones with dual processors, 8 microphones, Auto NC Optimizer, and exceptional sound quality. Experience crystal-clear hands-free calling and up to 30 hours of continuous playback with quick charging.",
    price: 399,
    discountPrice: 349,
    rating: 4.7,
    reviewsCount: 890,
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80"
    ],
    specifications: {
      "Type": "Over-Ear Wireless",
      "Noise Cancelling": "Industry-Leading Active Noise Cancelling",
      "Battery Life": "Up to 30 Hours (ANC On)",
      "Charging Port": "USB-C Quick Charge (3 min = 3 hours)",
      "Connectivity": "Bluetooth 5.2 & Multi-point connection",
      "Audio Codecs": "SBC, AAC, LDAC"
    },
    isFeatured: true,
    isNew: false,
    stock: 45
  },
  {
    id: "prod-4",
    name: "Air Max Plus OG 'Sunset'",
    brand: "Nike",
    category: "shoes",
    description: "Let your attitude have the edge with the Nike Air Max Plus, a Tuned Air experience that offers premium stability and unbelievable cushioning. Featuring a prominent arch inspired by a whale's tail and wavy lines nodding to palm trees.",
    price: 185,
    discountPrice: 165,
    rating: 4.6,
    reviewsCount: 94,
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=800&q=80"
    ],
    specifications: {
      "Upper": "Synthetic mesh and TPU cage",
      "Midsole": "Polyurethane with Tuned Air units",
      "Outsole": "Durable rubber waffle tread",
      "Style Code": "DX0755-600",
      "Fit": "True to size",
      "Activity": "Streetwear & Lifestyle"
    },
    isFeatured: true,
    isNew: true,
    stock: 18
  },
  {
    id: "prod-5",
    name: "Ultraboost Light Running Shoes",
    brand: "Adidas",
    category: "shoes",
    description: "Experience epic energy with the lightest Ultraboost ever. The secret lies in the Light BOOST midsole, a new generation of adidas BOOST that provides maximum cushioning, comfort, and responsiveness on daily runs.",
    price: 190,
    discountPrice: 159,
    rating: 4.8,
    reviewsCount: 210,
    images: [
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80"
    ],
    specifications: {
      "Midsole": "Light BOOST Technology",
      "Upper": "Adidas PRIMEKNIT+ textile",
      "Outsole": "Continental™ Better Rubber",
      "Weight": "10.4 oz (Size 9)",
      "Drop": "10 mm",
      "Sustainability": "Made with at least 30% recycled materials"
    },
    isFeatured: false,
    isNew: false,
    stock: 30
  },
  {
    id: "prod-6",
    name: "V15 Detect Absolute Vacuum",
    brand: "Dyson",
    category: "home",
    description: "Dyson's most powerful, intelligent cordless vacuum. Laser reveals microscopic dust, automatically counting and measuring particles on a high-definition LCD screen to provide scientific proof of a deep clean.",
    price: 749,
    discountPrice: 699,
    rating: 4.7,
    reviewsCount: 154,
    images: [
      "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80"
    ],
    specifications: {
      "Suction Power": "230 AW (Air Watts)",
      "Run Time": "Up to 60 minutes",
      "Bin Volume": "0.2 gal (0.76 L)",
      "Filtration": "Whole-machine HEPA filtration",
      "Weight": "6.8 lbs (3.08 kg)",
      "Attachments": "6 premium tools included"
    },
    isFeatured: true,
    isNew: true,
    stock: 8
  },
  {
    id: "prod-7",
    name: "DualSense Edge Controller",
    brand: "Sony",
    category: "gaming",
    description: "Get an edge in gameplay with customizable controls, swappable stick caps and back buttons, adjustable trigger stops, and custom profiles. Built with high performance and personalization in mind.",
    price: 199,
    discountPrice: 189,
    rating: 4.5,
    reviewsCount: 122,
    images: [
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1592155931584-901ac15763e3?auto=format&fit=crop&w=800&q=80"
    ],
    specifications: {
      "Platform": "PlayStation 5, PC",
      "Connectivity": "USB-C, Bluetooth",
      "Battery Life": "Up to 6 hours",
      "Features": "Haptic feedback, Adaptive triggers, Modular thumbsticks",
      "Included Accessories": "Carrying case, braided USB cable, 4 back buttons, 4 stick caps"
    },
    isFeatured: false,
    isNew: true,
    stock: 15
  },
  {
    id: "prod-8",
    name: "Galaxy S24 Ultra 512GB",
    brand: "Samsung",
    category: "electronics",
    description: "Welcome to the era of mobile AI. With Galaxy S24 Ultra in your hands, you can unleash whole new levels of creativity, productivity and possibility, framed in durable Titanium and boasting a 200MP camera system.",
    price: 1299,
    discountPrice: 1199,
    rating: 4.8,
    reviewsCount: 205,
    images: [
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80"
    ],
    specifications: {
      "Display": "6.8-inch Dynamic AMOLED 2X, QHD+",
      "Processor": "Snapdragon 8 Gen 3 for Galaxy",
      "Rear Camera": "200MP Wide | 50MP Periscope | 12MP Ultra Wide | 10MP Telephoto",
      "Stylus": "Built-in S Pen",
      "Battery": "5,000 mAh (45W wired charging)",
      "AI Features": "Circle to Search, Live Translate, Note Assist"
    },
    isFeatured: false,
    isNew: true,
    stock: 16
  },
  {
    id: "prod-9",
    name: "Oversized Wool Blend Coat",
    brand: "Zara",
    category: "fashion",
    description: "Exquisite double-breasted wool blend coat featuring a lapel collar, long sleeves, front flap pockets, and a matching fabric tie belt. This warm, timeless outerwear completes any smart autumn/winter outfit.",
    price: 169,
    discountPrice: 149,
    rating: 4.4,
    reviewsCount: 63,
    images: [
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80"
    ],
    specifications: {
      "Composition": "70% Wool, 30% Polyamide",
      "Fit": "Oversized / Relaxed fit",
      "Color": "Camel",
      "Care Instructions": "Dry clean only",
      "Manufactured in": "Spain"
    },
    isFeatured: false,
    isNew: false,
    stock: 22
  },
  {
    id: "prod-10",
    name: "Classic Leather Jacket",
    brand: "Zara",
    category: "fashion",
    description: "Crafted from 100% genuine lambskin leather, this classic biker-style jacket features metal zip details, asymmetric front zip closure, shoulder epaulets, and a belted hem. A wardrobe staple that gains character over time.",
    price: 249,
    discountPrice: 219,
    rating: 4.6,
    reviewsCount: 88,
    images: [
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80"
    ],
    specifications: {
      "Outer Shell": "100% Lambskin Leather",
      "Lining": "100% Polyester",
      "Pockets": "3 exterior zippered pockets, 1 interior snap pocket",
      "Zippers": "Heavy duty YKK hardware",
      "Style": "Biker / Rocker jacket"
    },
    isFeatured: true,
    isNew: false,
    stock: 14
  },
  {
    id: "prod-11",
    name: "G502 X Plus Lightspeed Mouse",
    brand: "Logitech",
    category: "gaming",
    description: "The world's most popular gaming mouse, reimagined and redesigned. Featuring hybrid optical-mechanical LIGHTFORCE switches, LIGHTSPEED pro-grade wireless, and beautiful 8-LED dynamic RGB lighting.",
    price: 159,
    discountPrice: 139,
    rating: 4.7,
    reviewsCount: 442,
    images: [
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80"
    ],
    specifications: {
      "Sensor": "HERO 25K high-precision gaming sensor",
      "Max DPI": "25,600",
      "Weight": "106 grams",
      "Buttons": "13 programmable buttons",
      "Battery Life": "Up to 120 hours (RGB off), 37 hours (RGB on)",
      "Wireless Tech": "LIGHTSPEED wireless connection"
    },
    isFeatured: true,
    isNew: false,
    stock: 25
  },
  {
    id: "prod-12",
    name: "Ultrasonic Facial Serum",
    brand: "Dyson",
    category: "beauty",
    description: "Advanced daily treatment serum formulated to boost natural moisture barriers, smooth fine lines, and enhance skin radiance. Powered by hyaluronic acid, vitamin C, and multi-peptide complexes.",
    price: 85,
    discountPrice: 75,
    rating: 4.5,
    reviewsCount: 56,
    images: [
      "https://images.unsplash.com/photo-1608248597481-496100c8c836?auto=format&fit=crop&w=800&q=80"
    ],
    specifications: {
      "Volume": "1.7 fl oz (50 mL)",
      "Skin Types": "All skin types (Sensitive, Dry, Oily, Combination)",
      "Key Ingredients": "15% Vitamin C, 2% Hyaluronic Acid, Peptide Matrix",
      "Fragrance": "Fragrance-free",
      "Cruelty-Free": "Yes, certified vegan and cruelty-free"
    },
    isFeatured: false,
    isNew: true,
    stock: 40
  },
  {
    id: "prod-13",
    name: "Premium Yoga Mat 5mm",
    brand: "Adidas",
    category: "sports",
    description: "Engineered with 5mm cushioning and textured non-slip grip, this ultra-durable, natural tree-rubber yoga mat offers superior stability, impact protection, and joint support during intense training sessions.",
    price: 65,
    discountPrice: 55,
    rating: 4.6,
    reviewsCount: 112,
    images: [
      "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?auto=format&fit=crop&w=800&q=80"
    ],
    specifications: {
      "Thickness": "5mm professional grade",
      "Material": "Eco-friendly natural rubber & TPE",
      "Dimensions": "71\" L x 24\" W x 0.2\" D",
      "Weight": "2.2 lbs (1.0 kg)",
      "Grip": "Double-sided non-slip textured surface",
      "Includes": "Elastic carrying strap"
    },
    isFeatured: false,
    isNew: false,
    stock: 50
  },
  {
    id: "prod-14",
    name: "Atomic Habits (Hardcover)",
    brand: "Logitech",
    category: "books",
    description: "The #1 New York Times bestseller by James Clear. An easy & proven way to build good habits & break bad ones, packed with actionable strategies to transform your personal and professional routines starting today.",
    price: 27,
    discountPrice: 19,
    rating: 4.9,
    reviewsCount: 1250,
    images: [
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80"
    ],
    specifications: {
      "Author": "James Clear",
      "Publisher": "Avery; Illustrated edition",
      "Language": "English",
      "Format": "Hardcover, 320 pages",
      "ISBN-10": "0735211299",
      "Dimensions": "6.2 x 1.1 x 9.2 inches"
    },
    isFeatured: false,
    isNew: false,
    stock: 120
  },
  {
    id: "prod-15",
    name: "Air Force 1 '07",
    brand: "Nike",
    category: "shoes",
    description: "The radiance lives on in the Nike Air Force 1 '07, the basketball original that puts a fresh spin on what you know best: durably stitched overlays, clean finishes and the perfect amount of flash to make you shine.",
    price: 115,
    discountPrice: 99,
    rating: 4.7,
    reviewsCount: 540,
    images: [
      "https://images.unsplash.com/photo-1597045566677-8cf032ed6634?auto=format&fit=crop&w=800&q=80"
    ],
    specifications: {
      "Upper": "Premium stitched leather overlays",
      "Midsole": "Nike Air gas cushioning",
      "Collar": "Padded low-cut collar",
      "Style": "CW2288-111",
      "Origin": "Imported"
    },
    isFeatured: false,
    isNew: false,
    stock: 35
  },
  {
    id: "prod-16",
    name: "Blackout Mechanical Keyboard",
    brand: "Razer",
    category: "gaming",
    description: "Experience premium mechanical typing with sound-dampening foam, hot-swappable linear yellow switches, and a compact 75% mechanical form factor designed to maximize mouse space and deliver satisfying acoustics.",
    price: 129,
    discountPrice: 109,
    rating: 4.6,
    reviewsCount: 167,
    images: [
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80"
    ],
    specifications: {
      "Form Factor": "75% compact mechanical layout",
      "Switches": "Razer Yellow Linear Mechanical Switches (hot-swappable)",
      "Keycaps": "Doubleshot ABS keycaps",
      "Connectivity": "Detachable USB-C cable",
      "Backlighting": "Razer Chroma Customizable RGB"
    },
    isFeatured: false,
    isNew: true,
    stock: 20
  },
  {
    id: "prod-17",
    name: "Stainless Steel Hydration Flask",
    brand: "Nike",
    category: "sports",
    description: "Double-walled vacuum insulated water bottle engineered to keep drinks ice-cold for up to 24 hours or steaming hot for 12 hours. Crafted in medical-grade 18/8 stainless steel with leakproof spout lid.",
    price: 45,
    discountPrice: 35,
    rating: 4.8,
    reviewsCount: 312,
    images: [
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80"
    ],
    specifications: {
      "Capacity": "32 oz (946 mL)",
      "Insulation": "Double-walled TempShield vacuum",
      "Material": "Pro-grade 18/8 Stainless Steel",
      "BPA Free": "Yes, 100% toxin and BPA-free",
      "Lid Style": "Leakproof straw / wide-mouth spout"
    },
    isFeatured: false,
    isNew: false,
    stock: 75
  },
  {
    id: "prod-18",
    name: "Minimalist Oak Dining Table",
    brand: "Dyson",
    category: "home",
    description: "Sustainably-harvested solid oak dining table featuring clean Nordic design lines, a smooth protective matte lacquer finish, and custom steel-reinforced leg joints. Comfortably seats six people.",
    price: 899,
    discountPrice: 799,
    rating: 4.5,
    reviewsCount: 42,
    images: [
      "https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=800&q=80"
    ],
    specifications: {
      "Material": "Solid White European Oak",
      "Finish": "Anti-scratch Matte Polyurethane Lacquer",
      "Seating Capacity": "Up to 6 adults",
      "Dimensions": "72\" L x 36\" W x 30\" H",
      "Weight": "85 lbs (38.5 kg)",
      "Assembly Required": "Leg attachment only (10 minutes)"
    },
    isFeatured: false,
    isNew: false,
    stock: 6
  },
  {
    id: "prod-19",
    name: "Smart Ambient LED Floor Lamp",
    brand: "Samsung",
    category: "home",
    description: "Sleek architectural smart floor lamp featuring 16 million colors, dual zone warm-to-cool whites, and seamless voice control integrations with Alexa, Google Home, and Apple HomeKit.",
    price: 149,
    discountPrice: 129,
    rating: 4.7,
    reviewsCount: 156,
    images: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80"
    ],
    specifications: {
      "Height": "68 inches (172 cm)",
      "Brightness": "2000 Lumens max",
      "Color Temperature": "2200K - 6500K tunable + RGB",
      "Smart Protocol": "Wi-Fi 2.4GHz & Bluetooth mesh",
      "Lifespan": "25,000 hours rating",
      "Base Diameter": "10 inches heavy steel stability base"
    },
    isFeatured: true,
    isNew: true,
    stock: 22
  },
  {
    id: "prod-20",
    name: "Luxury Rose Glow Face Oil",
    brand: "Zara",
    category: "beauty",
    description: "Infused with pure Damascus Rose absolute and 10 active botanical seed oils, this luxurious, lightweight facial oil delivers instant deep nutrition and an otherworldly, dewy glow without greasy residue.",
    price: 95,
    discountPrice: 79,
    rating: 4.8,
    reviewsCount: 104,
    images: [
      "https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=800&q=80"
    ],
    specifications: {
      "Volume": "1.0 fl oz (30 mL)",
      "Ingredients": "Rosehip Oil, Squalane, Damascus Rose, Evening Primrose",
      "Application": "Apply 3-4 drops morning and night on clean skin",
      "Scent": "Natural botanical rose petal scent",
      "Packaging": "UV-protected amber dropper glass bottle"
    },
    isFeatured: true,
    isNew: false,
    stock: 15
  }
];

export async function runSeeder() {
  const isConnected = mongoose.connection.readyState === 1;

  console.log(`[SEEDER] Running seeder. DB Connected: ${isConnected}`);

  // 1. Populate standard Category Fallback map (always)
  SEED_CATEGORIES.forEach(cat => {
    mockCategories.set(cat.id, {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      isActive: cat.isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
      toJSON() {
        return {
          id: this.id,
          name: this.name,
          slug: this.slug,
          description: this.description,
          image: this.image,
          isActive: this.isActive,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
        };
      }
    });
  });

  // 2. Populate standard Product Fallback map (always)
  SEED_PRODUCTS.forEach(p => {
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    mockProducts.set(p.id, new InMemoryProduct({
      id: p.id,
      name: p.name,
      slug,
      description: p.description,
      shortDescription: p.description.slice(0, 80) + "...",
      brand: p.brand,
      sku: `SKU-${p.id.toUpperCase()}`,
      price: p.price,
      discountPrice: p.discountPrice,
      category: p.category, // points to mock category id string
      images: p.images,
      thumbnail: p.images[0],
      stock: p.stock,
      isFeatured: p.isFeatured,
      isActive: true,
      averageRating: p.rating,
      totalReviews: p.reviewsCount,
      tags: [p.brand.toLowerCase(), p.category],
      specifications: p.specifications,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  });

  // 3. If connected to MongoDB, seed collections if empty
  if (isConnected) {
    try {
      const categoryCount = await Category.countDocuments();
      if (categoryCount === 0) {
        console.log("[SEEDER] Database categories empty. Seeding standard categories...");
        
        const createdCategories = [];
        for (const cat of SEED_CATEGORIES) {
          const doc = await Category.create({
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            image: cat.image,
            isActive: cat.isActive
          });
          createdCategories.push(doc);
        }

        console.log(`[SEEDER] Seeded ${createdCategories.length} categories.`);

        const productCount = await Product.countDocuments();
        if (productCount === 0) {
          console.log("[SEEDER] Database products empty. Seeding standard products...");

          let seededProdsCount = 0;
          for (const p of SEED_PRODUCTS) {
            // Find matched created category
            const matchedCat = createdCategories.find(c => c.slug === p.category);
            const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

            await Product.create({
              name: p.name,
              slug,
              description: p.description,
              shortDescription: p.description.slice(0, 80) + "...",
              brand: p.brand,
              sku: `SKU-${p.id.toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
              price: p.price,
              discountPrice: p.discountPrice,
              category: matchedCat ? matchedCat._id : undefined,
              images: p.images,
              thumbnail: p.images[0],
              stock: p.stock,
              isFeatured: p.isFeatured,
              isActive: true,
              averageRating: p.rating,
              totalReviews: p.reviewsCount,
              tags: [p.brand.toLowerCase(), p.category],
              specifications: p.specifications
            });
            seededProdsCount++;
          }
          console.log(`[SEEDER] Seeded ${seededProdsCount} products successfully.`);
        }
      } else {
        console.log("[SEEDER] Database already contains categories. Skipping MongoDB seed.");
      }
    } catch (err: any) {
      console.error("[SEEDER] Error seeding database:", err?.message || err);
    }
  }
}
