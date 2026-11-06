import dayjs from 'dayjs';

export const PRODUCT_ICONS: Record<string, string> = {
  shirt: "👔",
  tshirt: "👕",
  kurta: "🥻",
  coat: "🧥",
  blazer: "🧥",
  jacket: "🧥",
  pant: "👖",
  trouser: "👖",
  jeans: "👖",
  shorts: "🩳",
  dress: "👗",
  gown: "👗",
  uniform: "🎽",
  cap: "🧢",
  bag: "🎒",
  gloves: "🧤",
  shoes: "👟",
  socks: "🧦",
  fabric: "🧵",
  yarn: "🧶",
  tailoring: "✂️",
  button: "🔘",
  zipper: "🪡",
  other: "📦"
};

export const PRODUCT_ICON_LABELS: Record<string, string> = {
  shirt: "Shirt",
  tshirt: "T-Shirt",
  kurta: "Kurta",
  coat: "Coat",
  blazer: "Blazer",
  jacket: "Jacket",
  pant: "Pant",
  trouser: "Trouser",
  jeans: "Jeans",
  shorts: "Shorts",
  dress: "Dress",
  gown: "Gown",
  uniform: "Uniform",
  cap: "Cap",
  bag: "Bag",
  gloves: "Gloves",
  shoes: "Shoes",
  socks: "Socks",
  fabric: "Fabric",
  yarn: "Yarn",
  tailoring: "Tailoring",
  button: "Button",
  zipper: "Zipper",
  other: "Other"
};

/**
 * Returns the emoji character associated with the product icon name.
 * Falls back to matching key terms in the product name if iconName is empty.
 * Defaults to "📦" (Other) if no match.
 */
export const getProductIcon = (iconName: string | undefined | null, productName?: string | null): string => {
  // 1. Try matching with the iconName
  if (iconName) {
    const key = iconName.toLowerCase().trim();
    if (PRODUCT_ICONS[key]) {
      return PRODUCT_ICONS[key];
    }
  }

  // 2. Fallback: Search for matching key terms in the productName
  if (productName) {
    const nameLower = productName.toLowerCase().trim();
    
    // Check specific terms first
    if (nameLower.includes('t-shirt') || nameLower.includes('tshirt')) {
      return PRODUCT_ICONS.tshirt;
    }
    if (nameLower.includes('shirt')) {
      return PRODUCT_ICONS.shirt;
    }
    if (nameLower.includes('kurta') || nameLower.includes('kurt')) {
      return PRODUCT_ICONS.kurta;
    }
    if (nameLower.includes('coat')) {
      return PRODUCT_ICONS.coat;
    }
    if (nameLower.includes('blazer')) {
      return PRODUCT_ICONS.blazer;
    }
    if (nameLower.includes('jacket')) {
      return PRODUCT_ICONS.jacket;
    }
    if (nameLower.includes('jeans')) {
      return PRODUCT_ICONS.jeans;
    }
    if (nameLower.includes('trouser')) {
      return PRODUCT_ICONS.trouser;
    }
    if (nameLower.includes('pant') || nameLower.includes('paint')) {
      return PRODUCT_ICONS.pant;
    }
    if (nameLower.includes('shorts') || nameLower.includes('short')) {
      return PRODUCT_ICONS.shorts;
    }
    if (nameLower.includes('gown')) {
      return PRODUCT_ICONS.gown;
    }
    if (nameLower.includes('dress')) {
      return PRODUCT_ICONS.dress;
    }
    if (nameLower.includes('uniform')) {
      return PRODUCT_ICONS.uniform;
    }
    if (nameLower.includes('cap')) {
      return PRODUCT_ICONS.cap;
    }
    if (nameLower.includes('bag')) {
      return PRODUCT_ICONS.bag;
    }
    if (nameLower.includes('gloves') || nameLower.includes('glove')) {
      return PRODUCT_ICONS.gloves;
    }
    if (nameLower.includes('shoes') || nameLower.includes('shoe')) {
      return PRODUCT_ICONS.shoes;
    }
    if (nameLower.includes('socks') || nameLower.includes('sock')) {
      return PRODUCT_ICONS.socks;
    }
    if (nameLower.includes('fabric')) {
      return PRODUCT_ICONS.fabric;
    }
    if (nameLower.includes('yarn')) {
      return PRODUCT_ICONS.yarn;
    }
    if (nameLower.includes('tailoring') || nameLower.includes('tailor')) {
      return PRODUCT_ICONS.tailoring;
    }
    if (nameLower.includes('button')) {
      return PRODUCT_ICONS.button;
    }
    if (nameLower.includes('zipper') || nameLower.includes('zip')) {
      return PRODUCT_ICONS.zipper;
    }
  }

  // 3. Ultimate fallback
  return PRODUCT_ICONS.other;
};

/**
 * Returns the formatted string: "emoji productName".
 */
export const getProductIconAndLabel = (iconName: string | undefined | null, productName: string): string => {
  const icon = getProductIcon(iconName, productName);
  return `${icon} ${productName}`;
};

/**
 * List of icon options formatted for Ant Design Select.
 * Selecting "shirt" shows "👔 Shirt Selected" in the input, but "👔 Shirt" in the dropdown list.
 */
export const PRODUCT_ICON_OPTIONS = Object.keys(PRODUCT_ICONS).map((key) => {
  const emoji = PRODUCT_ICONS[key];
  const label = PRODUCT_ICON_LABELS[key];
  return {
    value: key,
    label: `${emoji} ${label} Selected`, // what shows in the Select input when selected
    dropdownLabel: `${emoji} ${label}`, // what shows in the dropdown options
    searchValue: `${key} ${label.toLowerCase()}` // search term
  };
});
