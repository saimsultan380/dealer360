# Production Hardening & Monitoring Guide

## Security Checklist

### Database Security

- [ ] **RLS Enabled**
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables 
  WHERE schemaname = 'public' AND rowsecurity = false;
  ```
  Should return 0 rows (all tables have RLS enabled)

- [ ] **Service Role Key Protected**
  - Never expose in frontend code
  - Only use in server actions
  - Rotate regularly in production

- [ ] **Auth Policies Verified**
  ```sql
  SELECT * FROM pg_policies WHERE tablename = 'vehicles';
  ```
  Should have proper organization_id checks

### Authentication Security

- [ ] **Email Confirmation Required**
  - Supabase → Authentication → Providers → Email
  - Confirm email: ✅ ON

- [ ] **Session Management**
  - Middleware at `src/lib/supabase/middleware.ts`
  - Validates auth on each request
  - Redirects unauthenticated users

- [ ] **Password Requirements**
  - Minimum 8 characters (Supabase default)
  - Consider enforcing complexity in future

### Storage Security

- [ ] **Public Buckets**
  - `vehicles`: Public (vehicle images visible to all)
  - `profiles`: Public (profile pictures visible to all)

- [ ] **Private Buckets**
  - `documents`: Private (documents only accessible to authorized users)
  - Add RLS policies in Supabase Storage

- [ ] **File Upload Validation**
  - Check file type before upload
  - Verify file size limits
  - Scan uploaded files for malware (optional)

### API Security

- [ ] **Rate Limiting**
  - Supabase Auth: 10 requests per second per IP
  - Consider implementing custom limits

- [ ] **CORS Configuration**
  - Supabase → Storage → Settings
  - Add only trusted domains
  - Production: `https://yourdomain.com`
  - Staging: `https://staging.yourdomain.com`

- [ ] **Environment Variables**
  - `.env.local` not committed to Git
  - Use `.env.example` for template
  - Rotate keys quarterly

---

## Monitoring Setup

### Database Performance

1. **Access Monitoring**
   - Supabase Dashboard → **Monitoring**

2. **Watch Metrics**
   - Query performance (look for queries > 100ms)
   - Connection count
   - Database size
   - Replication lag

3. **Set Alerts**
   - High query latency: > 1000ms
   - Connection pool exhaustion
   - Storage near quota

### Application Monitoring

1. **Error Tracking** (Recommended: Sentry)
   ```bash
   npm install @sentry/nextjs
   ```

2. **Performance Monitoring**
   - Monitor page load times
   - Track API response times
   - Monitor WebSocket connections

3. **Logs Review**
   - Daily log review for errors
   - Check for unauthorized access attempts
   - Monitor rate limit violations

### Backup Monitoring

1. **Enable Automated Backups**
   - Supabase → Settings → Backups
   - Point-in-Time Recovery: ✅ ON
   - Retention: 30 days

2. **Test Recovery**
   - Monthly backup restore test
   - Verify data integrity
   - Document recovery time

3. **Backup Verification**
   ```sql
   -- Check latest backup timestamp
   SELECT date_trunc('day', created_at) as backup_date, 
          COUNT(*) as count 
   FROM pg_stat_statements 
   GROUP BY backup_date 
   ORDER BY backup_date DESC LIMIT 1;
   ```

---

## Production Deployment Checklist

### Pre-Deployment

- [ ] Code reviewed and tested
- [ ] All migrations run on staging
- [ ] Environment variables configured
- [ ] SSL certificate valid
- [ ] Backups enabled
- [ ] Monitoring configured

### Deployment

- [ ] Build succeeds: `npm run build`
- [ ] No console errors
- [ ] Realtime tests pass
- [ ] File uploads work
- [ ] Authentication flow verified
- [ ] RLS policies verified

### Post-Deployment

- [ ] Monitor error logs for 24 hours
- [ ] Check realtime subscriptions active
- [ ] Verify file uploads working
- [ ] Test auth flow on production
- [ ] Check performance metrics
- [ ] Verify backups running

---

## Rate Limiting Configuration

### Supabase Auth Rate Limits
- **10 requests per second per IP**
- **Email: 4 per hour per email**

### Custom Rate Limiting (Optional)

Add to middleware if needed:
```typescript
// src/lib/supabase/middleware.ts
const rateLimit = new Map<string, number[]>();

function checkRateLimit(ip: string, limit: number = 100, window: number = 60000) {
  const now = Date.now();
  const userRequests = rateLimit.get(ip) || [];
  
  // Remove old requests outside window
  const recentRequests = userRequests.filter(time => now - time < window);
  
  if (recentRequests.length >= limit) {
    return false; // Rate limited
  }
  
  recentRequests.push(now);
  rateLimit.set(ip, recentRequests);
  return true;
}
```

---

## Scaling Considerations

### Realtime Connections

**Free Tier:**
- Up to 100 concurrent connections
- Increases to 500 with Supabase Pro

**Monitor:**
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity 
WHERE datname = 'postgres';
```

### Database Queries

**Optimization Tips:**
1. Add indexes (already done in migrations)
2. Use pagination (already implemented)
3. Filter early (in WHERE clauses)
4. Cache frequent queries
5. Use database functions for complex logic

### Storage

**Monitor Usage:**
- Supabase Dashboard → Storage
- Set quota alerts
- Archive old files if needed

---

## Disaster Recovery Plan

### Data Loss Scenarios

| Scenario | Recovery Method | RPO | RTO |
|----------|-----------------|-----|-----|
| Accidental deletion | Point-in-time restore | 24 hours | 30 min |
| Database corruption | Backup restore | 24 hours | 30 min |
| Region failure | Failover to backup region | N/A | 4 hours |
| Security breach | Restore from pre-breach backup | 24 hours | 1 hour |

### Recovery Steps

1. **Identify Issue**
   - Check error logs
   - Verify data integrity
   - Determine scope

2. **Notify Stakeholders**
   - Internal team
   - Affected organizations
   - Support team

3. **Initiate Recovery**
   - Supabase → Settings → Backups
   - Select backup point
   - Restore database
   - Verify data

4. **Post-Recovery**
   - Test all features
   - Verify data integrity
   - Document incident
   - Update security

---

## Compliance & Data Protection

### GDPR Compliance

- [ ] Privacy policy created
- [ ] Terms of service created
- [ ] Consent collected before data processing
- [ ] Right to deletion implemented
- [ ] Data portability option available

### Data Encryption

- [ ] Transport: TLS/SSL (automatic with Supabase)
- [ ] At Rest: Encryption enabled (Supabase default)
- [ ] Customer data in separate organizations
- [ ] Field-level encryption for sensitive data (optional)

### Audit Logging

- [ ] All data modifications logged
- [ ] User actions tracked
- [ ] Admin actions audited
- [ ] Logs retained for 90 days

---

## Performance Optimization

### Frontend

1. **Component Optimization**
   - Use `React.memo` for heavy components
   - Optimize re-renders
   - Lazy load components

2. **Data Fetching**
   - Pagination (✅ implemented)
   - Caching (use React Query or SWR)
   - Batch requests

3. **Bundle Size**
   ```bash
   npm run build
   # Check: .next/static/chunks/
   ```

### Backend

1. **Database**
   - Indexes (✅ created)
   - Query optimization
   - Connection pooling

2. **API**
   - Cache headers
   - Gzip compression
   - CDN for static files

### Realtime

1. **Connection Management**
   - Limit concurrent subscriptions
   - Unsubscribe on component unmount (✅ implemented)
   - Handle connection drops

2. **Message Throughput**
   - Batch updates
   - Throttle updates
   - Filter irrelevant changes

---

## Testing Strategy

### Unit Tests
```bash
npm test -- --coverage
```

### Integration Tests
- Test auth flow
- Test file uploads
- Test realtime subscriptions
- Test RLS policies

### End-to-End Tests
```bash
npx playwright install
npx playwright test
```

### Performance Tests
- Load testing (50+ concurrent users)
- Stress testing (peak hour simulation)
- Realtime connection stability

---

## Incident Response Plan

### 1. Detection
- Monitor dashboards continuously
- Alert on critical metrics
- User reports

### 2. Assessment
- Determine scope and impact
- Check error logs
- Verify data integrity

### 3. Mitigation
- Switch to fallback mode if needed
- Communicate with users
- Stop data loss

### 4. Resolution
- Fix root cause
- Apply permanent fix
- Test thoroughly

### 5. Post-Incident
- Document incident
- Review prevention steps
- Update runbooks

---

## Maintenance Schedule

### Daily
- Review error logs
- Check system health
- Monitor performance

### Weekly
- Verify backups completed
- Review security alerts
- Check database size

### Monthly
- Security audit
- Performance review
- Test disaster recovery

### Quarterly
- Rotate secrets/keys
- Update dependencies
- Security assessment
- Capacity planning

### Annually
- Full security audit
- Compliance review
- Penetration testing
- Architecture review

---

## Contacts & Resources

### Support
- Supabase Support: https://supabase.com/support
- Documentation: https://supabase.com/docs
- Community: https://discord.supabase.io

### Monitoring Tools
- Sentry: Error tracking
- Datadog: Infrastructure monitoring
- New Relic: APM (Application Performance Monitoring)
- Prometheus: Metrics collection

### On-Call Rotation
- Document who handles incidents
- Setup paging/alerts
- Maintain runbooks
- Regular training

---

**Last Updated**: January 24, 2026
**Status**: Ready for Production
**Next Review**: 90 days
