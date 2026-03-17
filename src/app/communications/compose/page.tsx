"use client";
import * as React from "react";
import { PageContainer, PageHeader, Card, CardHeader, CardContent } from "@/components/layout/page-container";
import { ComposeForm } from "@/components/communications";
import { Send } from "lucide-react";

export default function ComposePage() {
  return (
    <PageContainer>
      <PageHeader
        title="Compose"
        description="Compose and send a message to tenants"
      />
      <div className="max-w-2xl">
        <Card>
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-[#66FCF1]" />
                <span>New Message</span>
              </div>
            }
          />
          <CardContent>
            <ComposeForm />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
