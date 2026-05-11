import React from 'react';

export const ChipGroup = ({ 
  options, 
  value, 
  onChange, 
  severityMap = {},
  multiSelect = true // Defaults to true to keep C15 multi-select working
}: { 
  options: string[], 
  value: string | string[], 
  onChange: (val: string | string[]) => void, // Now accepts both strings and arrays
  severityMap?: Record<string, string>,
  multiSelect?: boolean
}) => {
  
  const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);

  const handleToggle = (opt: string) => {
    if (multiSelect) {
      if (selectedValues.includes(opt)) {
        onChange(selectedValues.filter(item => item !== opt));
      } else {
        onChange([...selectedValues, opt]);
      }
    } else {
      // SINGLE SELECT MODE: 
      // If it's already selected, clear it (deselect). Otherwise, set it to the new string.
      if (selectedValues.includes(opt)) {
        onChange(""); 
      } else {
        onChange(opt);
      }
    }
  };

  return (
    <div className="chip-group">
      {options.map(opt => {
        const isSelected = selectedValues.includes(opt);
        const severityClass = isSelected && severityMap[opt] ? `active-${severityMap[opt]}` : isSelected ? 'active' : '';
        
        return (
          <div 
            key={opt} 
            className={`chip ${severityClass}`} 
            onClick={() => handleToggle(opt)}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            {opt}
          </div>
        );
      })}
    </div>
  );
};