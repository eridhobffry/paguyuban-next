# Observability Operations Runbook

**Phase 6 Implementation | Status: Operational**

## Daily Operations

### Health Checks

```bash
# Check system health
curl http://localhost:3000/api/health

# Verify telemetry is working
curl http://localhost:3000/api/admin/metrics/summary

# Check for active alerts
curl http://localhost:3000/api/admin/alerts/evaluate
```

### Monitoring Dashboard

Access at: `/admin/observability`

- SLO metrics (availability, latency, error rate)
- Circuit breaker status
- Cost tracking
- Alert status

## Alert Response

### High Priority Alerts

1. **Circuit Breaker Open**: Service degradation detected

   ```bash
   # Check breaker status
   curl http://localhost:3000/api/admin/metrics/summary

   # Manual recovery (wait 30s for auto-recovery)
   # Restart service if needed
   ```

2. **P95 Latency > 2s**: Performance degradation

   ```bash
   # Check current metrics
   curl http://localhost:3000/api/admin/metrics/summary

   # Check recent telemetry
   curl http://localhost:3000/api/admin/metrics/timeseries
   ```

### Error Rate > 0.1%

```bash
# Get detailed error breakdown
curl "http://localhost:3000/api/admin/alerts/evaluate?ruleId=error_rate_5m_high"
```

## Maintenance Tasks

### Weekly

- Review SLO performance trends
- Check telemetry data retention
- Verify alert rules are working

### Monthly

- Review cost optimization opportunities
- Update SLO targets if needed
- Archive old telemetry data

## Troubleshooting

### Telemetry Not Recording

```bash
# Check database connectivity
curl http://localhost:3000/api/health

# Verify telemetry tables exist
psql -c "SELECT COUNT(*) FROM ai_query_performance;"

# Check for DLQ backlog
psql -c "SELECT COUNT(*) FROM telemetry_dlq;"
```

### High Error Rates

```bash
# Get recent errors
curl http://localhost:3000/api/admin/alerts/evaluate

# Check AI service status
curl http://localhost:3000/api/ai/respond -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"test","language":"en"}'
```

### Performance Issues

```bash
# Load test system
node scripts/load-test-observability.mjs --duration 30 --concurrency 5

# Check circuit breaker state
curl http://localhost:3000/api/admin/metrics/summary
```

## Emergency Procedures

### System Down

1. Check service status
2. Restart services
3. Verify telemetry recovery
4. Monitor for 15 minutes

### Data Loss

1. Check database connectivity
2. Verify backup integrity
3. Restore from backup if needed
4. Validate system functionality

## Key Metrics to Monitor

- **Availability**: ≥99.9%
- **P95 Latency**: ≤2000ms
- **Error Rate**: ≤0.1%
- **Telemetry Coverage**: 100%
- **DLQ Backlog**: <50 items

## Contact Information

- **Development Team**: For code issues
- **Infrastructure Team**: For system issues
- **Security Team**: For security incidents

---

**Last Updated**: 2025-08-30
**Version**: 1.0
