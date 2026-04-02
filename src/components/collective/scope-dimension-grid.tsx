"use client";

interface ScopeField {
  readonly label: string;
  readonly value: string | null | undefined;
}

interface ScopeDimensionGridProps {
  readonly fields: readonly ScopeField[];
}

export function ScopeDimensionGrid({ fields }: ScopeDimensionGridProps) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
      {fields.map((field) => (
        <div key={field.label}>
          <span className="text-[#C5C6C7]/50">{field.label}</span>
          <p className="font-mono text-[#C5C6C7]">
            {field.value ?? (
              <span className="italic text-[#C5C6C7]/30">Not scoped</span>
            )}
          </p>
        </div>
      ))}
    </div>
  );
}
