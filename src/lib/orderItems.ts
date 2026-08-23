import Product from '@/models/Product';
import PCComponent from '@/models/PCComponent';

export type OrderItemType = 'product' | 'component';

/** One line as the client sent it. Price and name are advisory only. */
export interface RequestedItem {
  product: string;
  itemType?: OrderItemType;
  name?: string;
  price?: number;
  quantity: number;
}

/** One line rebuilt from the database — the only version an order is ever built from. */
export interface ResolvedItem {
  product: string;
  itemType: OrderItemType;
  name: string;
  price: number;
  quantity: number;
  image: string;
  /** Stock on hand at resolution time, so callers can warn before payment. */
  stock: number;
}

export interface ResolutionChange {
  product: string;
  name: string;
  kind: 'price' | 'stock' | 'unavailable';
  /** What the client believed. Absent when the client sent nothing to compare. */
  was?: number;
  /** What the database says. */
  now?: number;
  message: string;
}

export interface Resolution {
  items: ResolvedItem[];
  /** Non-fatal differences worth showing the customer before they pay. */
  changes: ResolutionChange[];
  /** Fatal problems — an order must not be created while any of these stand. */
  blockers: ResolutionChange[];
  subtotal: number;
}

interface CatalogEntry {
  _id: unknown;
  name: string;
  price: number;
  stock: number;
  isActive: boolean;
  image: string;
}

/**
 * A build part and a catalogue product live in different collections, so the line
 * carries its own `itemType`. Older carts (persisted in localStorage before the field
 * existed) send nothing, so an absent type falls back to trying both collections.
 */
async function findCatalogEntry(
  id: string,
  itemType?: OrderItemType
): Promise<{ entry: CatalogEntry; itemType: OrderItemType } | null> {
  const tryProduct = async (): Promise<CatalogEntry | null> => {
    const p = await Product.findById(id).select('name price stock isActive images').lean<{
      _id: unknown; name: string; price: number; stock: number; isActive: boolean; images?: string[];
    } | null>();
    if (!p) return null;
    return { _id: p._id, name: p.name, price: p.price, stock: p.stock, isActive: p.isActive, image: p.images?.[0] || '' };
  };

  const tryComponent = async (): Promise<CatalogEntry | null> => {
    const c = await PCComponent.findById(id).select('name price stock isActive image type').lean<{
      _id: unknown; name: string; price: number; stock: number; isActive: boolean; image?: string; type: string;
    } | null>();
    if (!c) return null;
    return { _id: c._id, name: `${c.type}: ${c.name}`, price: c.price, stock: c.stock, isActive: c.isActive, image: c.image || '' };
  };

  if (itemType === 'component') {
    const entry = await tryComponent();
    return entry ? { entry, itemType: 'component' } : null;
  }
  if (itemType === 'product') {
    const entry = await tryProduct();
    return entry ? { entry, itemType: 'product' } : null;
  }

  const product = await tryProduct();
  if (product) return { entry: product, itemType: 'product' };
  const component = await tryComponent();
  return component ? { entry: component, itemType: 'component' } : null;
}

/**
 * Rebuilds every cart line from the database: authoritative price, name, image and
 * stock. Client-sent prices are compared, never trusted — a mismatch becomes a
 * `change` the caller can surface before taking money.
 */
export async function resolveOrderItems(
  requested: RequestedItem[]
): Promise<Resolution> {
  const items: ResolvedItem[] = [];
  const changes: ResolutionChange[] = [];
  const blockers: ResolutionChange[] = [];
  let subtotal = 0;

  for (const line of requested) {
    const found = await findCatalogEntry(line.product, line.itemType);

    if (!found) {
      blockers.push({
        product: line.product,
        name: line.name || 'Item',
        kind: 'unavailable',
        message: `"${line.name || 'This item'}" is no longer in our catalogue. Remove it to continue.`,
      });
      continue;
    }

    const { entry, itemType } = found;

    if (!entry.isActive) {
      blockers.push({
        product: line.product,
        name: entry.name,
        kind: 'unavailable',
        message: `"${entry.name}" is no longer available. Remove it to continue.`,
      });
      continue;
    }

    if (entry.stock < line.quantity) {
      blockers.push({
        product: line.product,
        name: entry.name,
        kind: 'stock',
        was: line.quantity,
        now: entry.stock,
        message:
          entry.stock === 0
            ? `"${entry.name}" just went out of stock.`
            : `Only ${entry.stock} left of "${entry.name}" — reduce the quantity to continue.`,
      });
      continue;
    }

    if (typeof line.price === 'number' && Math.abs(line.price - entry.price) > 0.009) {
      changes.push({
        product: line.product,
        name: entry.name,
        kind: 'price',
        was: line.price,
        now: entry.price,
        message: `The price of "${entry.name}" changed.`,
      });
    }

    subtotal += entry.price * line.quantity;
    items.push({
      product: String(entry._id),
      itemType,
      name: entry.name,
      price: entry.price,
      quantity: line.quantity,
      image: entry.image,
      stock: entry.stock,
    });
  }

  return { items, changes, blockers, subtotal };
}

/**
 * Decrements stock for every line atomically, one conditional update per line: the
 * update only matches while enough stock remains, so two orders racing for the last
 * unit cannot both succeed and stock can never go negative.
 *
 * Returns the lines that could not be taken. On partial failure the caller must put
 * back whatever was already taken — `restoreStock` does that.
 */
export async function decrementStock(
  items: ResolvedItem[]
): Promise<{ ok: boolean; failed: ResolvedItem[]; taken: ResolvedItem[] }> {
  const taken: ResolvedItem[] = [];
  const failed: ResolvedItem[] = [];

  for (const item of items) {
    const Model = item.itemType === 'component' ? PCComponent : Product;
    const updated = await Model.findOneAndUpdate(
      { _id: item.product, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { new: true }
    );
    if (updated) {
      taken.push(item);
    } else {
      failed.push(item);
    }
  }

  return { ok: failed.length === 0, failed, taken };
}

/** Puts stock back — used to unwind a partially-taken order. */
export async function restoreStock(items: ResolvedItem[]): Promise<void> {
  for (const item of items) {
    const Model = item.itemType === 'component' ? PCComponent : Product;
    await Model.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
  }
}
