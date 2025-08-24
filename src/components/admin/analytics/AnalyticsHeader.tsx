"use client";

import { Card } from "@/components/ui/card";

interface AnalyticsHeaderProps {
  title: string;
  description: string;
}

export default function AnalyticsHeader({
  title,
  description,
}: AnalyticsHeaderProps) {
  return (
    <Card variant="glass" className="p-7">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </Card>
  );
}
