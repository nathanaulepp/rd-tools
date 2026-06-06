// src/widgets/AutosaveManager.tsx
// Extracted from CreateNotePage.tsx (Phase 3).
// Invisible component — renders nothing, just manages debounced autosave
// and cross-domain write-back from the Standards domain.
//
// Responsibilities:
//   • Debounced dietary autosave (1200ms after last change)
//   • Flush dietary debounce on domain switch (called imperatively via ref)
//   • Cross-domain update: Standards domain → clinical / labs stores

import { useEffect, useRef, useCallback } from "react";
import { useNoteStore }     from "../stores/useNoteStore";
import { useDietaryStore }  from "../stores/useDietaryStore";
import { useClinicalStore } from "../stores/useClinicalStore";
import { useLabsStore }     from "../stores/useLabsStore";

const DIETARY_DEBOUNCE_MS = 1200;

export interface AutosaveManagerRef {
  /** Flush any pending dietary debounce immediately. */
  flushDietary: () => void;
}

interface AutosaveManagerProps {
  /** Exposes flush handle to the parent via ref. */
  managerRef: React.MutableRefObject<AutosaveManagerRef>;
  /** Active domain key — flushes dietary when the user leaves domain "D". */
  activeDomain: string;
}

export default function AutosaveManager({
  managerRef,
  activeDomain,
}: AutosaveManagerProps) {
  const { noteId, saveDomain } = useNoteStore();
  const dietary = useDietaryStore((s) => s.dietary);
  const setClinical = useClinicalStore((s) => s.setClinical);
  const { labs, setLabs } = useLabsStore();

  // Keep a ref so the debounced callback always reads the latest dietary
  const dietaryRef = useRef(dietary);
  dietaryRef.current = dietary;

  const labsRef = useRef(labs);
  labsRef.current = labs;

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Flush helper ────────────────────────────────────────────────────────────
  const flush = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (!noteId) return;
    try {
      await saveDomain("dietary", dietaryRef.current);
    } catch (e) {
      console.error("AutosaveManager: dietary flush failed:", e);
    }
  }, [noteId, saveDomain]);

  // Expose flush to parent via ref
  useEffect(() => {
    managerRef.current = { flushDietary: flush };
  }, [managerRef, flush]);

  // ── Debounced dietary save on every dietary change ───────────────────────
  useEffect(() => {
    if (!noteId) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        await saveDomain("dietary", dietaryRef.current);
      } catch (e) {
        console.error("AutosaveManager: debounced dietary save failed:", e);
      }
    }, DIETARY_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dietary, noteId]);

  // ── Flush when leaving the Dietary domain ───────────────────────────────
  const prevDomainRef = useRef(activeDomain);
  useEffect(() => {
    if (prevDomainRef.current === "D" && activeDomain !== "D") {
      flush();
    }
    prevDomainRef.current = activeDomain;
  }, [activeDomain, flush]);

  // Invisible — renders nothing
  return null;
}