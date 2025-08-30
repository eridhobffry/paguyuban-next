import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin } from "@/lib/auth";
import { db } from "@/lib/db/drizzle";
import { alertState } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import type { User } from "@/lib/sql";

function json(res: unknown, status = 200) {
  return NextResponse.json(res, {
    status,
    headers: {
      "Cache-Control": "private, max-age=0, no-cache",
    },
  });
}

// Alert rule definitions
interface AlertRule {
  id: string;
  name: string;
  description: string;
  query: string;
  threshold: number;
  operator: "gt" | "gte" | "lt" | "lte" | "eq";
  severity: "low" | "medium" | "high" | "critical";
  cooldownMinutes: number;
  enabled: boolean;
}

const ALERT_RULES: AlertRule[] = [
  // Error rate > 5% over last 5 minutes
  {
    id: "error_rate_5m_high",
    name: "High Error Rate (5m)",
    description: "Error rate exceeds 5% in the last 5 minutes",
    query: `
      SELECT
        (COUNT(*) FILTER (WHERE success = false))::float / NULLIF(COUNT(*), 0) AS error_rate
      FROM ai_query_performance
      WHERE created_at >= now() - '5 minutes'::interval
    `,
    threshold: 0.05,
    operator: "gt",
    severity: "high",
    cooldownMinutes: 5,
    enabled: true,
  },
  // P95 latency > 3s over last 10 minutes
  {
    id: "p95_latency_10m_high",
    name: "High P95 Latency (10m)",
    description: "P95 response time exceeds 3 seconds in the last 10 minutes",
    query: `
      SELECT
        PERCENTILE_DISC(0.95) WITHIN GROUP (ORDER BY response_time) AS p95_latency
      FROM ai_query_performance
      WHERE created_at >= now() - '10 minutes'::interval
        AND success = true
    `,
    threshold: 3000,
    operator: "gt",
    severity: "medium",
    cooldownMinutes: 10,
    enabled: true,
  },
  // Circuit breaker open sustained > 2 minutes (within last 10 minutes window)
  {
    id: "breaker_open_sustained_2m",
    name: "Circuit Breaker Sustained Open (>2m)",
    description:
      "Circuit breaker has been open continuously for more than 2 minutes",
    query: `
      WITH open_events AS (
        SELECT MIN(created_at) AS first_open
        FROM ai_query_performance
        WHERE created_at >= now() - '10 minutes'::interval
          AND breaker_state = 'open'
      )
      SELECT CASE
        WHEN (SELECT first_open FROM open_events) IS NULL THEN 0
        WHEN EXTRACT(EPOCH FROM (now() - (SELECT first_open FROM open_events))) >= 120 THEN 1
        ELSE 0
      END AS sustained_open
    `,
    threshold: 0,
    operator: "gt",
    severity: "critical",
    cooldownMinutes: 5,
    enabled: true,
  },
  // Availability below 99.5% over last 24 hours (informational/medium)
  {
    id: "availability_24h_low",
    name: "Availability Drop (24h)",
    description: "Success rate below 99.5% in the last 24 hours",
    query: `
      SELECT
        (COUNT(*) FILTER (WHERE success = true))::float / NULLIF(COUNT(*), 0) AS availability
      FROM ai_query_performance
      WHERE created_at >= now() - '24 hours'::interval
    `,
    threshold: 0.995,
    operator: "lt",
    severity: "medium",
    cooldownMinutes: 60,
    enabled: true,
  },
  // Telemetry DLQ backlog
  {
    id: "telemetry_dlq_backlog",
    name: "DLQ Backlog",
    description: "More than 50 items in telemetry dead-letter queue",
    query: `
      SELECT COUNT(*) AS dlq_count FROM telemetry_dlq
    `,
    threshold: 50,
    operator: "gt",
    severity: "high",
    cooldownMinutes: 60,
    enabled: true,
  },
];

export async function evaluateRule(rule: AlertRule): Promise<{
  triggered: boolean;
  value: number;
  threshold: number;
}> {
  try {
    const result = await db.execute(sql.raw(rule.query));
    const value = Number(
      result.rows[0]?.[Object.keys(result.rows[0] || {})[0]] || 0
    );

    let triggered = false;
    switch (rule.operator) {
      case "gt":
        triggered = value > rule.threshold;
        break;
      case "gte":
        triggered = value >= rule.threshold;
        break;
      case "lt":
        triggered = value < rule.threshold;
        break;
      case "lte":
        triggered = value <= rule.threshold;
        break;
      case "eq":
        triggered = value === rule.threshold;
        break;
    }

    return { triggered, value, threshold: rule.threshold };
  } catch (error) {
    console.error(`Error evaluating rule ${rule.id}:`, error);
    return { triggered: false, value: 0, threshold: rule.threshold };
  }
}

export async function checkAlertCooldown(
  alertKey: string,
  cooldownMinutes: number
): Promise<boolean> {
  const cooldownThreshold = new Date(Date.now() - cooldownMinutes * 60 * 1000);

  const existingAlert = await db
    .select()
    .from(alertState)
    .where(
      and(
        eq(alertState.id, alertKey),
        sql`${alertState.lastNotificationAt} > ${cooldownThreshold}`
      )
    )
    .limit(1);

  return existingAlert.length > 0;
}

export async function updateAlertState(
  alertKey: string,
  rule: AlertRule,
  triggered: boolean,
  value: number
) {
  const now = new Date();

  if (triggered) {
    // Check if we should suppress due to cooldown
    const inCooldown = await checkAlertCooldown(alertKey, rule.cooldownMinutes);

    if (!inCooldown) {
      // Create or update firing alert
      await db
        .insert(alertState)
        .values({
          id: alertKey,
          alertType: rule.id,
          dimension: {
            rule_name: rule.name,
            severity: rule.severity,
            value,
            threshold: rule.threshold,
          },
          firingSince: now,
          lastNotificationAt: now,
          notificationCount: 1,
          resolved: false,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: alertState.id,
          set: {
            lastNotificationAt: now,
            notificationCount: sql`${alertState.notificationCount} + 1`,
            updatedAt: now,
            resolved: false,
          },
        });
    }
  } else {
    // Resolve alert if it exists
    await db
      .update(alertState)
      .set({
        resolved: true,
        updatedAt: now,
      })
      .where(and(eq(alertState.id, alertKey), eq(alertState.resolved, false)));
  }
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return json({ error: "Unauthorized" }, 401);
  const decoded = verifyToken(token);
  if (!decoded || !isAdmin(decoded as User))
    return json({ error: "Admin access required" }, 403);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _user = decoded as User;

  try {
    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    const ruleId = url.searchParams.get("ruleId");

    if (action === "evaluate") {
      // Evaluate all rules or a specific rule
      const rulesToEvaluate = ruleId
        ? ALERT_RULES.filter((r) => r.id === ruleId)
        : ALERT_RULES.filter((r) => r.enabled);

      const results = [];
      const alerts = [];

      for (const rule of rulesToEvaluate) {
        const evaluation = await evaluateRule(rule);
        const alertKey = `${rule.id}_threshold_${rule.threshold}`;

        if (evaluation.triggered) {
          await updateAlertState(alertKey, rule, true, evaluation.value);
          alerts.push({
            rule: rule.id,
            name: rule.name,
            severity: rule.severity,
            value: evaluation.value,
            threshold: rule.threshold,
            description: rule.description,
          });
        } else {
          await updateAlertState(alertKey, rule, false, evaluation.value);
        }

        results.push({
          rule: rule.id,
          triggered: evaluation.triggered,
          value: evaluation.value,
          threshold: rule.threshold,
        });
      }

      return json({
        evaluated: results.length,
        alertsTriggered: alerts.length,
        results,
        alerts,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === "status") {
      // Get current alert status
      const activeAlerts = await db
        .select()
        .from(alertState)
        .where(eq(alertState.resolved, false))
        .orderBy(sql`${alertState.createdAt} desc`);

      const recentAlerts = await db
        .select()
        .from(alertState)
        .orderBy(sql`${alertState.updatedAt} desc`)
        .limit(20);

      return json({
        activeAlerts: activeAlerts.map((alert) => ({
          id: alert.id,
          alertType: alert.alertType,
          dimension: alert.dimension,
          firingSince: alert.firingSince,
          lastNotification: alert.lastNotificationAt,
          notificationCount: alert.notificationCount,
        })),
        recentAlerts: recentAlerts.map((alert) => ({
          id: alert.id,
          alertType: alert.alertType,
          resolved: alert.resolved,
          firingSince: alert.firingSince,
          lastNotification: alert.lastNotificationAt,
          notificationCount: alert.notificationCount,
        })),
        rules: ALERT_RULES.map((rule) => ({
          id: rule.id,
          name: rule.name,
          severity: rule.severity,
          enabled: rule.enabled,
          cooldownMinutes: rule.cooldownMinutes,
        })),
      });
    }

    return json({
      message: "Alert evaluation endpoint",
      actions: ["evaluate", "status"],
      rules: ALERT_RULES.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        severity: r.severity,
        enabled: r.enabled,
      })),
    });
  } catch (error) {
    console.error("Error in alert evaluation:", error);
    return json({ error: "Failed to evaluate alerts" }, 500);
  }
}
