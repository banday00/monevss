'use client';

import { useState } from 'react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  filters: {
    key: string;
    label: string;
    type: 'select' | 'date' | 'year';
    options?: FilterOption[];
    placeholder?: string;
  }[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onReset?: () => void;
}

export default function FilterBar({ filters, values, onChange, onReset }: FilterBarProps) {
  const [expanded, setExpanded] = useState(true);

  const hasActiveFilters = Object.values(values).some((v) => v !== '' && v !== 'all');

  return (
    <div className="filter-bar">
      <div className="filter-bar-header">
        <button
          className="filter-toggle"
          onClick={() => setExpanded(!expanded)}
        >
          🔍 Filter {expanded ? '▴' : '▾'}
        </button>
        {hasActiveFilters && onReset && (
          <button className="filter-reset" onClick={onReset}>
            ✕ Reset Filter
          </button>
        )}
      </div>

      {expanded && (
        <div className="filter-bar-content">
          {filters.map((filter) => (
            <div key={filter.key} className="filter-item">
              <label className="filter-label">{filter.label}</label>
              {filter.type === 'select' && (
                <select
                  className="filter-select"
                  value={values[filter.key] || ''}
                  onChange={(e) => onChange(filter.key, e.target.value)}
                >
                  <option value="">{filter.placeholder || `Semua ${filter.label}`}</option>
                  {filter.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
              {filter.type === 'date' && (
                <input
                  className="filter-input"
                  type="date"
                  value={values[filter.key] || ''}
                  onChange={(e) => onChange(filter.key, e.target.value)}
                />
              )}
              {filter.type === 'year' && (
                <select
                  className="filter-select"
                  value={values[filter.key] || ''}
                  onChange={(e) => onChange(filter.key, e.target.value)}
                >
                  <option value="">Semua Tahun</option>
                  {Array.from({ length: 5 }, (_, i) => {
                    const y = new Date().getFullYear() - i;
                    return (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
