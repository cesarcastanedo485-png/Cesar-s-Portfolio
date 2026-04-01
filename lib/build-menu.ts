import buildMenu from "@/content/build-menu.json";

export type BuildMenuPriceHint = {
  display: string;
  basis?: string;
};

export type BuildMenuItem = {
  id: string;
  label: string;
  description: string;
  tags?: string[];
  requires?: string[];
  excludes?: string[];
  questionRefs?: string[];
  priceHint: BuildMenuPriceHint;
  monthlyNote?: string | null;
};

export type BuildMenuCategory = {
  id: string;
  label: string;
  description?: string;
  /** When `one`, only one item in this category may be selected. */
  selectionMode?: "one" | "multi";
  items: BuildMenuItem[];
};

export type QuestionnaireOption = {
  id: string;
  label: string;
  description?: string;
};

export type QuestionnaireStep = {
  id: string;
  question: string;
  options: QuestionnaireOption[];
};

export type BuildMenuData = {
  meta: {
    pageTitle: string;
    pageDescription: string;
    heroTitle: string;
    heroSubtitle: string;
    stickyDisclaimer: string;
    longDisclaimer: string;
    ticketStation: string;
    ticketDestination: string;
    mailSubject: string;
  };
  questionnaire: {
    title: string;
    description?: string;
    steps: QuestionnaireStep[];
  };
  categories: BuildMenuCategory[];
};

export const buildMenuData = buildMenu as BuildMenuData;

const itemToCategory = new Map<string, BuildMenuCategory>();
for (const cat of buildMenuData.categories) {
  for (const item of cat.items) {
    itemToCategory.set(item.id, cat);
  }
}

export function getCategoryForItem(itemId: string): BuildMenuCategory | undefined {
  return itemToCategory.get(itemId);
}

export function findItem(
  itemId: string,
  categories: BuildMenuCategory[] = buildMenuData.categories,
): BuildMenuItem | undefined {
  for (const cat of categories) {
    const hit = cat.items.find((i) => i.id === itemId);
    if (hit) return hit;
  }
  return undefined;
}

export function listSelectedItemsInOrder(selectedIds: Set<string>): BuildMenuItem[] {
  const out: BuildMenuItem[] = [];
  for (const cat of buildMenuData.categories) {
    for (const item of cat.items) {
      if (selectedIds.has(item.id)) out.push(item);
    }
  }
  return out;
}
