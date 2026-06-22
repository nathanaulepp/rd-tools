import React from "react";
import { PNState, PNFeed } from "../../../shared/types/index";
import { CollapseHeader } from "../../../shared/ui/CollapseHeader";
import { Field } from "../../../shared/ui/Field";
import { NumInput } from "../../../shared/ui/NumInput";
import { StatChip as NutrientChip } from "../../../shared/ui/StatChip";
import * as helper from "./helper";

interface PNPrescriptionMatrixProps {
  state: PNState;
  setState: (s: PNState) => void;
  patientWtKg: number;
  girWtKg: number;
  ageDays: number | null;
}

const ROUTES = ['CPN (Central)', 'PPN (Peripheral)'];
const DELIVERY_MODES = ["3-in-1 (TNA)", "2-in-1 + Separate Lipid Infusion", "3 Fully Separated Macros"];
const DURATIONS = ['Continuous (24 hr)', 'Cyclic (12 hr)', 'Cyclic (16 hr)', 'Cyclic (18 hr)'];
const AA_OPTIONS = ['AA 3.5%', 'AA 5%', 'AA 5.5%', 'AA 7%', 'AA 8.5%', 'AA 10%', 'AA 11.4%', 'AA 15%', 'AA 20%'];
const DEXT_OPTIONS = ['D70W', 'D50W', 'D40W', 'D20W', 'D10W', 'D5W'];
const LIPID_OPTIONS = ['ILE 20%', 'ILE 10%', 'SMOF 20%'];

export default function PNPrescriptionMatrix({ state, setState, patientWtKg, girWtKg, ageDays }: PNPrescriptionMatrixProps) {
  const addBag = () => setState({ ...state, bags: [...state.bags, helper.makePNFeed(state.nextId)], nextId: state.nextId + 1 });
  const updateBag = (id: number, updated: PNFeed) => setState({ ...state, bags: state.bags.map(b => b.id === id ? updated : b) });
  const removeBag = (id: number) => setState({ ...state, bags: state.bags.filter(b => b.id !== id) });

  return (
    <div className="card" style={{ marginBottom: "0.5rem", padding: "0.4rem 0.6rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.75rem" }}>
        <div style={{ fontSize: "1rem", fontWeight: 700, color: "#2d3748" }}>D13: Parenteral Nutrition (PN) Matrix</div>
        <button onClick={addBag} style={{ background: "#8e44ad", color: "#fff", border: "none", borderRadius: "5px", padding: "4px 10px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, whiteSpace: "nowrap" }}>
          + Add PN Bag
        </button>
      </div>

      {state.bags.map((bag, idx) => (
        <PNBagMatrix key={bag.id} bag={bag} idx={idx} onChange={updated => updateBag(bag.id, updated)} onRemove={() => removeBag(bag.id)} patientWtKg={patientWtKg} girWtKg={girWtKg} ageDays={ageDays} />
      ))}
    </div>
  );
}

function PNBagMatrix({ bag, idx, onChange, onRemove, patientWtKg, girWtKg, ageDays }: { bag: PNFeed; idx: number; onChange: (u: PNFeed) => void; onRemove: () => void; patientWtKg: number; girWtKg: number; ageDays: number | null }) {
  const update = (field: keyof PNFeed, val: any) => onChange({ ...bag, [field]: val });

  const durationHrs = (() => {
    const m = bag.dextDuration.match(/(\d+)\s*hr/);
    return m ? parseInt(m[1]) : 24;
  })();

  const isTNA = bag.delivery === "3-in-1 (TNA)";
  const isTwoInOne = bag.delivery === "2-in-1 + Separate Lipid Infusion";
  const isSeparated = bag.delivery === "3 Fully Separated Macros";

  const aaG = helper.num(bag.aaAmount);
  const dexG = helper.num(bag.dextAmount);
  const ileG = helper.num(bag.lipidAmount);

  const aaConcPct = helper.concFromSourceString(bag.aaConc || 'AA 15%');
  const dexConcPct = helper.concFromSourceString(bag.dextConc || 'D70W');
  const ileConcPct = helper.concFromSourceString(bag.lipidConc || 'ILE 20%');

  const { aaVol, dexVol, ileVol, swfiVol, additivesVol, compoundedVol, totalVol } = helper.calcPNBagVolumes(bag);
  const totalKcal = Math.round(aaG * 4 + dexG * 3.4 + ileG * 10);
  
  const compoundedRate = compoundedVol > 0 ? compoundedVol / durationHrs : 0;
  const ileRate = ileVol > 0 ? ileVol / bag.separateIleDurationHr : 0;

  const gir = helper.calcGIR(dexG, girWtKg);
  const girStat = gir !== null ? helper.girStatus(gir, ageDays) : null;

  const lipidPctKcal = totalKcal > 0 ? (ileG * 10 / totalKcal) * 100 : 0;
  const finalDexPct = compoundedVol > 0 ? (dexG / compoundedVol) * 100 : 0;

  const phosAmount = helper.num(bag.electrolytes.phos?.amount);
  const caAmount = helper.num(bag.electrolytes.ca?.amount);
  const caMMol = caAmount / 2;
  const caPRatio = phosAmount > 0 ? caMMol / phosAmount : 0;

  const rowStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "140px 100px 130px 110px 130px 80px 1fr", gap: "8px", alignItems: "center", padding: "4px 8px", borderBottom: "1px solid #f1f5f9" };
  const headerRowStyle: React.CSSProperties = { ...rowStyle, background: "#f8fafc", fontWeight: 700, fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase" };
  const sectionHeaderStyle: React.CSSProperties = { background: "#f1f5f9", padding: "4px 12px", fontSize: "0.68rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" };

  if (isSeparated) {
    return (
      <div style={{ border: "1px solid #e2e8f0", borderRadius: "7px", marginBottom: "1rem", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ flex: 1 }}>
            <CollapseHeader label={`PN Bag ${idx + 1}`} expanded={bag.expanded} onToggle={() => update("expanded", !bag.expanded)} accent="#8e44ad" />
          </div>
          <button onClick={onRemove} style={{ background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontSize: "0.9rem", padding: "0 12px", flexShrink: 0 }}>🗑</button>
        </div>
        {bag.expanded && (
          <div style={{ padding: "1.5rem", textAlign: "center", background: "#f8fafc", color: "#64748b" }}>
            <div style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>ℹ Fully separated delivery</div>
            <p style={{ fontSize: "0.85rem" }}>Document each component (Dextrose, AA, Lipids) as a separate bag entry for distinct rate and volume tracking.</p>
            <div style={{ marginTop: "1rem" }}>
              <select value={bag.delivery} onChange={e => update("delivery", e.target.value)} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                {DELIVERY_MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: "7px", marginBottom: "1rem", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ flex: 1 }}>
          <CollapseHeader
            label={`PN Bag ${idx + 1}`}
            expanded={bag.expanded}
            onToggle={() => update("expanded", !bag.expanded)}
            accent="#8e44ad"
          />
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{ background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontSize: "0.9rem", padding: "0 12px", flexShrink: 0 }}
          title="Remove bag"
        >
          🗑
        </button>
      </div>

      {bag.expanded && (
        <div style={{ background: "#fff" }}>
          {/* Config Bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(95px, 1fr))", gap: "6px", padding: "10px 12px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
            <Field label="Delivery">
              <select value={bag.delivery} onChange={e => update("delivery", e.target.value)} style={{ width: "100%", padding: "5px", borderRadius: "2px", border: "1px solid #e2e8f0", fontSize: "0.82rem" }}>
                {DELIVERY_MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Weight (kg)"><div style={{ padding: "5px 8px", background: "#edf2f7", borderRadius: "2px", fontSize: "0.85rem", fontWeight: 600 }}>{patientWtKg > 0 ? patientWtKg : "—"}</div></Field>
            <Field label="FW Goal (mL)"><NumInput value={bag.fwGoalMl} onChange={v => update("fwGoalMl", helper.num(v))} /></Field>
            <Field label="Route">
              <select value={bag.route} onChange={e => update("route", e.target.value)} style={{ width: "100%", padding: "5px", borderRadius: "2px", border: "1px solid #e2e8f0", fontSize: "0.82rem" }}>
                <option value="">Select Route</option>
                {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Duration">
              <select value={bag.dextDuration} onChange={e => update("dextDuration", e.target.value)} style={{ width: "100%", padding: "5px", borderRadius: "2px", border: "1px solid #e2e8f0", fontSize: "0.82rem" }}>
                <option value="">Select Duration</option>
                {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            {isTwoInOne && (
              <>
                <Field label="ILE Dur. hr"><NumInput value={bag.separateIleDurationHr} onChange={v => update("separateIleDurationHr", helper.num(v))} /></Field>
                <Field label="ILE Freq d/wk"><NumInput value={bag.separateIleFreqPerWeek} onChange={v => update("separateIleFreqPerWeek", helper.num(v))} /></Field>
              </>
            )}
            <Field label="Insulin (U)"><NumInput value={bag.insulinUnits} onChange={v => update("insulinUnits", v)} /></Field>
            <Field label="Start Date"><input type="date" value={bag.startDate} onChange={e => update("startDate", e.target.value)} style={{ width: "100%", padding: "4px", borderRadius: "2px", border: "1px solid #e2e8f0", fontSize: "0.82rem" }} /></Field>
          </div>

          {/* Matrix Table */}
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: "850px" }}>
              <div style={headerRowStyle}>
                <div>Component</div>
                <div>Order</div>
                <div>Clinical Index</div>
                <div>Energy</div>
                <div>Source Product</div>
                <div>Vol (mL)</div>
                <div>Final / Safety</div>
              </div>

              <div style={sectionHeaderStyle}>{isTwoInOne ? "Compounded bag (2-in-1)" : "Macronutrients"}</div>

              {/* AA */}
              <div style={rowStyle}>
                <div style={{ fontWeight: 600 }}>Amino Acids</div>
                <NumInput value={bag.aaAmount} onChange={v => update("aaAmount", v)} placeholder="g" />
                <div style={{ fontSize: "0.8rem" }}>{patientWtKg > 0 ? (aaG / patientWtKg).toFixed(1) + " g/kg" : "—"}</div>
                <div style={{ fontSize: "0.8rem" }}>
                  <strong>{Math.round(aaG * 4)}</strong> kcal
                  <div style={{ fontSize: "0.65rem", color: "#718096" }}>{totalKcal > 0 ? Math.round((aaG * 4 / totalKcal) * 100) : 0}% total</div>
                </div>
                <select value={bag.aaConc || 'AA 15%'} onChange={e => update("aaConc", e.target.value)} style={{ padding: "4px", borderRadius: "4px", border: "1px solid #e2e8f0", fontSize: "0.82rem" }}>
                  {AA_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <div style={{ fontSize: "0.8rem" }}>{Math.round(aaVol)}</div>
                <div style={{ fontSize: "0.8rem", color: "#718096" }}>{(compoundedVol > 0 ? (aaG / compoundedVol * 100) : 0).toFixed(1)}% final</div>
              </div>

              {/* Dextrose */}
              <div style={rowStyle}>
                <div style={{ fontWeight: 600 }}>Dextrose</div>
                <NumInput value={bag.dextAmount} onChange={v => update("dextAmount", v)} placeholder="g" />
                <div style={{ fontSize: "0.75rem" }}>
                  {patientWtKg > 0 ? (dexG / patientWtKg).toFixed(1) + " g/kg" : "—"}
                  <div style={{ color: girStat?.color || "inherit", fontWeight: 700 }}>GIR: {gir?.toFixed(2) || "—"}</div>
                </div>
                <div style={{ fontSize: "0.8rem" }}>
                  <strong>{Math.round(dexG * 3.4)}</strong> kcal
                  <div style={{ fontSize: "0.65rem", color: "#718096" }}>{totalKcal > 0 ? Math.round((dexG * 3.4 / totalKcal) * 100) : 0}% total</div>
                </div>
                <select value={bag.dextConc || 'D70W'} onChange={e => update("dextConc", e.target.value)} style={{ padding: "4px", borderRadius: "4px", border: "1px solid #e2e8f0", fontSize: "0.82rem" }}>
                  {DEXT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <div style={{ fontSize: "0.8rem" }}>{Math.round(dexVol)}</div>
                <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                   <span style={{ fontSize: "0.75rem", color: "#718096" }}>{finalDexPct.toFixed(1)}% final</span>
                   {girStat && <span style={{ fontSize: "0.62rem", background: girStat.bg, color: girStat.color, padding: "1px 5px", borderRadius: "4px", fontWeight: 700 }}>{girStat.label}</span>}
                </div>
              </div>

              {/* 2-in-1 Compounded Total */}
              {isTwoInOne && (
                <div style={{ ...rowStyle, borderTop: "1px solid #e2e8f0", fontWeight: 700, background: "#fdfaff" }}>
                   <div>Subtotal (2-in-1)</div>
                   <div>—</div>
                   <div>—</div>
                   <div>{Math.round(aaG * 4 + dexG * 3.4)} kcal</div>
                   <div>Total comp. vol</div>
                   <div>{compoundedVol} mL</div>
                   <div style={{ fontSize: "0.82rem" }}>{compoundedRate.toFixed(1)} mL/hr × {durationHrs} hr</div>
                </div>
              )}

              {/* Lipids Section */}
              <div style={sectionHeaderStyle}>{isTwoInOne ? "Separate ILE infusion" : ""}</div>
              <div style={rowStyle}>
                <div style={{ fontWeight: 600 }}>Lipids (ILE)</div>
                <NumInput value={bag.lipidAmount} onChange={v => update("lipidAmount", v)} placeholder="g" />
                <div style={{ fontSize: "0.75rem" }}>
                  {patientWtKg > 0 ? (ileG / patientWtKg).toFixed(1) + " g/kg" : "—"}
                  <div style={{ fontSize: "0.65rem", color: "#94a3b8" }}>(max 2.5)</div>
                </div>
                <div style={{ fontSize: "0.8rem" }}>
                  <strong>{Math.round(ileG * 10)}</strong> kcal
                  <div style={{ fontSize: "0.65rem", color: "#718096" }}>{totalKcal > 0 ? Math.round((ileG * 10 / totalKcal) * 100) : 0}% total</div>
                </div>
                <select value={bag.lipidConc || 'ILE 20%'} onChange={e => update("lipidConc", e.target.value)} style={{ padding: "4px", borderRadius: "4px", border: "1px solid #e2e8f0", fontSize: "0.82rem" }}>
                  {LIPID_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <div style={{ fontSize: "0.8rem" }}>{Math.round(ileVol)}</div>
                <div style={{ fontSize: "0.75rem" }}>
                  {isTwoInOne ? (
                    <div style={{ color: "#2d3748" }}>{ileRate.toFixed(1)} mL/hr × {bag.separateIleDurationHr} hr ({bag.separateIleFreqPerWeek}×/wk)</div>
                  ) : (
                    <span style={{ color: lipidPctKcal > 30 ? "#e67e22" : "#718096", fontWeight: lipidPctKcal > 30 ? 700 : 400 }}>
                      {lipidPctKcal > 30 && "⚠ "}{Math.round(lipidPctKcal)}% of kcal
                    </span>
                  )}
                </div>
              </div>

              <div style={sectionHeaderStyle}>Electrolytes & Additives</div>
              {[
                { k: 'na', l: 'Sodium', u: 'mEq', s: 'NaCl / NaAcetate' },
                { k: 'k', l: 'Potassium', u: 'mEq', s: 'KCl / KPhos' },
                { k: 'mg', l: 'Magnesium', u: 'mEq', s: 'MgSO4' },
                { k: 'ca', l: 'Calcium', u: 'mEq', s: 'Ca gluconate' },
                { k: 'phos', l: 'Phosphorus', u: 'mmol', s: 'NaPhos / KPhos' },
                { k: 'cl', l: 'Chloride', u: 'mEq', s: 'Custom' },
                { k: 'acetate', l: 'Acetate', u: 'mEq', s: 'Custom' },
              ].map(elec => {
                const val = bag.electrolytes[elec.k] || { amount: "", unit: elec.u };
                return (
                  <div key={elec.k} style={rowStyle}>
                    <div style={{ fontSize: "0.85rem" }}>{elec.l} ({elec.u})</div>
                    <NumInput value={val.amount ?? ""} onChange={v => onChange({ ...bag, electrolytes: { ...bag.electrolytes, [elec.k]: { ...val, amount: v } } })} placeholder={elec.u} />
                    <div>—</div>
                    <div>—</div>
                    <div style={{ fontSize: "0.75rem", color: "#718096" }}>{elec.s}</div>
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>(in adds)</div>
                    <div>
                      {elec.k === 'ca' && phosAmount > 0 && (
                        <div style={{ fontSize: "0.75rem", color: (caPRatio < 1 || caPRatio > 1.3) ? "#e53e3e" : "#38a169", fontWeight: 700 }}>
                          Ca:P ratio {caPRatio.toFixed(2)} {(caPRatio < 1 || caPRatio > 1.3) && "⚠"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              <div style={sectionHeaderStyle}>MVI / Trace Elements</div>
              <div style={rowStyle}>
                <div style={{ fontSize: "0.85rem" }}>Multivitamins & TE</div>
                <div style={{ fontSize: "0.8rem" }}>Per bag</div>
                <div>—</div>
                <div>—</div>
                <div style={{ fontSize: "0.75rem", color: "#718096" }}>MVI 10 mL / TE 3 mL</div>
                <div style={{ fontSize: "0.8rem" }}>100</div>
                <div>—</div>
              </div>

              <div style={sectionHeaderStyle}>Free Water</div>
              {isTNA ? (
                <div style={{ ...rowStyle, background: "#eff6ff" }}>
                  <div style={{ fontWeight: 700, color: "#1e40af" }}>Free Water</div>
                  <div style={{ fontSize: "0.78rem", color: "#1e40af", fontWeight: 700 }}>{bag.fwGoalMl} mL goal</div>
                  <div style={{ fontSize: "0.75rem", color: "#1e40af" }}>100% FW need</div>
                  <div style={{ fontSize: "0.8rem", color: "#1e40af" }}>0 kcal</div>
                  <div style={{ fontSize: "0.8rem", color: "#1e40af" }}>SWFI</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#2563eb" }}>{swfiVol}</div>
                  <div style={{ fontSize: "0.72rem", color: "#60a5fa", fontStyle: "italic" }}>Auto-filled to meet FW goal</div>
                </div>
              ) : (
                <div style={{ ...rowStyle, background: "#f8fafc", color: "#94a3b8" }}>
                   <div style={{ fontWeight: 600 }}>Free Water</div>
                   <div>—</div>
                   <div style={{ fontSize: "0.72rem", fontStyle: "italic" }}>Note: add SWFI to the compounded bag only</div>
                   <div>0 kcal</div>
                   <div>SWFI</div>
                   <div style={{ fontWeight: 700, color: "#64748b" }}>{swfiVol}</div>
                   <div style={{ fontSize: "0.7rem" }}>Not applicable for separate ILE</div>
                </div>
              )}

              {/* Total Row */}
              <div style={{ ...rowStyle, borderTop: "2px solid #2c3e50", fontWeight: 800, background: "#f8fafc" }}>
                <div>Total Delivery<div style={{ fontSize: "0.62rem", fontWeight: 400, color: "#718096" }}>Wt: {patientWtKg} kg</div></div>
                <div>—</div>
                <div>{patientWtKg > 0 ? (totalKcal / patientWtKg).toFixed(1) : "—"} kcal/kg</div>
                <div style={{ fontSize: "1rem" }}>{totalKcal} kcal</div>
                <div style={{ fontSize: "0.75rem", color: "#718096" }}>Total Daily Volume</div>
                <div style={{ fontSize: "1rem" }}>{totalVol} mL</div>
                <div>{totalVol > 0 && isTNA && <span style={{ fontSize: "0.85rem", color: "#2d3748" }}>{compoundedRate.toFixed(1)} mL/hr × {durationHrs} hr</span>}</div>
              </div>
            </div>
          </div>

          {/* Summary flowsheet strip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.75rem",
              padding: "8px 12px",
              borderTop: "1px solid #e2e8f0",
              fontSize: "0.72rem",
            }}
          >
            <div style={{ fontWeight: 700, color: "#8e44ad", marginRight: "0.25rem" }}>PN Totals:</div>
            
            <div style={{ flex: 1.2, minWidth: "105px" }}>
              <div style={{ fontSize: "0.62rem", color: "#718096", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "2px" }}>Total Energy</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#e67e22" }}>
                {totalKcal} <span style={{ fontSize: "0.65rem", fontWeight: 500, color: "#718096" }}>kcal/d</span>
              </div>
            </div>

            <div style={{ flex: 1.5, minWidth: "125px", borderLeft: "1px solid #e2e8f0", paddingLeft: "0.5rem" }}>
              <div style={{ fontSize: "0.62rem", color: "#718096", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "2px" }}>Protein</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#8e44ad" }}>
                {aaG} <span style={{ fontSize: "0.65rem", fontWeight: 500, color: "#718096" }}>g/d ({patientWtKg > 0 ? (aaG / patientWtKg).toFixed(1) : "—"} g/kg)</span>
              </div>
            </div>

            <div style={{ flex: 1.2, minWidth: "95px", borderLeft: "1px solid #e2e8f0", paddingLeft: "0.5rem" }}>
              <div style={{ fontSize: "0.62rem", color: "#718096", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "2px" }}>Total Volume</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#3498db" }}>
                {totalVol} <span style={{ fontSize: "0.65rem", fontWeight: 500, color: "#718096" }}>mL/d</span>
              </div>
            </div>

            <div style={{ flex: 1.2, minWidth: "90px", borderLeft: "1px solid #e2e8f0", paddingLeft: "0.5rem" }}>
              <div style={{ fontSize: "0.62rem", color: "#718096", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "2px" }}>GIR</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#d69e2e" }}>
                {gir?.toFixed(2) || "—"} <span style={{ fontSize: "0.65rem", fontWeight: 500, color: "#718096" }}>mg/kg/m</span>
              </div>
            </div>

            <div style={{ flex: 1.2, minWidth: "95px", borderLeft: "1px solid #e2e8f0", paddingLeft: "0.5rem" }}>
              <div style={{ fontSize: "0.62rem", color: "#718096", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "2px" }}>SWFI</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#2563eb" }}>
                {swfiVol} <span style={{ fontSize: "0.65rem", fontWeight: 500, color: "#718096" }}>mL/d</span>
              </div>
            </div>
          </div>

          {/* Safety Notes */}
          <div style={{ padding: "0 12px 12px", fontSize: "0.7rem", color: "#718096" }}>
            <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
              <span>• Lipid kcal: <strong>{Math.round(lipidPctKcal)}%</strong> {lipidPctKcal > 30 ? <span style={{ color: "#e67e22" }}> (High, target {"<30%"})</span> : "(Target <30%)"}</span>
              <span>• Compounded Dex: <strong>{finalDexPct.toFixed(1)}%</strong> {finalDexPct > 25 ? <span style={{ color: "#e53e3e" }}> (Central access required)</span> : "(Safe for peripheral if PPN)"}</span>
              {phosAmount > 0 && <span>• Ca:P Ratio: <strong>{caPRatio.toFixed(2)}</strong> {(caPRatio < 1 || caPRatio > 1.3) ? <span style={{ color: "#e53e3e" }}> (Risk of precipitation)</span> : "(Stable)"}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
