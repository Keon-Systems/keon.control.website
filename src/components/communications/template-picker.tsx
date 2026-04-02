"use client";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertCircle } from "lucide-react";

interface CommTemplate {
  templateId: string;
  name: string;
  description?: string;
  channel?: string;
  variables?: string[];
}

interface TemplatePickerProps {
  templates: CommTemplate[];
  onSelect?: (template: CommTemplate) => void;
}

export function TemplatePicker({ templates, onSelect }: TemplatePickerProps) {
  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 opacity-50">
        <AlertCircle className="mb-2 h-8 w-8 text-[#C5C6C7]" />
        <p className="font-mono text-sm text-[#C5C6C7]">No templates found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {templates.map((template) => (
        <button
          key={template.templateId}
          onClick={() => onSelect?.(template)}
          className="w-full flex items-start gap-3 rounded border border-[#384656] bg-[#1F2833] p-4 text-left hover:border-[#66FCF1] transition-all"
        >
          <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#66FCF1]" />
          <div className="flex-1 space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium text-[#C5C6C7]">{template.name}</span>
              {template.channel && (
                <Badge variant="neutral">{template.channel}</Badge>
              )}
            </div>
            {template.description && (
              <p className="font-mono text-xs text-[#C5C6C7] opacity-60">{template.description}</p>
            )}
            {template.variables && template.variables.length > 0 && (
              <p className="font-mono text-xs text-[#C5C6C7] opacity-40">
                Variables: {template.variables.join(", ")}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
