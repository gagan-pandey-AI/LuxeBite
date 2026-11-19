"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Pencil, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import type { MenuItemRow } from "@/types/database";
import type { MenuCategory } from "@/types/menu";
import { trapTabKey } from "@/components/admin/focus-trap";

const categories: MenuCategory[] = [
  "Starters",
  "Main Course",
  "Chef Specials",
  "Desserts",
  "Beverages",
];

type MenuDraft = {
  id: string;
  name: string;
  description: string;
  price: string;
  category: MenuCategory;
  image_url: string;
  image_storage_path: string | null;
  image_alt: string;
  ingredients: string;
  is_vegetarian: boolean;
  is_bestseller: boolean;
  is_chef_recommended: boolean;
  is_featured: boolean;
  is_available: boolean;
  sort_order: string;
};

function emptyDraft(): MenuDraft {
  return {
    id: "",
    name: "",
    description: "",
    price: "",
    category: "Starters",
    image_url: "",
    image_storage_path: null,
    image_alt: "",
    ingredients: "",
    is_vegetarian: false,
    is_bestseller: false,
    is_chef_recommended: false,
    is_featured: false,
    is_available: true,
    sort_order: "0",
  };
}

function toDraft(item: MenuItemRow): MenuDraft {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: String(item.price),
    category: item.category,
    image_url: item.image_url,
    image_storage_path: item.image_storage_path,
    image_alt: item.image_alt,
    ingredients: item.ingredients.join(", "),
    is_vegetarian: item.is_vegetarian,
    is_bestseller: item.is_bestseller,
    is_chef_recommended: item.is_chef_recommended,
    is_featured: item.is_featured,
    is_available: item.is_available,
    sort_order: String(item.sort_order),
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function MenuManager() {
  const [items, setItems] = useState<MenuItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MenuDraft>(emptyDraft);
  const [formOpen, setFormOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/menu-items", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message ?? "Menu items could not be loaded.");
      setItems(result.items as MenuItemRow[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Menu items could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadItems(); }, [loadItems]);

  useEffect(() => {
    if (!formOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving && !uploading) setFormOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [formOpen, saving, uploading]);

  function openCreate() {
    setEditingId(null);
    setDraft(emptyDraft());
    setError("");
    setFormOpen(true);
  }

  function openEdit(item: MenuItemRow) {
    setEditingId(item.id);
    setDraft(toDraft(item));
    setError("");
    setFormOpen(true);
  }

  function updateDraft<Key extends keyof MenuDraft>(key: Key, value: MenuDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function uploadImage(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.set("image", file);
    try {
      const response = await fetch("/api/admin/menu-items/upload", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message ?? "The image could not be uploaded.");
      setDraft((current) => ({
        ...current,
        image_url: result.imageUrl,
        image_storage_path: result.path,
        image_alt: current.image_alt || current.name,
      }));
      setNotice("Image uploaded. Save the menu item to publish this change.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "The image could not be uploaded.");
    } finally {
      setUploading(false);
    }
  }

  async function saveItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
      ...(editingId ? {} : { id: slugify(draft.id || draft.name) }),
      name: draft.name,
      description: draft.description,
      price: Number(draft.price),
      category: draft.category,
      image_url: draft.image_url,
      image_storage_path: draft.image_storage_path,
      image_alt: draft.image_alt,
      ingredients: draft.ingredients.split(",").map((part) => part.trim()).filter(Boolean),
      is_vegetarian: draft.is_vegetarian,
      is_bestseller: draft.is_bestseller,
      is_chef_recommended: draft.is_chef_recommended,
      is_featured: draft.is_featured,
      is_available: draft.is_available,
      sort_order: Number(draft.sort_order),
    };

    try {
      const response = await fetch(
        editingId ? `/api/admin/menu-items/${editingId}` : "/api/admin/menu-items",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message ?? "The menu item could not be saved.");
      setNotice(editingId ? "Menu item updated." : "Menu item created.");
      setFormOpen(false);
      await loadItems();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "The menu item could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailability(item: MenuItemRow) {
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/menu-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_available: !item.is_available }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message ?? "Availability could not be changed.");
      setNotice(`${item.name} ${result.item.is_available ? "is now visible" : "has been hidden"} on the public menu.`);
      await loadItems();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Availability could not be changed.");
    }
  }

  async function deleteItem(item: MenuItemRow) {
    if (!window.confirm(`Permanently delete "${item.name}" from the menu?`)) return;
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/menu-items/${item.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message ?? "The menu item could not be deleted.");
      setNotice(result.warning ?? `${item.name} was deleted.`);
      await loadItems();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "The menu item could not be deleted.");
    }
  }

  return (
    <div className="admin-manager">
      <div className="admin-manager-toolbar">
        <p>Changes to available items appear on the public menu.</p>
        <button className="admin-primary-button" onClick={openCreate} type="button"><Plus size={16} /> Add menu item</button>
      </div>
      {notice && <p className="admin-inline-success" role="status">{notice}</p>}
      {error && (
        <div className="admin-inline-error" role="alert">
          <span>{error}</span>
          <button className="admin-text-button" onClick={() => void loadItems()} type="button">Retry</button>
        </div>
      )}
      <div className="admin-table-card">
        {loading ? (
          <div aria-label="Loading menu items" className="admin-table-skeleton" role="status"><span /><span /><span /><span /><span /></div>
        ) : !error && !items.length ? (
          <div className="admin-empty-state">
            <UtensilsCrossed aria-hidden="true" size={25} />
            <h2>The menu is ready for its first dish</h2>
            <p>Add an item to begin building the restaurant menu.</p>
            <button className="admin-primary-button" onClick={openCreate} type="button"><Plus size={16} /> Add menu item</button>
          </div>
        ) : !error ? (
          <div className="admin-table-scroll">
            <table className="admin-table admin-menu-table">
              <thead><tr><th>Dish</th><th>Category</th><th>Price</th><th>Public menu</th><th>Actions</th></tr></thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="admin-menu-name">
                        <img alt="" height="44" src={item.image_url} width="56" />
                        <span><strong>{item.name}</strong><small>{item.id}</small></span>
                      </div>
                    </td>
                    <td>{item.category}</td>
                    <td>₹{item.price.toLocaleString("en-IN")}</td>
                    <td>
                      <button
                        aria-checked={item.is_available}
                        aria-label={`${item.is_available ? "Hide" : "Show"} ${item.name} on the public menu`}
                        className={`admin-toggle${item.is_available ? " is-on" : ""}`}
                        onClick={() => void toggleAvailability(item)}
                        role="switch"
                        type="button"
                      ><span /></button>
                      <span className="admin-availability-label">{item.is_available ? "Visible" : "Hidden"}</span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button aria-label={`Edit ${item.name}`} className="admin-icon-button" onClick={() => openEdit(item)} type="button"><Pencil size={16} /></button>
                        <button aria-label={`Delete ${item.name}`} className="admin-icon-button is-danger" onClick={() => void deleteItem(item)} type="button"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {formOpen && (
        <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving && !uploading) setFormOpen(false); }}>
          <section aria-labelledby="menu-form-title" aria-modal="true" className="admin-detail-modal admin-form-modal" onKeyDown={trapTabKey} role="dialog">
            <button aria-label="Close menu item form" className="admin-modal-close" disabled={saving || uploading} onClick={() => setFormOpen(false)} ref={closeButtonRef} type="button">×</button>
            <span className="admin-eyebrow">THE OFFERING</span>
            <h2 id="menu-form-title">{editingId ? "Refine this dish" : "Add a dish"}</h2>
            <form className="admin-form-grid" onSubmit={(event) => void saveItem(event)}>
              <label className="admin-form-field">Dish name
                <input maxLength={100} minLength={2} onChange={(event) => updateDraft("name", event.target.value)} required value={draft.name} />
              </label>
              <label className="admin-form-field">URL slug
                <input disabled={Boolean(editingId)} maxLength={100} onChange={(event) => updateDraft("id", slugify(event.target.value))} placeholder={slugify(draft.name) || "dish-name"} value={editingId ? draft.id : draft.id || slugify(draft.name)} />
              </label>
              <label className="admin-form-field admin-form-wide">Description
                <textarea maxLength={300} minLength={3} onChange={(event) => updateDraft("description", event.target.value)} required rows={2} value={draft.description} />
              </label>
              <label className="admin-form-field">Price (INR)
                <input max={1000000} min={1} onChange={(event) => updateDraft("price", event.target.value)} required type="number" value={draft.price} />
              </label>
              <label className="admin-form-field">Category
                <select onChange={(event) => updateDraft("category", event.target.value as MenuCategory)} value={draft.category}>
                  {categories.map((category) => <option key={category}>{category}</option>)}
                </select>
              </label>
              <label className="admin-form-field admin-form-wide">Description ingredients
                <input onChange={(event) => updateDraft("ingredients", event.target.value)} placeholder="Separate ingredients with commas" value={draft.ingredients} />
              </label>
              <label className="admin-form-field admin-form-wide">Image URL
                <input onChange={(event) => { updateDraft("image_url", event.target.value); updateDraft("image_storage_path", null); }} placeholder="/images/dish.webp or an HTTPS URL" required value={draft.image_url} />
              </label>
              <label className="admin-form-field admin-form-wide">Image description (alt text)
                <input maxLength={240} minLength={3} onChange={(event) => updateDraft("image_alt", event.target.value)} required value={draft.image_alt} />
              </label>
              <label className="admin-upload-field">
                <ImagePlus aria-hidden="true" size={17} />
                <span>{uploading ? "Uploading image…" : "Upload JPEG, PNG or WebP (5 MB max)"}</span>
                <input accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(event) => void uploadImage(event.target.files?.[0])} type="file" />
              </label>
              <div className="admin-checkbox-grid">
                <CheckField checked={draft.is_vegetarian} label="Vegetarian" onChange={(value) => updateDraft("is_vegetarian", value)} />
                <CheckField checked={draft.is_bestseller} label="Bestseller" onChange={(value) => updateDraft("is_bestseller", value)} />
                <CheckField checked={draft.is_chef_recommended} label="Chef recommended" onChange={(value) => updateDraft("is_chef_recommended", value)} />
                <CheckField checked={draft.is_featured} label="Featured" onChange={(value) => updateDraft("is_featured", value)} />
                <CheckField checked={draft.is_available} label="Visible on public menu" onChange={(value) => updateDraft("is_available", value)} />
              </div>
              <div className="admin-modal-actions admin-form-wide">
                <button className="admin-action-button" disabled={saving || uploading} onClick={() => setFormOpen(false)} type="button">Cancel</button>
                <button className="admin-primary-button" disabled={saving || uploading} type="submit">{saving ? "Saving…" : editingId ? "Save changes" : "Create menu item"}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function CheckField({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="admin-checkbox-field">
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      <span>{label}</span>
    </label>
  );
}
