// Everything about the watch: its choices, prices and specs.
// The most expensive combination is the "black on black with a gold case":
// yellow gold case + onyx black dial + black alligator strap.
// To add a choice: copy one line, give it a new id, and set its colors and price.

export const brand = {
  name: "ORIEL",
  model: "Heritage 40",
  whatsapp: "971500000000", // the shop's WhatsApp number (country code, no + or spaces)
  basePrice: 4900, // in dollars
};

// Case metal. color = metal tint, rough = how blurry its reflections are
export const cases = [
  { id: "steel", en: "Steel", ar: "ستيل", color: "#dfe1e5", rough: 0.16, price: 0 },
  { id: "gold", en: "Yellow gold", ar: "ذهب أصفر", color: "#f1cd84", rough: 0.14, price: 3200 },
  { id: "rose", en: "Rose gold", ar: "ذهب وردي", color: "#f0b9a2", rough: 0.14, price: 2900 },
  { id: "black", en: "Black DLC", ar: "أسود مطفي", color: "#2a2a2e", rough: 0.32, price: 600 },
];

// Dial (the face). color = the face, ink = color of the printing on it
export const dials = [
  { id: "blue", en: "Midnight blue", ar: "أزرق ليلي", color: "#1c2c55", ink: "#e9edf5", price: 250 },
  { id: "black", en: "Onyx black", ar: "أسود", color: "#101012", ink: "#e9e9ea", price: 450 },
  { id: "silver", en: "Silver white", ar: "فضي أبيض", color: "#d8d9dc", ink: "#1b1c20", price: 0 },
  { id: "green", en: "Forest green", ar: "أخضر غابة", color: "#1d3d2f", ink: "#eef2ec", price: 200 },
];

// Straps
export const straps = [
  { id: "black", en: "Black alligator", ar: "جلد تمساح أسود", color: "#151414", rough: 0.5, price: 180 },
  { id: "brown", en: "Cognac leather", ar: "جلد عسلي", color: "#7a4a28", rough: 0.6, price: 120 },
  { id: "navy", en: "Navy rubber", ar: "مطاط كحلي", color: "#1b2438", rough: 0.85, price: 0 },
  { id: "sand", en: "Sand suede", ar: "شامواه رملي", color: "#b49674", rough: 0.95, price: 60 },
];

export const find = (list, id) => list.find((o) => o.id === id) ?? list[0];

export const totalPrice = (c) =>
  brand.basePrice + find(cases, c.case).price + find(dials, c.dial).price + find(straps, c.strap).price;

// The parts shown in the exploded view (front to back)
export const parts = [
  { id: "crystal", en: "Sapphire crystal", ar: "كريستال سافاير", detail: { en: "Scratch-proof, anti-reflective", ar: "ضد الخدش وضد الانعكاس" } },
  { id: "bezel", en: "Polished bezel", ar: "إطار مصقول", detail: { en: "Mirror-polished", ar: "مصقول كالمراية" } },
  { id: "hands", en: "Dauphine hands", ar: "عقارب دوفين", detail: { en: "Live, on your time", ar: "ماشية على وقتك" } },
  { id: "dial", en: "Sunburst dial", ar: "وجه أشعة الشمس", detail: { en: "Brushed from the centre", ar: "مصقول من النص لبرا" } },
  { id: "movement", en: "Calibre OR-01", ar: "ماكينة OR-01", detail: { en: "28,800 beats per hour", ar: "28,800 نبضة بالساعة" } },
  { id: "caseback", en: "Exhibition caseback", ar: "ظهر شفاف", detail: { en: "See the heart beat", ar: "شوف قلبها وهو بينبض" } },
];

export const specs = [
  { en: "Case", ar: "العلبة", value: { en: "40 mm, 11.2 mm thick", ar: "40 مم، سماكة 11.2 مم" } },
  { en: "Movement", ar: "الماكينة", value: { en: "Automatic, Calibre OR-01", ar: "أوتوماتيك، ماكينة OR-01" } },
  { en: "Power reserve", ar: "مخزون الطاقة", value: { en: "70 hours", ar: "70 ساعة" } },
  { en: "Water resistance", ar: "مقاومة الماء", value: { en: "100 m", ar: "100 متر" } },
  { en: "Crystal", ar: "الزجاج", value: { en: "Sapphire, front and back", ar: "سافاير، من قدام ومن ورا" } },
  { en: "Warranty", ar: "الكفالة", value: { en: "5 years", ar: "5 سنين" } },
];
