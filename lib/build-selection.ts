import type { BuildMenuCategory, BuildMenuItem } from "@/lib/build-menu";
import { buildMenuData, findItem } from "@/lib/build-menu";

function categoryOf(
  itemId: string,
  categories: BuildMenuCategory[],
): BuildMenuCategory | undefined {
  return categories.find((c) => c.items.some((i) => i.id === itemId));
}

function removeIncompleteRequirements(next: Set<string>, categories: BuildMenuCategory[]): void {
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of [...next]) {
      const item = findItem(id, categories);
      if (!item?.requires?.length) continue;
      const missing = item.requires.some((r) => !next.has(r));
      if (missing) {
        next.delete(id);
        changed = true;
      }
    }
  }
}

/**
 * Toggle module selection with category one-of rules, excludes, and requires.
 */
export function toggleModuleSelection(
  selected: Set<string>,
  itemId: string,
  select: boolean,
  categories: BuildMenuCategory[] = buildMenuData.categories,
): Set<string> {
  const next = new Set(selected);
  const item = findItem(itemId, categories);
  if (!item) return next;

  if (!select) {
    next.delete(itemId);
    removeIncompleteRequirements(next, categories);
    return next;
  }

  const cat = categoryOf(itemId, categories);
  if (cat?.selectionMode === "one") {
    for (const it of cat.items) {
      if (it.id !== itemId) next.delete(it.id);
    }
  }

  for (const ex of item.excludes ?? []) {
    next.delete(ex);
  }

  next.add(itemId);

  for (const req of item.requires ?? []) {
    const reqCat = categoryOf(req, categories);
    if (reqCat?.selectionMode === "one") {
      for (const it of reqCat.items) {
        if (it.id !== req) next.delete(it.id);
      }
    }
    next.add(req);
  }

  return next;
}

export function isItemDisabled(
  item: BuildMenuItem,
  selected: Set<string>,
  categories: BuildMenuCategory[] = buildMenuData.categories,
): { disabled: boolean; reason?: string } {
  for (const ex of item.excludes ?? []) {
    if (selected.has(ex)) {
      const other = findItem(ex, categories);
      return {
        disabled: true,
        reason: `${other?.label ?? "Another option"} is selected — swap it off first.`,
      };
    }
  }
  return { disabled: false };
}
