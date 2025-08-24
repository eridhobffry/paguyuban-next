"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KpiCardsProps {
  avgEngagement: number;
  bounceRate: number;
  range: string;
}

export default function KpiCards({
  avgEngagement,
  bounceRate,
  range,
}: KpiCardsProps) {
  return (
    <>
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Avg Engagement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">
            {Math.round(avgEngagement)}
          </div>
          <div className="text-muted-foreground text-sm">Last {range}</div>
        </CardContent>
      </Card>
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Bounce Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">
            {`${Math.round(bounceRate * 100)}%`}
          </div>
          <div className="text-muted-foreground text-sm">Last {range}</div>
        </CardContent>
      </Card>
    </>
  );
}
