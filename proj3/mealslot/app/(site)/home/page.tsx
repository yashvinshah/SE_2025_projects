"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { SlotMachine } from "@/components/SlotMachine";
import { PowerUps } from "@/components/PowerUps";
import FilterMenu from "@/components/FilterMenu";
import DishCountInput from "@/components/DishCountInput";
import { Dish, PowerUpsInput, RecipeJSON } from "@/lib/schemas";
import { cn } from "@/components/ui/cn";
import Modal from "@/components/ui/Modal";
import RecipePanel from "@/components/RecipePanel";
import MapWithPins from "@/components/MapWithPins";
import VideoPanel, { Video } from "@/components/VideoPanel";


type Venue = {
  id: string;
  name: string;
  addr: string;
  rating: number;
  price: string;
  url: string;
  cuisine: string;
  distance_km: number;
};

function HomePage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [dishCount, setDishCount] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [powerups, setPowerups] = useState<PowerUpsInput>({});
  const [selection, setSelection] = useState<Dish[]>([]);
  const [busy, setBusy] = useState(false);
  const [cooldownMs, setCooldownMs] = useState(0);

  const [recipes, setRecipes] = useState<RecipeJSON[] | null>(null);
  const [venues, setVenues] = useState<Venue[] | null>(null);
  const [openRecipeModal, setOpenRecipeModal] = useState(false);
  const [videosByDish, setVideosByDish] = useState<Record<string, Video[]>>({});
  const [openVideoModal, setOpenVideoModal] = useState(false);


  const cuisines = useMemo(() => {
    // Extract the "name" property from each selected item
    const names = selection.map((d) => d.name).filter(Boolean);

    // Fallback list if nothing is selected
    return names.length ? names : ["american", "asian", "italian"];
  }, [selection]);

  useEffect(() => {
    let t: number | undefined;
    if (cooldownMs > 0) {
      t = window.setInterval(() => setCooldownMs((ms) => Math.max(0, ms - 250)), 250);
    }
    return () => (t ? clearInterval(t) : undefined);
  }, [cooldownMs]);

  const onSpin = async (locked: { index: number; dishId: string }[]) => {
    if (categories.length === 0) {
      alert("Please select at least one category");
      return;
    }
    if (dishCount === 0) {
      alert("Please select at least 1 dish count");
      return;
    }
    setBusy(true);
    // Preserve previous selection so locked dishes remain visible during spin
    const previousSelection = selection;
    try {
      console.log("Spinning with:", { categories, dishCount, tags: selectedTags, allergens: selectedAllergens });

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const res = await fetch("/api/spin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ categories, tags: selectedTags, allergens: selectedAllergens, locked, powerups, dishCount }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        const errorMsg = j.message || j.issues?.[0]?.message || `HTTP ${res.status}`;
        console.error("Spin failed:", errorMsg, j);
        alert(`Spin failed: ${errorMsg}`);
        setBusy(false);
        return;
      }

      const data = await res.json();
      console.log("Spin response:", data);

      if (!data.selection || !Array.isArray(data.selection) || data.selection.length === 0) {
        console.error("Invalid response - no selection:", data);
        alert("Spin returned no dishes. Please try again.");
        setBusy(false);
        return;
      }

      // Merge new selection with locked dishes - API should return locked dishes, but preserve from previous if API doesn't match
      const lockedMap = new Map(locked.map(l => [l.index, l.dishId]));
      const mergedSelection: Dish[] = [];
      
      // Build the selection array maintaining proper index alignment
      for (let i = 0; i < dishCount; i++) {
        const lockedDishId = lockedMap.get(i);
        if (lockedDishId) {
          // This slot is locked - prefer API response if it matches, otherwise use previous selection
          if (data.selection[i]?.id === lockedDishId) {
            // API returned the locked dish - use it (might have updated data)
            mergedSelection[i] = data.selection[i];
          } else if (previousSelection[i]?.id === lockedDishId) {
            // API didn't return the locked dish, but previous selection has it - preserve it
            mergedSelection[i] = previousSelection[i];
          } else if (data.selection[i]) {
            // Fallback to API response if previous selection doesn't match either
            mergedSelection[i] = data.selection[i];
          }
          // If none match, mergedSelection[i] will be undefined (sparse array)
        } else {
          // Not locked - always use new dish from API response
          if (data.selection[i]) {
            mergedSelection[i] = data.selection[i];
          }
        }
      }

      // Set selection immediately so dishes appear on cards
      // The API should return dishes for all requested slots, so mergedSelection should be complete
      // Create new array reference to ensure React detects the change
      setSelection([...mergedSelection]);
      
      // Keep busy state for a bit to allow reveal animation
      await new Promise(resolve => setTimeout(resolve, 1600));
      setRecipes(null);
      setVenues(null);
      setOpenVideoModal(false);
      setCooldownMs(3000);

      // Fetch videos in background so the UI can reveal selection immediately
      fetchVideos(mergedSelection).catch((e) => console.error("fetchVideos failed:", e));
    } catch (error) {
      console.error("Spin error:", error);
      if (error instanceof Error && error.name === "AbortError") {
        alert("Spin request timed out. Please check your connection and try again.");
      } else {
        alert(`Spin failed: ${error instanceof Error ? error.message : "Network error"}`);
      }
    } finally {
      setBusy(false);
    }
  };

  const fetchVideos = async (dishes: Dish[]) => {
    if (!dishes.length) return;

    const dishNames = dishes.map(d => d.name);

    const res = await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dishes: dishNames }),
    });

    const data = await res.json();
    if (res.ok) {
      setVideosByDish(data.results);
    } else {
      console.error("Failed to fetch videos", data);
    }
  };


  const fetchVenues = async (coords?: { lat: number; lng: number }) => {
    const body: any = { cuisines };
    if (coords) {
      body.lat = coords.lat;
      body.lng = coords.lng;
    } else {
      body.locationHint = "Denver"; // fallback city
    }

    const r = await fetch("/api/places", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    const j = await r.json();
    console.log("API response:", j);

    // Normalize results
    let normalized: any[] = [];
    if (Array.isArray(j.venues)) {
      normalized = j.venues;
    } else if (j.results && typeof j.results === "object") {
      normalized = Object.values(j.results).flat();
    } else if (Array.isArray(j)) {
      normalized = j;
    }

    console.log("Normalized venues:", normalized);
    setVenues(normalized);
  };


  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-white p-6 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-3 text-xl font-bold text-neutral-900 dark:text-neutral-100">Choose Categories</h2>
        <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
          Select one or more meal types
        </p>
        <div className="flex flex-wrap gap-3">
          {["Breakfast", "Lunch", "Dinner", "Dessert"].map((c) => {
            const catLower = c.toLowerCase();
            const active = categories.includes(catLower);
            return (
              <button
                key={catLower}
                type="button"
                className={cn(
                  "rounded-full border-2 px-5 py-2.5 text-sm font-semibold transition-all duration-200",
                  active
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-500 shadow-md scale-105 dark:from-orange-600 dark:to-orange-700"
                    : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400 hover:scale-105 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700 dark:hover:bg-neutral-700"
                )}
                onClick={() => {
                  setCategories((prev) =>
                    prev.includes(catLower)
                      ? prev.filter((cat) => cat !== catLower)
                      : [...prev, catLower]
                  );
                }}
                aria-pressed={active}
              >
                {c}
              </button>
            );
          })}
        </div>
        {categories.length > 0 && (
          <div className="mt-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Selected: {categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(", ")}
          </div>
        )}
      </section>

      <FilterMenu
        onTagChange={setSelectedTags}
        onAllergenChange={setSelectedAllergens}
      />

      <PowerUps value={powerups} onChange={setPowerups} />

      <section className="rounded-2xl border bg-white p-6 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
        <DishCountInput value={dishCount} onChange={setDishCount} />
      </section>

      <SlotMachine
        reelCount={dishCount}
        onSpin={onSpin}
        cooldownMs={cooldownMs}
        busy={busy}
        selection={selection}
      />

      {selection.length > 0 && (
        <section className="rounded-2xl border bg-white p-6 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-4 text-xl font-bold text-neutral-900 dark:text-neutral-100">Selected Dishes</h2>
          <ul className="mb-4 space-y-2">
            {selection.map((d, i) => (
              <li key={`${d.id}_${i}`} className="flex items-center gap-2 rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800">
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{d.name}</span>
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">({d.category})</span>
              </li>
            ))}
          </ul>
          <div className="flex gap-3">
            <button
              className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:from-blue-600 hover:to-blue-700 hover:scale-105 active:scale-95"
              onClick={() => setOpenVideoModal(true)}
            >
              🍳 Cook at Home
            </button>
            <button
              className="rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:from-green-600 hover:to-green-700 hover:scale-105 active:scale-95"
              onClick={() => {
                if ("geolocation" in navigator) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      fetchVenues({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    },
                    (err) => {
                      console.warn("Geolocation error or denied:", err);
                      // fallback if denied
                      fetchVenues();
                    },
                    { maximumAge: 1000 * 60 * 5, timeout: 10000 }
                  );
                } else {
                  console.warn("Geolocation not supported");
                  fetchVenues();
                }
              }}
            >
              🍽️ Eat Outside
            </button>
          </div>
        </section>
      )}

      <Modal
        open={openVideoModal && !!videosByDish}
        title="Cook at Home — Recipes"
        onClose={() => setOpenVideoModal(false)}
      >
        <VideoPanel videosByDish={videosByDish} />
      </Modal>

      <section id="outside" className="rounded-2xl border bg-white p-6 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-3 text-xl font-bold text-neutral-900 dark:text-neutral-100">Eat Outside</h2>
        <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">Shows stubbed venues; "Using city-level location."</p>
        {venues && (
          <>
            <div className="mt-4 grid gap-4 md:grid-cols-2" aria-label="Venue list">
              {venues.map((v) => (
                <div key={v.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 shadow-sm transition-all hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800">
                  <div className="mb-2 text-lg font-bold text-neutral-900 dark:text-neutral-100">{v.name}</div>
                  <div className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    {v.cuisine} • {v.price} • {v.rating.toFixed(1)}★ • {v.distance_km} km
                  </div>
                  <div className="mb-3 text-sm text-neutral-500 dark:text-neutral-500">{v.addr}</div>
                  <a
                    className="inline-block rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-blue-600"
                    href={v.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Visit website →
                  </a>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <MapWithPins venues={venues} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}

// Client-only page to avoid hydration noise from extensions/timers.
export default dynamic(() => Promise.resolve(HomePage), { ssr: false });

