import {
  AdminHeader,
  FinancialOverview,
  FinancialCharts,
} from "@/components/admin";

export default function AdminFinancialPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <AdminHeader />
        <div className="space-y-6">
          <FinancialOverview />
          <FinancialCharts />
        </div>
      </div>
    </div>
  );
}
