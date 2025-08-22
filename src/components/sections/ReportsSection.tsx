"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  FileText,
  TrendingUp,
  Calendar,
  Brain,
  MessageSquare,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";
import type { Report } from "@/lib/reporting";

const iconMap = {
  financial: TrendingUp,
  event: Calendar,
  knowledge: Brain,
  chatbot: MessageSquare,
};

const colorMap = {
  financial: "text-green-600 bg-green-100",
  event: "text-blue-600 bg-blue-100",
  knowledge: "text-purple-600 bg-purple-100",
  chatbot: "text-orange-600 bg-orange-100",
};

export default function ReportsSection() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/reports");
      if (!response.ok) throw new Error("Failed to fetch reports");
      const data = await response.json();
      setReports(data.reports || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Generating reports...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertTriangle className="h-4 w-4" />
          <span>Error loading reports: {error}</span>
        </div>
        <Button onClick={fetchReports} className="mt-4">
          Try Again
        </Button>
      </Card>
    );
  }

  const ReportCard = ({ report }: { report: Report }) => {
    const Icon = iconMap[report.type];
    const colorClass = colorMap[report.type];

    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${colorClass}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{report.title}</CardTitle>
                <Badge variant="secondary" className="mt-1 capitalize">
                  {report.type}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchReports()}
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>{new Date(report.timestamp).toLocaleString()}</span>
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium">{report.summary}</p>
          </div>

          {report.recommendations && report.recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Recommendations</span>
              </h4>
              <ul className="space-y-1">
                {report.recommendations.map((rec, index) => (
                  <li
                    key={index}
                    className="text-xs text-muted-foreground flex items-start space-x-2"
                  >
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.details && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Details</h4>
              <div className="bg-muted/50 p-3 rounded text-xs">
                <pre className="whitespace-pre-wrap text-muted-foreground">
                  {JSON.stringify(report.details, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Automated Reports</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real-time insights and analytics based on your knowledge system
            data. These reports are automatically generated and updated.
          </p>
        </div>

        <div className="mb-6 flex justify-center">
          <Button onClick={fetchReports} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh All Reports
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>

        {reports.length === 0 && (
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Reports Available</h3>
            <p className="text-muted-foreground mb-4">
              No reports could be generated. This might be due to missing data.
            </p>
            <Button onClick={fetchReports}>Try Again</Button>
          </Card>
        )}
      </div>
    </section>
  );
}
