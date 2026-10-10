"use client";

import type { FormConfig } from "@/lib/tournament/form-config";

type Props = {
  config: FormConfig;
  tournamentName: string;
  onClose: () => void;
};

export function FormPreviewModal({ config, tournamentName, onClose }: Props) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[75] flex items-start justify-center overflow-y-auto bg-[#0F231A]/70 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="my-8 w-full max-w-2xl rounded-2xl bg-[#F0EBF8] p-4 shadow-2xl"
      >
        {/* Google Forms-style header */}
        <div className="mb-4 rounded-xl border-t-[10px] border-[#1B4332] bg-white p-6 shadow-sm">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#2D6A4F]">
            {tournamentName} · Preview
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[#202124]">
            {config.title}
          </h2>
          <p className="mt-1.5 text-sm text-[#5f6368]">{config.description}</p>
          <p className="mt-3 text-xs font-semibold text-[#d93025]">
            * Indicates required question
          </p>
        </div>

        {/* Fields */}
        <div className="space-y-3">
          {config.formFields.map((f) => (
            <PreviewField key={f.id} field={f} />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-[#5f6368]">
            This is a preview. Real submissions go through the public link.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#1B4332] px-4 py-2 text-xs font-bold uppercase tracking-wider text-cream transition hover:bg-[#2D6A4F]"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewField({
  field,
}: {
  field: FormConfig["formFields"][number];
}) {
  const req = field.required ? <span className="ml-1 text-[#d93025]">*</span> : null;
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-[#202124]">
        {field.label}
        {req}
      </p>

      {field.type === "photo" ? (
        <div className="mt-3 rounded-lg border-2 border-dashed border-[#b39ddb] bg-[#faf8fd] p-4 text-center text-xs text-[#5f6368]">
          📷 Drag & drop photo or browse device
          <p className="mt-1 text-[10px] uppercase tracking-widest text-[#999]">
            Auto-converted to WebP
          </p>
        </div>
      ) : field.type === "radio" ? (
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(field.options ?? []).map((o) => (
            <span
              key={o}
              className="rounded-lg border border-[#dadce0] bg-[#fafafa] px-3 py-1.5 text-xs text-[#5f6368]"
            >
              ○ {o}
            </span>
          ))}
        </div>
      ) : field.type === "select" ? (
        <select
          disabled
          className="mt-2 w-full rounded-lg border border-[#dadce0] bg-[#fafafa] px-3 py-2 text-sm text-[#5f6368]"
        >
          {(field.options ?? []).map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : field.type === "textarea" ? (
        <textarea
          disabled
          rows={3}
          placeholder="Your answer"
          className="mt-2 w-full rounded-lg border border-[#dadce0] bg-[#fafafa] px-3 py-2 text-sm text-[#5f6368]"
        />
      ) : (
        <input
          disabled
          type={
            field.type === "number"
              ? "number"
              : field.type === "email"
                ? "email"
                : field.type === "tel"
                  ? "tel"
                  : "text"
          }
          placeholder={
            field.type === "tel" && field.id === "mobileNo"
              ? "10-digit mobile number"
              : "Your answer"
          }
          className="mt-2 w-full rounded-lg border border-[#dadce0] bg-[#fafafa] px-3 py-2 text-sm text-[#5f6368]"
        />
      )}
    </div>
  );
}