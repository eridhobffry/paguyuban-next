import { FinancialOverview, FinancialCharts } from "@/components/admin";
import { Card } from "@/components/ui/card";

export default function AdminFinancialPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="glass" className="p-6">
            <div className="text-sm text-muted-foreground">Total Revenue</div>
            <div id="kpi-revenue" className="text-2xl font-semibold"></div>
          </Card>
          <Card variant="glass" className="p-6">
            <div className="text-sm text-muted-foreground">Total Costs</div>
            <div id="kpi-costs" className="text-2xl font-semibold"></div>
          </Card>
          <Card variant="glass" className="p-6">
            <div className="text-sm text-muted-foreground">Net</div>
            <div id="kpi-net" className="text-2xl font-semibold"></div>
          </Card>
        </div>

        <FinancialOverview />
        <FinancialCharts />
      </div>
    </div>
  );
}
