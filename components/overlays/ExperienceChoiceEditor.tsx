"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExperienceChoicePreview } from "@/components/overlays/ExperienceChoicePreview";
import type {
  ChoiceImageSlot,
  ExperienceChoiceConfig,
} from "@/lib/experience-choice-config";

type ExperienceChoiceEditorProps = {
  config: ExperienceChoiceConfig;
  onChange: (next: ExperienceChoiceConfig) => void;
  onReset: () => void;
  onClose: () => void;
  onChoose: (mode: "wonderland" | "matrix") => void;
  onChooseAndGo: (path: string) => void;
};

const imageSlotLabels: Record<ChoiceImageSlot, string> = {
  panelA: "Panel image A",
  panelB: "Panel image B",
  redCard: "Red card image",
  blueCard: "Blue card image",
};

type DragState = {
  slot: ChoiceImageSlot;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
};

function updateAtPath(
  config: ExperienceChoiceConfig,
  section: keyof ExperienceChoiceConfig,
  key: string,
  value: string | number,
): ExperienceChoiceConfig {
  return {
    ...config,
    [section]: {
      ...(config[section] as Record<string, string | number>),
      [key]: value,
    },
  } as ExperienceChoiceConfig;
}

export function ExperienceChoiceEditor({
  config,
  onChange,
  onReset,
  onClose,
  onChoose,
  onChooseAndGo,
}: ExperienceChoiceEditorProps) {
  const [selectedLayer, setSelectedLayer] = useState<ChoiceImageSlot>("panelA");
  const dragRef = useRef<DragState | null>(null);
  const selectedLayerConfig = config.images[selectedLayer];

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const deltaX = event.clientX - drag.startClientX;
      const deltaY = event.clientY - drag.startClientY;
      onChange({
        ...config,
        images: {
          ...config.images,
          [drag.slot]: {
            ...config.images[drag.slot],
            x: Math.round(drag.startX + deltaX),
            y: Math.round(drag.startY + deltaY),
          },
        },
      });
    };
    const handlePointerUp = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      dragRef.current = null;
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [config, onChange]);

  const textFields = useMemo(
    () =>
      [
        ["eyebrow", "Eyebrow"],
        ["title", "Title"],
        ["description", "Description"],
        ["redLabel", "Red label"],
        ["redTitle", "Red title"],
        ["redBody", "Red body"],
        ["blueLabel", "Blue label"],
        ["blueTitle", "Blue title"],
        ["blueBody", "Blue body"],
        ["quickStartLabel", "Quick-start label"],
        ["quickStartBody", "Quick-start body"],
      ] as const,
    [],
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
        <ExperienceChoicePreview
          config={config}
          onChoose={onChoose}
          onChooseAndGo={onChooseAndGo}
          editorMode
          selectedLayer={selectedLayer}
          onLayerPointerDown={(slot, event) => {
            event.preventDefault();
            event.stopPropagation();
            setSelectedLayer(slot);
            dragRef.current = {
              slot,
              pointerId: event.pointerId,
              startClientX: event.clientX,
              startClientY: event.clientY,
              startX: config.images[slot].x,
              startY: config.images[slot].y,
            };
          }}
        />
      </div>

      <aside className="max-h-[92dvh] overflow-y-auto rounded-2xl border border-white/15 bg-[#090d17]/95 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-white/90">
            Popup editor
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/20 px-2 py-1 text-xs text-white/80 hover:border-white/40"
          >
            Close
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">Copy</p>
          {textFields.map(([key, label]) => (
            <label key={key} className="block">
              <span className="mb-1 block text-[11px] text-white/60">{label}</span>
              {key.includes("description") || key.includes("Body") ? (
                <textarea
                  value={config.copy[key]}
                  rows={3}
                  onChange={(event) => onChange(updateAtPath(config, "copy", key, event.target.value))}
                  className="w-full rounded-md border border-white/20 bg-black/35 px-2 py-1 text-xs text-white"
                />
              ) : (
                <input
                  value={config.copy[key]}
                  onChange={(event) => onChange(updateAtPath(config, "copy", key, event.target.value))}
                  className="w-full rounded-md border border-white/20 bg-black/35 px-2 py-1 text-xs text-white"
                />
              )}
            </label>
          ))}
        </div>

        <div className="mt-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">Typography</p>
          <label className="block">
            <span className="mb-1 block text-[11px] text-white/60">Title font</span>
            <select
              value={config.typography.titleFont}
              onChange={(event) =>
                onChange(updateAtPath(config, "typography", "titleFont", event.target.value))
              }
              className="w-full rounded-md border border-white/20 bg-black/35 px-2 py-1 text-xs text-white"
            >
              <option value="sans">Sans</option>
              <option value="serif">Serif</option>
              <option value="neon">Neon</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] text-white/60">Body font</span>
            <select
              value={config.typography.bodyFont}
              onChange={(event) =>
                onChange(updateAtPath(config, "typography", "bodyFont", event.target.value))
              }
              className="w-full rounded-md border border-white/20 bg-black/35 px-2 py-1 text-xs text-white"
            >
              <option value="sans">Sans</option>
              <option value="serif">Serif</option>
              <option value="neon">Neon</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] text-white/60">Title size</span>
            <input
              type="range"
              min={22}
              max={72}
              value={config.typography.titleSizePx}
              onChange={(event) =>
                onChange(updateAtPath(config, "typography", "titleSizePx", Number(event.target.value)))
              }
              className="w-full"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] text-white/60">Body size</span>
            <input
              type="range"
              min={12}
              max={24}
              value={config.typography.bodySizePx}
              onChange={(event) =>
                onChange(updateAtPath(config, "typography", "bodySizePx", Number(event.target.value)))
              }
              className="w-full"
            />
          </label>
        </div>

        <div className="mt-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">Colors</p>
          {(
            [
              ["title", "Title color"],
              ["body", "Body color"],
              ["modalBgFrom", "Background from"],
              ["modalBgTo", "Background to"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block">
              <span className="mb-1 block text-[11px] text-white/60">{label}</span>
              <input
                value={config.colors[key]}
                onChange={(event) => onChange(updateAtPath(config, "colors", key, event.target.value))}
                className="w-full rounded-md border border-white/20 bg-black/35 px-2 py-1 text-xs text-white"
              />
            </label>
          ))}
        </div>

        <div className="mt-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">Images</p>
          <label className="block">
            <span className="mb-1 block text-[11px] text-white/60">Selected layer</span>
            <select
              value={selectedLayer}
              onChange={(event) => setSelectedLayer(event.target.value as ChoiceImageSlot)}
              className="w-full rounded-md border border-white/20 bg-black/35 px-2 py-1 text-xs text-white"
            >
              {Object.entries(imageSlotLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] text-white/60">Image URL (from /public/...)</span>
            <input
              value={selectedLayerConfig.src}
              onChange={(event) =>
                onChange({
                  ...config,
                  images: {
                    ...config.images,
                    [selectedLayer]: {
                      ...selectedLayerConfig,
                      src: event.target.value,
                    },
                  },
                })
              }
              className="w-full rounded-md border border-white/20 bg-black/35 px-2 py-1 text-xs text-white"
              placeholder="/experience-choice/red-pill.jpg"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] text-white/60">Image alt</span>
            <input
              value={selectedLayerConfig.alt}
              onChange={(event) =>
                onChange({
                  ...config,
                  images: {
                    ...config.images,
                    [selectedLayer]: {
                      ...selectedLayerConfig,
                      alt: event.target.value,
                    },
                  },
                })
              }
              className="w-full rounded-md border border-white/20 bg-black/35 px-2 py-1 text-xs text-white"
            />
          </label>
          <label className="flex items-center gap-2 text-[11px] text-white/70">
            <input
              type="checkbox"
              checked={selectedLayerConfig.flipX}
              onChange={(event) =>
                onChange({
                  ...config,
                  images: {
                    ...config.images,
                    [selectedLayer]: {
                      ...selectedLayerConfig,
                      flipX: event.target.checked,
                    },
                  },
                })
              }
            />
            Flip image horizontally
          </label>
          {(
            [
              ["x", -240, 240],
              ["y", -240, 240],
              ["scale", 0.3, 2.8],
              ["rotateDeg", -45, 45],
              ["opacity", 0, 1],
            ] as const
          ).map(([key, min, max]) => (
            <label key={key} className="block">
              <span className="mb-1 block text-[11px] text-white/60">
                {key} ({selectedLayerConfig[key].toFixed(key === "scale" || key === "opacity" ? 2 : 0)})
              </span>
              <input
                type="range"
                min={min}
                max={max}
                step={key === "scale" || key === "opacity" ? 0.01 : 1}
                value={selectedLayerConfig[key]}
                onChange={(event) =>
                  onChange({
                    ...config,
                    images: {
                      ...config.images,
                      [selectedLayer]: {
                        ...selectedLayerConfig,
                        [key]: Number(event.target.value),
                      },
                    },
                  })
                }
                className="w-full"
              />
            </label>
          ))}
          <p className="text-[11px] leading-relaxed text-white/55">
            Tip: click and drag the image directly on the preview to move it.
          </p>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onReset}
            className="rounded-md border border-white/25 px-3 py-2 text-xs text-white/85 hover:border-white/45"
          >
            Reset to defaults
          </button>
        </div>
      </aside>
    </div>
  );
}
