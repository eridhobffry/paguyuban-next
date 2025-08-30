"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
} from "lucide-react";

interface CostData {
  totalCost: number;
  averageCostPerRequest: number;
  costByModel: Array<{
    model: string;
    cost: number;
    percentage: number;
  }>;
  costTrend: "up" | "down" | "stable";
  costChangePercent: number;
  budgetRemaining?: number;
  budgetTotal?: number;
}

// CostWidgetProps interface can be added when props are needed

export function CostWidget() {
  const [costData, setCostData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCostData();
  }, []);

  const fetchCostData = async () => {
    try {
      setLoading(true);
      // This would typically fetch from a cost tracking API
      // For now, we'll simulate with some mock data
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

      const mockData: CostData = {
        totalCost: 1247.83,
        averageCostPerRequest: 0.023,
        costByModel: [
          { model: "gemini-pro", cost: 892.45, percentage: 71.5 },
          { model: "gemini-pro-vision", cost: 245.67, percentage: 19.7 },
          { model: "embedding-001", cost: 109.71, percentage: 8.8 },
        ],
        costTrend: "down",
        costChangePercent: -12.5,
        budgetTotal: 2000,
        budgetRemaining: 752.17,
      };

      setCostData(mockData);
    } catch (error) {
      console.error("Failed to fetch cost data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getBudgetUsagePercentage = () => {
    if (!costData?.budgetTotal) return 0;
    return (
      ((costData.budgetTotal - (costData.budgetRemaining || 0)) /
        costData.budgetTotal) *
      100
    );
  };

  const getBudgetStatus = () => {
    const usage = getBudgetUsagePercentage();
    if (usage >= 90)
      return { status: "critical", color: "text-red-600", icon: AlertTriangle };
    if (usage >= 75)
      return {
        status: "warning",
        color: "text-yellow-600",
        icon: AlertTriangle,
      };
    return { status: "good", color: "text-green-600", icon: Target };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            AI Cost Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded w-full"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!costData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Cost data unavailable</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const budgetStatus = getBudgetStatus();
  const BudgetIcon = budgetStatus.icon;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Total Cost & Budget */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cost Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Total Cost */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Cost</span>
                <div className="flex items-center gap-1">
                  {costData.costTrend === "down" ? (
                    <TrendingDown className="h-4 w-4 text-green-600" />
                  ) : costData.costTrend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-red-600" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-gray-600" />
                  )}
                  <span
                    className={`text-sm ${
                      costData.costTrend === "down"
                        ? "text-green-600"
                        : costData.costTrend === "up"
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {costData.costChangePercent > 0 ? "+" : ""}
                    {costData.costChangePercent.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold">
                ${costData.totalCost.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                ${costData.averageCostPerRequest.toFixed(4)} per request
              </p>
            </div>

            {/* Budget Progress */}
            {costData.budgetTotal && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <BudgetIcon className={`h-4 w-4 ${budgetStatus.color}`} />
                    Budget Usage
                  </span>
                  <Badge
                    variant={
                      budgetStatus.status === "critical"
                        ? "destructive"
                        : budgetStatus.status === "warning"
                        ? "secondary"
                        : "default"
                    }
                  >
                    {getBudgetUsagePercentage().toFixed(1)}%
                  </Badge>
                </div>
                <Progress
                  value={getBudgetUsagePercentage()}
                  className={`h-3 ${
                    budgetStatus.status === "critical"
                      ? "bg-red-100"
                      : budgetStatus.status === "warning"
                      ? "bg-yellow-100"
                      : "bg-green-100"
                  }`}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>
                    $
                    {(
                      costData.budgetTotal - (costData.budgetRemaining || 0)
                    ).toFixed(2)}{" "}
                    used
                  </span>
                  <span>
                    ${(costData.budgetRemaining || 0).toFixed(2)} remaining
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cost by Model */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Cost by Model
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {costData.costByModel.map((model, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{model.model}</span>
                    <span className="text-sm text-muted-foreground">
                      ${model.cost.toFixed(2)}
                    </span>
                  </div>
                  <Progress value={model.percentage} className="h-2" />
                </div>
                <div className="ml-3 text-right">
                  <div className="text-sm font-medium">
                    {model.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="font-medium mb-2 text-sm">
              Optimization Opportunities
            </h4>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• Use smaller models for simple queries</li>
              <li>• Implement caching for repeated requests</li>
              <li>• Batch similar requests when possible</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
