import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, Moon, Sun } from 'lucide-react';
import { EXAMPLE_PRESETS, MODEL_PRESETS } from '../data/presets';
import type { ExamplePreset, ModelPresetId } from '../types/simulator';
import { PWAInstallButton } from './PWAInstallButton';

interface WorkspaceToolbarProps {
  modelPresetId: ModelPresetId;
  customContextLimit: number;
  onSelectModel: (id: ModelPresetId) => void;
  onChangeCustomLimit: (limit: number) => void;
  onLoadPreset: (preset: ExamplePreset) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  lastSavedAt: string;
}

export const WorkspaceToolbar: React.FC<WorkspaceToolbarProps> = ({
  modelPresetId,
  customContextLimit,
  onSelectModel,
  onChangeCustomLimit,
  onLoadPreset,
  isDark,
  onToggleTheme,
  lastSavedAt,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const formattedSavedTime = (() => {
    try {
      return new Date(lastSavedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Saved locally';
    }
  })();

  return (
    <section
      aria-label="Workspace configuration"
      className="border-b border-slate-200 bg-slate-50/70 dark:border-slate-800/80 dark:bg-[#0e1629]"
    >
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          {/* Model Segmented Control */}
          <div
            role="group"
            aria-label="Model context preset"
            className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900"
          >
            {MODEL_PRESETS.map((preset) => {
              const active = preset.id === modelPresetId;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectModel(preset.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                    active
                      ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Custom Limit Slider when Custom preset is selected */}
          {modelPresetId === 'custom' && (
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900">
              <label
                htmlFor="custom-limit-slider"
                className="text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap"
              >
                Custom Limit
              </label>
              <input
                id="custom-limit-slider"
                type="range"
                min={4096}
                max={2000000}
                step={4096}
                value={customContextLimit}
                onChange={(e) => onChangeCustomLimit(Number(e.target.value))}
                className="sim-slider w-28 sm:w-36 bg-slate-200 dark:bg-slate-700"
              />
              <span className="font-mono text-xs font-medium tabular-nums text-sky-600 dark:text-sky-400 whitespace-nowrap">
                {customContextLimit.toLocaleString()} tok
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums whitespace-nowrap">
            Local draft · {formattedSavedTime}
          </span>

          <div className="flex items-center gap-2">
            {/* Load Example Preset Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((o) => !o)}
                aria-expanded={dropdownOpen}
                aria-haspopup="listbox"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                <span>Load Example Preset</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-150 ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {dropdownOpen && (
                <div
                  role="listbox"
                  aria-label="Example presets"
                  className="absolute right-0 z-40 mt-2 w-72 sm:w-80 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
                >
                  {EXAMPLE_PRESETS.map((preset) => {
                    const isSelected = activePresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setActivePresetId(preset.id);
                          onLoadPreset(preset);
                          setDropdownOpen(false);
                        }}
                        className="flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
                            <span>{preset.label}</span>
                            <span aria-hidden="true" className="text-slate-400">
                              ·
                            </span>
                            <span className="font-normal text-slate-500 dark:text-slate-400">
                              {preset.category}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {preset.description}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <PWAInstallButton />

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              {isDark ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
