import React, { createContext, useContext, useEffect, useRef } from 'react';

/**
 * Supported shortcut keys. 
 * Formatted as "Modifiers+Key" (e.g., "Control+S", "Shift+Escape", or just "Escape").
 * Modifiers must be in alphabetical order: Alt, Control, Meta, Shift.
 */
export type ShortcutKey = 
  | 'Escape'
  | 'Control+.'; // Add more as needed

type ShortcutHandler = () => void;

interface ShortcutContextType {
  registerShortcut: (key: ShortcutKey, handler: ShortcutHandler) => void;
  unregisterShortcut: (key: ShortcutKey, handler: ShortcutHandler) => void;
}

const ShortcutContext = createContext<ShortcutContextType | undefined>(undefined);

/**
 * ShortcutProvider manages stacks of handlers for different keyboard shortcuts.
 */
export const ShortcutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Map of ShortcutKey -> Stack of handlers
  const handlersMapRef = useRef<Record<string, ShortcutHandler[]>>({});

  const registerShortcut = (key: ShortcutKey, handler: ShortcutHandler) => {
    if (!handlersMapRef.current[key]) {
      handlersMapRef.current[key] = [];
    }
    handlersMapRef.current[key].push(handler);
  };

  const unregisterShortcut = (key: ShortcutKey, handler: ShortcutHandler) => {
    if (handlersMapRef.current[key]) {
      handlersMapRef.current[key] = handlersMapRef.current[key].filter(h => h !== handler);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Build the string key from the event
      const modifiers: string[] = [];
      if (e.altKey) modifiers.push('Alt');
      if (e.ctrlKey) modifiers.push('Control');
      if (e.metaKey) modifiers.push('Meta');
      if (e.shiftKey) modifiers.push('Shift');
      
      // Standardize key name for matching (e.g., Esc -> Escape)
      const keyName = e.key === 'Esc' ? 'Escape' : e.key;
      
      // Ignore modifier-only presses
      if (['Alt', 'Control', 'Meta', 'Shift'].includes(keyName)) return;

      const combo = modifiers.length > 0 ? `${modifiers.join('+')}+${keyName}` : keyName;
      
      // Check if we have any handlers for this exact combination
      const handlers = handlersMapRef.current[combo];
      if (handlers && handlers.length > 0) {
        // Prevent browser default (e.g., Ctrl+S saving page)
        e.preventDefault();
        e.stopPropagation();
        
        // Execute topmost handler
        const topHandler = handlers[handlers.length - 1];
        topHandler();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ShortcutContext.Provider value={{ registerShortcut, unregisterShortcut }}>
      {children}
    </ShortcutContext.Provider>
  );
};

/**
 * useShortcut registers a callback for a specific shortcut key.
 * Automatically handles cleanup on unmount.
 */
export const useShortcut = (key: ShortcutKey, onTrigger: ShortcutHandler, enabled: boolean = true) => {
  const context = useContext(ShortcutContext);
  if (!context) {
    throw new Error('useShortcut must be used within a ShortcutProvider');
  }

  const { registerShortcut, unregisterShortcut } = context;

  // Stable handler ref to avoid re-registration cycles
  const handlerRef = useRef(onTrigger);
  useEffect(() => {
    handlerRef.current = onTrigger;
  }, [onTrigger]);

  useEffect(() => {
    if (!enabled) return;

    const handler = () => handlerRef.current();
    registerShortcut(key, handler);
    return () => unregisterShortcut(key, handler);
  }, [key, registerShortcut, unregisterShortcut, enabled]);
};

/**
 * Legacy support for the escape-only backout logic
 */
export const useEscapeBackout = (onBackout: ShortcutHandler, enabled: boolean = true) => {
  useShortcut('Escape', onBackout, enabled);
};
