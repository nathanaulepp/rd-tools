// src/features/tools/MercuryCalculator.tsx
// Mercury intake calculator based on FDA data (1990-2012)
// RfD: 0.1 μg/kg/day (EPA reference dose for vulnerable populations)

import React, { useState, useMemo } from "react";

// ─── Fish Data (FDA Mercury Levels in Commercial Fish and Shellfish 1990-2012) ─

const FISH_DATA: { name: string; ppm: number }[] = [
  { name: "Scallop", ppm: 0.003 },
  { name: "Clam", ppm: 0.009 },
  { name: "Shrimp", ppm: 0.009 },
  { name: "Oyster", ppm: 0.012 },
  { name: "Sardine", ppm: 0.013 },
  { name: "Tilapia", ppm: 0.013 },
  { name: "Salmon (Canned)", ppm: 0.014 },
  { name: "Anchovies", ppm: 0.016 },
  { name: "Salmon (Fresh/Frozen)", ppm: 0.022 },
  { name: "Catfish", ppm: 0.024 },
  { name: "Squid", ppm: 0.024 },
  { name: "Pollock", ppm: 0.031 },
  { name: "Crawfish", ppm: 0.033 },
  { name: "Shad", ppm: 0.038 },
  { name: "Mackerel Atlantic (N. Atlantic)", ppm: 0.05 },
  { name: "Mullet", ppm: 0.05 },
  { name: "Whiting", ppm: 0.051 },
  { name: "Haddock (Atlantic)", ppm: 0.055 },
  { name: "Flatfish", ppm: 0.056 },
  { name: "Butterfish", ppm: 0.058 },
  { name: "Crab", ppm: 0.065 },
  { name: "Croaker Atlantic", ppm: 0.069 },
  { name: "Trout (Freshwater)", ppm: 0.071 },
  { name: "Herring", ppm: 0.078 },
  { name: "Hake", ppm: 0.079 },
  { name: "Jacksmelt", ppm: 0.081 },
  { name: "Mackerel Chub (Pacific)", ppm: 0.088 },
  { name: "Whitefish", ppm: 0.089 },
  { name: "Sheepshead", ppm: 0.09 },
  { name: "Lobster (Spiny)", ppm: 0.093 },
  { name: "Pickerel", ppm: 0.095 },
  { name: "Lobster (Northern/American)", ppm: 0.107 },
  { name: "Carp", ppm: 0.11 },
  { name: "Cod", ppm: 0.111 },
  { name: "Perch Ocean", ppm: 0.121 },
  { name: "Tuna (Canned, Light)", ppm: 0.126 },
  { name: "Buffalofish", ppm: 0.137 },
  { name: "Skate", ppm: 0.137 },
  { name: "Tilefish (Atlantic)", ppm: 0.144 },
  { name: "Tuna (Fresh/Frozen, Skipjack)", ppm: 0.144 },
  { name: "Perch (Freshwater)", ppm: 0.15 },
  { name: "Monkfish", ppm: 0.161 },
  { name: "Lobster (Species Unknown)", ppm: 0.166 },
  { name: "Snapper", ppm: 0.166 },
  { name: "Bass (Saltwater, Black, Striped, Rockfish)", ppm: 0.167 },
  { name: "Mahi Mahi", ppm: 0.178 },
  { name: "Scorpionfish", ppm: 0.233 },
  { name: "Weakfish (Sea Trout)", ppm: 0.235 },
  { name: "Halibut", ppm: 0.241 },
  { name: "Croaker White (Pacific)", ppm: 0.287 },
  { name: "Tuna (Canned, Albacore)", ppm: 0.35 },
  { name: "Bass Chilean", ppm: 0.354 },
  { name: "Tuna (Fresh/Frozen, Yellowfin)", ppm: 0.354 },
  { name: "Tuna (Fresh/Frozen, Albacore)", ppm: 0.358 },
  { name: "Sablefish", ppm: 0.361 },
  { name: "Bluefish", ppm: 0.368 },
  { name: "Tuna (Fresh/Frozen, All)", ppm: 0.386 },
  { name: "Tuna (Fresh/Frozen, Species Unknown)", ppm: 0.41 },
  { name: "Grouper (All Species)", ppm: 0.448 },
  { name: "Spanish Mackerel (Gulf of Mexico)", ppm: 0.454 },
  { name: "Marlin", ppm: 0.485 },
  { name: "Orange Roughy", ppm: 0.571 },
  { name: "Tuna (Fresh/Frozen, Bigeye)", ppm: 0.689 },
  { name: "King Mackerel", ppm: 0.73 },
  { name: "Shark", ppm: 0.979 },
  { name: "Swordfish", ppm: 0.995 },
  { name: "Tilefish (Gulf of Mexico)", ppm: 1.123 },
  { name: "Spanish Mackerel (S. Atlantic)", ppm: 1.82 },
];

// Sort low → high by ppm
FISH_DATA.sort((a, b) => a.ppm - b.ppm);

// ─── Risk tier helper ─────────────────────────────────────────────────────────

function getRiskTier(pct: number): {
  label: string;
  color: string;
  bg: string;
  border: string;
} {
  if (pct <= 50)  return { label: "Safe",     color: "#166534", bg: "#f0fdf4", border: "#86efac" };
  if (pct <= 80)  return { label: "Moderate", color: "#92400e", bg: "#fffbeb", border: "#fcd34d" };
  if (pct <= 100) return { label: "At Limit", color: "#c2410c", bg: "#fff7ed", border: "#fb923c" };
  return                  { label: "Exceeds", color: "#991b1b", bg: "#fef2f2", border: "#fca5a5" };
}

function getMercuryRiskColor(ppm: number): string {
  if (ppm < 0.1)  return "#16a34a";
  if (ppm < 0.2)  return "#ca8a04";
  if (ppm < 0.5)  return "#ea580c";
  return "#dc2626";
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface FishEntry {
  id: number;
  fishName: string;
  amountG: string;
  frequencyUnit: "day" | "week" | "month" | "year";
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function FishSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return FISH_DATA.filter((f) => f.name.toLowerCase().includes(q));
  }, [query]);

  const selected = FISH_DATA.find((f) => f.name === value);

  return (
    <div style={{ position: "relative", flex: 1 }}>
      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
        <input
          type="text"
          value={open ? query : value}
          onFocus={() => { setQuery(""); setOpen(true); }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          placeholder="Search fish or shellfish…"
          style={{
            flex: 1,
            padding: "6px 10px",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            fontSize: "0.85rem",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
        {selected && (
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: "8px",
              background: "#f1f5f9",
              color: getMercuryRiskColor(selected.ppm),
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {selected.ppm} ppm
          </span>
        )}
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 500,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            maxHeight: "240px",
            overflowY: "auto",
          }}
        >
          {filtered.length === 0 && (
            <div style={{ padding: "0.75rem 1rem", fontSize: "0.82rem", color: "#94a3b8" }}>
              No fish found
            </div>
          )}
          {filtered.map((f) => (
            <button
              key={f.name}
              onMouseDown={() => { onChange(f.name); setQuery(f.name); setOpen(false); }}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                textAlign: "left",
                padding: "7px 12px",
                background: "none",
                border: "none",
                borderBottom: "1px solid #f8fafc",
                fontSize: "0.83rem",
                cursor: "pointer",
                color: "#1e293b",
                gap: "8px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f7ff")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <span style={{ flex: 1 }}>{f.name}</span>
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: getMercuryRiskColor(f.ppm),
                  flexShrink: 0,
                }}
              >
                {f.ppm} ppm
              </span>
              <div
                style={{
                  width: "40px",
                  height: "6px",
                  borderRadius: "3px",
                  background: "#f1f5f9",
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${Math.min((f.ppm / 2) * 100, 100)}%`,
                    height: "100%",
                    background: getMercuryRiskColor(f.ppm),
                    borderRadius: "3px",
                  }}
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function MercuryCalculator() {
  const [weightKg, setWeightKg] = useState<string>("");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const [rfd, setRfd] = useState<"0.1" | "0.3">("0.1");
  const [population, setPopulation] = useState<
    "pregnant" | "child" | "adult"
  >("adult");

  const [entries, setEntries] = useState<FishEntry[]>([
    { id: 1, fishName: "", amountG: "", frequencyUnit: "week" },
  ]);

  const nextId = React.useRef(2);

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      { id: nextId.current++, fishName: "", amountG: "", frequencyUnit: "week" },
    ]);
  };

  const removeEntry = (id: number) =>
    setEntries((prev) => prev.filter((e) => e.id !== id));

  const updateEntry = (id: number, field: keyof FishEntry, val: string) =>
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: val } : e))
    );

  // ── Derived calcs ────────────────────────────────────────────────────────────

  const weightInKg = useMemo(() => {
    const w = parseFloat(weightKg);
    if (!w || w <= 0) return null;
    return weightUnit === "lbs" ? w / 2.2046 : w;
  }, [weightKg, weightUnit]);

  const rfdValue = parseFloat(rfd);

  // Max safe daily intake (g/day) for a given fish ppm
  const maxSafeGPerDay = (ppm: number) => {
    if (!weightInKg || ppm <= 0) return null;
    // RfD (μg/kg/day) × weight (kg) / concentration (μg/g) = g/day
    return (rfdValue * weightInKg) / ppm;
  };

  // Convert entered amount to g/day
  const toGPerDay = (amountG: number, unit: FishEntry["frequencyUnit"]) => {
    switch (unit) {
      case "day":   return amountG;
      case "week":  return amountG / 7;
      case "month": return amountG / 30.4375;
      case "year":  return amountG / 365.25;
    }
  };

  // Per-entry mercury load (μg/day)
  const entryResults = useMemo(() => {
    return entries.map((e) => {
      const fish = FISH_DATA.find((f) => f.name === e.fishName);
      const amt = parseFloat(e.amountG);
      if (!fish || !amt || amt <= 0) return null;
      const gPerDay = toGPerDay(amt, e.frequencyUnit);
      const mercuryMcgPerDay = gPerDay * fish.ppm;
      const maxGPerDay = maxSafeGPerDay(fish.ppm);
      const pctRfd = weightInKg
        ? (mercuryMcgPerDay / (rfdValue * weightInKg)) * 100
        : null;
      return {
        id: e.id,
        fish,
        gPerDay,
        mercuryMcgPerDay,
        maxGPerDay,
        pctRfd,
        maxGPerWeek: maxGPerDay ? maxGPerDay * 7 : null,
      };
    });
  }, [entries, weightInKg, rfdValue]);

  const totalMercuryMcgPerDay = entryResults.reduce(
    (sum, r) => sum + (r?.mercuryMcgPerDay ?? 0),
    0
  );

  const totalPctRfd =
    weightInKg && totalMercuryMcgPerDay > 0
      ? (totalMercuryMcgPerDay / (rfdValue * weightInKg)) * 100
      : null;

  const totalRisk = totalPctRfd != null ? getRiskTier(totalPctRfd) : null;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: "900px" }}>

      {/* Header */}
      <div className="card" style={{ marginBottom: "1rem", borderLeft: "4px solid #0891b2" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#0c4a6e" }}>
              🐟 Dietary Mercury Exposure Calculator
            </h4>
            <p style={{ margin: "3px 0 0", fontSize: "0.72rem", color: "#64748b" }}>
              Based on FDA Mercury Levels in Commercial Fish & Shellfish (1990–2012) · EPA RfD guidance
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b" }}>Population:</span>
            {(["pregnant", "child", "adult"] as const).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPopulation(p);
                  setRfd(p === "adult" ? "0.3" : "0.1");
                }}
                style={{
                  padding: "3px 10px",
                  borderRadius: "10px",
                  border: "1px solid",
                  borderColor: population === p ? "#0891b2" : "#e2e8f0",
                  background: population === p ? "#e0f2fe" : "transparent",
                  color: population === p ? "#0c4a6e" : "#64748b",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {p === "pregnant" ? "⚠ Pregnant/Fetus" : p === "child" ? "Child" : "Adult"}
              </button>
            ))}
          </div>
        </div>

        {/* Weight + RfD row */}
        <div style={{ display: "flex", gap: "1rem", marginTop: "0.85rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Body Weight
            </label>
            <div style={{ display: "flex", gap: "4px" }}>
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="e.g. 70"
                style={{ width: "90px", padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "0.88rem" }}
              />
              <select
                value={weightUnit}
                onChange={(e) => setWeightUnit(e.target.value as "kg" | "lbs")}
                style={{ padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "0.82rem" }}
              >
                <option value="kg">kg</option>
                <option value="lbs">lbs</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Reference Dose (RfD)
            </label>
            <div style={{ display: "flex", gap: "4px" }}>
              {(["0.1", "0.3"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setRfd(v)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid",
                    borderColor: rfd === v ? "#0891b2" : "#e2e8f0",
                    background: rfd === v ? "#0891b2" : "transparent",
                    color: rfd === v ? "#fff" : "#64748b",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {v} μg/kg/day
                </button>
              ))}
            </div>
          </div>

          <div style={{ fontSize: "0.7rem", color: "#94a3b8", maxWidth: "260px", lineHeight: 1.4, alignSelf: "flex-end", paddingBottom: "2px" }}>
            {rfd === "0.1"
              ? "⚠ Conservative EPA limit (pregnant women, fetuses, children)"
              : "EPA original limit for general population"}
          </div>
        </div>
      </div>

      {/* Fish Entries */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
          <h4 style={{ margin: 0, fontSize: "0.9rem", color: "var(--primary)" }}>
            Fish & Shellfish Consumed
          </h4>
          <button
            onClick={addEntry}
            style={{ background: "#0891b2", color: "#fff", border: "none", borderRadius: "5px", padding: "5px 12px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
          >
            + Add Fish
          </button>
        </div>

        {entries.map((entry, idx) => {
          const result = entryResults[idx];
          const risk = result?.pctRfd != null ? getRiskTier(result.pctRfd) : null;

          return (
            <div
              key={entry.id}
              style={{
                border: "1px solid #e2e8f0",
                borderLeft: `3px solid ${risk?.color ?? "#94a3b8"}`,
                borderRadius: "6px",
                padding: "0.65rem 0.75rem",
                marginBottom: "0.6rem",
                background: risk?.bg ?? "#fafafa",
              }}
            >
              {/* Top row: fish selector + amount + frequency + remove */}
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ flex: 2, minWidth: "200px" }}>
                  <FishSelector
                    value={entry.fishName}
                    onChange={(v) => updateEntry(entry.id, "fishName", v)}
                  />
                </div>

                <div style={{ display: "flex", gap: "4px", alignItems: "center", flex: 1, minWidth: "180px" }}>
                  <input
                    type="number"
                    value={entry.amountG}
                    onChange={(e) => updateEntry(entry.id, "amountG", e.target.value)}
                    placeholder="Amount (g)"
                    style={{ flex: 1, padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "0.85rem", minWidth: "80px" }}
                  />
                  <select
                    value={entry.frequencyUnit}
                    onChange={(e) => updateEntry(entry.id, "frequencyUnit", e.target.value as FishEntry["frequencyUnit"])}
                    style={{ padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "0.82rem" }}
                  >
                    <option value="day">g/day</option>
                    <option value="week">g/week</option>
                    <option value="month">g/month</option>
                    <option value="year">g/year</option>
                  </select>
                </div>

                {entries.length > 1 && (
                  <button
                    onClick={() => removeEntry(entry.id)}
                    style={{ background: "none", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: "4px", padding: "5px 8px", cursor: "pointer", fontSize: "0.7rem", flexShrink: 0 }}
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Result row */}
              {result && (
                <div style={{ display: "flex", gap: "12px", marginTop: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                    <strong>{result.mercuryMcgPerDay.toFixed(3)} μg Hg/day</strong>
                  </span>
                  {result.pctRfd != null && (
                    <>
                      <div style={{ flex: 1, minWidth: "120px", maxWidth: "200px" }}>
                        <div style={{ height: "6px", borderRadius: "3px", background: "#e2e8f0", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${Math.min(result.pctRfd, 100)}%`,
                              height: "100%",
                              background: risk?.color ?? "#94a3b8",
                              borderRadius: "3px",
                              transition: "width 0.3s",
                            }}
                          />
                        </div>
                      </div>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: risk?.color }}>
                        {result.pctRfd.toFixed(1)}% of RfD
                      </span>
                      <span style={{ fontSize: "0.65rem", fontWeight: 800, padding: "1px 7px", borderRadius: "8px", background: risk?.bg, color: risk?.color, border: `1px solid ${risk?.border}` }}>
                        {risk?.label}
                      </span>
                    </>
                  )}
                  {result.maxGPerWeek && (
                    <span style={{ fontSize: "0.68rem", color: "#94a3b8", marginLeft: "auto" }}>
                      Max safe: {result.maxGPerWeek.toFixed(0)} g/wk ({(result.maxGPerWeek / 28.35).toFixed(1)} oz/wk)
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Total Summary */}
      {totalPctRfd != null && totalRisk && (
        <div
          className="card"
          style={{
            border: `1px solid ${totalRisk.border}`,
            background: totalRisk.bg,
            marginBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                Total Daily Mercury Exposure
              </div>
              <div style={{ display: "flex", gap: "16px", alignItems: "baseline" }}>
                <span style={{ fontSize: "1.5rem", fontWeight: 800, color: totalRisk.color }}>
                  {totalMercuryMcgPerDay.toFixed(3)} μg/day
                </span>
                <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#64748b" }}>
                  {totalPctRfd.toFixed(1)}% of {rfd} μg/kg/day RfD
                </span>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "1rem",
                  fontWeight: 900,
                  padding: "8px 20px",
                  borderRadius: "12px",
                  background: totalRisk.color,
                  color: "#fff",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {totalRisk.label}
              </div>
              {weightInKg && (
                <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: "4px" }}>
                  RfD limit: {(rfdValue * weightInKg).toFixed(2)} μg/day for {weightInKg.toFixed(1)} kg
                </div>
              )}
            </div>
          </div>

          {/* Full-width bar */}
          <div style={{ marginTop: "1rem", height: "10px", borderRadius: "5px", background: "#e2e8f0", overflow: "hidden" }}>
            <div
              style={{
                width: `${Math.min(totalPctRfd, 100)}%`,
                height: "100%",
                background: totalRisk.color,
                borderRadius: "5px",
                transition: "width 0.4s",
              }}
            />
          </div>

          {totalPctRfd > 100 && (
            <div style={{ marginTop: "0.75rem", fontSize: "0.78rem", color: "#991b1b", fontWeight: 600, display: "flex", gap: "6px", alignItems: "flex-start" }}>
              <span>⚠</span>
              <span>Intake exceeds the reference dose. Consider reducing high-mercury fish and substituting lower-mercury alternatives.</span>
            </div>
          )}
          {population === "pregnant" && totalPctRfd > 50 && (
            <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#92400e", fontWeight: 600, display: "flex", gap: "6px", alignItems: "flex-start" }}>
              <span>🤰</span>
              <span>
                For pregnant women, breastfeeding mothers, and young children, the FDA recommends avoiding high-mercury fish (shark, swordfish, king mackerel, tilefish) and limiting albacore tuna to 6 oz/week.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Reference Table */}
      <div className="card">
        <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", color: "var(--primary)" }}>
          FDA Mercury Reference Table — All Species
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "4px" }}>
          {FISH_DATA.map((f) => (
            <div
              key={f.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "5px 8px",
                borderRadius: "4px",
                background: "#fafafa",
                fontSize: "0.75rem",
                gap: "8px",
                cursor: "pointer",
                border: "1px solid #f1f5f9",
              }}
              onClick={() => {
                const emptyIdx = entries.findIndex((e) => !e.fishName);
                if (emptyIdx >= 0) {
                  updateEntry(entries[emptyIdx].id, "fishName", f.name);
                } else {
                  setEntries((prev) => [
                    ...prev,
                    { id: nextId.current++, fishName: f.name, amountG: "", frequencyUnit: "week" },
                  ]);
                }
              }}
              title={`Click to add ${f.name} to calculator`}
            >
              <span style={{ flex: 1, color: "#334155" }}>{f.name}</span>
              <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                <div style={{ width: "36px", height: "5px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${Math.min((f.ppm / 2) * 100, 100)}%`,
                      height: "100%",
                      background: getMercuryRiskColor(f.ppm),
                      borderRadius: "3px",
                    }}
                  />
                </div>
                <span style={{ fontWeight: 700, color: getMercuryRiskColor(f.ppm), fontSize: "0.68rem", minWidth: "45px", textAlign: "right" }}>
                  {f.ppm} ppm
                </span>
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: "0.75rem", marginBottom: 0, lineHeight: 1.5 }}>
          Source: FDA Mercury Levels in Commercial Fish and Shellfish (1990–2012). ppm = μg/g = mg/kg (wet weight).
          Large predatory fish (e.g., Spanish Mackerel S. Atlantic) may have over- or under-estimated values due to small sample sizes.
          Click any row to add it to the calculator above.
        </p>
      </div>
    </div>
  );
}