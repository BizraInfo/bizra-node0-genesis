# DNS Configuration for bizra.ai and bizra.info

## Complete Setup Guide با احسان

**Date**: 2025-10-26
**Domains**: bizra.ai, bizra.info
**Status**: Ready for configuration

---

## Overview

Your BIZRA bilingual website is **running and accessible**:

- ✅ Local: `http://localhost:3000/bizra-bilingual.html`
- ✅ WiFi: `http://192.168.1.49:3000/bizra-bilingual.html`
- ✅ Internet: Public tunnel created (see below)

To make it accessible via **bizra.ai** and **bizra.info**, you need to update DNS records at your domain registrar.

---

## Current Public Access

### Temporary Public URL (Active Now)

```
https://bizra-ai.loca.lt/bizra-bilingual.html
```

**Status**: ✅ LIVE (no authentication required)
**Lifetime**: Active as long as server runs
**Use**: Share with Arab investors immediately

### Permanent Deployment URLs (Recommended)

After deploying to Vercel/Netlify, you'll get:

```
Primary: https://bizra-node0.vercel.app
Custom:  https://bizra.ai (after DNS setup)
Custom:  https://bizra.info (after DNS setup)
```

---

## DNS Configuration Steps

### Option 1: Point to Vercel (Recommended)

**Step 1**: Deploy to Vercel

```powershell
cd C:\BIZRA-NODE0\public
npx vercel --prod
```

**Step 2**: Get Vercel nameservers from deployment output

**Step 3**: Update DNS at your registrar (where you bought bizra.ai and bizra.info):

#### For bizra.ai:

**A Records**:
| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | 3600 |
| A | www | 76.76.21.21 | 3600 |

**OR CNAME Records** (alternative, recommended):
| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | @ | cname.vercel-dns.com. | 3600 |
| CNAME | www | cname.vercel-dns.com. | 3600 |

#### For bizra.info:

**A Records**:
| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | 3600 |
| A | www | 76.76.21.21 | 3600 |

**OR CNAME Records** (alternative, recommended):
| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | @ | cname.vercel-dns.com. | 3600 |
| CNAME | www | cname.vercel-dns.com. | 3600 |

**Step 4**: Add custom domains in Vercel

```powershell
npx vercel domains add bizra.ai
npx vercel domains add bizra.info
```

**Propagation Time**: 5 minutes to 48 hours (usually <1 hour)

---

### Option 2: Point to Netlify

**Step 1**: Deploy to Netlify

```powershell
cd C:\BIZRA-NODE0\public
npx netlify deploy --prod --dir .
```

**Step 2**: Update DNS at your registrar:

#### For bizra.ai:

| Type  | Name | Value                    | TTL  |
| ----- | ---- | ------------------------ | ---- |
| A     | @    | 75.2.60.5                | 3600 |
| CNAME | www  | bizra-node0.netlify.app. | 3600 |

#### For bizra.info:

| Type  | Name | Value                    | TTL  |
| ----- | ---- | ------------------------ | ---- |
| A     | @    | 75.2.60.5                | 3600 |
| CNAME | www  | bizra-node0.netlify.app. | 3600 |

**Step 3**: Add custom domains in Netlify dashboard

**Propagation Time**: 5 minutes to 48 hours (usually <1 hour)

---

## Common Domain Registrars

### GoDaddy

1. Log in to https://godaddy.com
2. Go to My Products → Domains
3. Click DNS next to bizra.ai
4. Add/Edit records from table above
5. Save changes

### Namecheap

1. Log in to https://namecheap.com
2. Domain List → Manage → Advanced DNS
3. Add/Edit records from table above
4. Save All Changes

### Cloudflare

1. Log in to https://dash.cloudflare.com
2. Select bizra.ai domain
3. DNS → Records
4. Add/Edit records from table above
5. Save

### Google Domains

1. Log in to https://domains.google.com
2. My Domains → Manage → DNS
3. Custom Records → Add/Edit
4. Add records from table above
5. Save

---

## Email Configuration (Bonus)

Your official emails (m.beshr@bizra.ai, m.beshr@bizra.info) need email service configured.

### Option 1: Google Workspace (Professional)

**MX Records for bizra.ai**:
| Priority | Value |
|----------|-------|
| 1 | ASPMX.L.GOOGLE.COM. |
| 5 | ALT1.ASPMX.L.GOOGLE.COM. |
| 5 | ALT2.ASPMX.L.GOOGLE.COM. |
| 10 | ALT3.ASPMX.L.GOOGLE.COM. |
| 10 | ALT4.ASPMX.L.GOOGLE.COM. |

**Repeat for bizra.info**

### Option 2: Zoho Mail (Free for 5 users)

1. Sign up at https://www.zoho.com/mail/
2. Add domains (bizra.ai, bizra.info)
3. Follow their MX record instructions
4. Verify domain ownership

### Option 3: Current Email Provider

If you already have email hosting, add these DNS records:

**SPF Record**:

```
TXT @ "v=spf1 include:_spf.youremailprovider.com ~all"
```

**DKIM Record** (get from your email provider):

```
TXT default._domainkey "v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY"
```

**DMARC Record**:

```
TXT _dmarc "v=DMARC1; p=quarantine; rua=mailto:m.beshr@bizra.ai"
```

---

## Verification Commands

### Check DNS Propagation

```powershell
# Check A records
nslookup bizra.ai
nslookup bizra.info

# Check CNAME records
nslookup www.bizra.ai
nslookup www.bizra.info

# Check from different DNS servers
nslookup bizra.ai 8.8.8.8  # Google DNS
nslookup bizra.ai 1.1.1.1  # Cloudflare DNS
```

### Test Website Accessibility

```powershell
# After DNS propagation
curl https://bizra.ai
curl https://bizra.info

# Check Arabic content loads
curl https://bizra.ai | Select-String "بِزْرَة"

# Check contact info present
curl https://bizra.ai | Select-String "m.beshr@bizra.ai"
```

---

## Troubleshooting

### "DNS_PROBE_FINISHED_NXDOMAIN" Error

- **Cause**: DNS not propagated yet
- **Solution**: Wait 1-24 hours, check registrar settings

### "Too Many Redirects" Error

- **Cause**: Conflicting SSL/HTTPS rules
- **Solution**: Check Cloudflare SSL setting (set to "Full" if using)

### Website Shows "Not Found"

- **Cause**: Custom domain not added to Vercel/Netlify
- **Solution**: Run `npx vercel domains add bizra.ai`

### Email Not Working

- **Cause**: MX records not configured
- **Solution**: Add MX records from email provider (see Email Configuration section)

---

## Timeline Estimates

| Task                            | Time                    |
| ------------------------------- | ----------------------- |
| Deploy to Vercel/Netlify        | 2-5 minutes (one-time)  |
| Update DNS records at registrar | 5-10 minutes (one-time) |
| DNS propagation (wait time)     | 15 minutes - 48 hours   |
| Add custom domains              | 1 minute (one command)  |
| Verify deployment               | 2 minutes               |
| **Total active work**           | **10-20 minutes**       |
| **Total wait time**             | **15 min - 48 hours**   |

---

## Current Status با احسان

### ✅ Completed

- [x] Professional bilingual website (Arabic/English)
- [x] احسان branding throughout
- [x] Contact information (m.beshr@bizra.ai, m.beshr@bizra.info)
- [x] Responsive design (mobile + desktop)
- [x] Local server running (port 3000)
- [x] Public tunnel active (bizra-ai.loca.lt)
- [x] WiFi sharing available (192.168.1.49:3000)
- [x] Deployment configuration (vercel.json)

### ⏳ Pending (One Command)

- [ ] Permanent deployment (Vercel/Netlify)
- [ ] Custom domain connection (DNS update)
- [ ] SSL certificate (automatic via Vercel/Netlify)

### 📧 Optional (Email)

- [ ] Email service setup (Google Workspace/Zoho)
- [ ] MX/SPF/DKIM records
- [ ] Email verification

---

## Recommended Next Action

**For Immediate Investor Demo**:

```
Share this link: https://bizra-ai.loca.lt/bizra-bilingual.html
✅ Works right now, globally accessible
```

**For Professional Launch**:

```powershell
# 1. Deploy to Vercel (2 minutes)
cd C:\BIZRA-NODE0\public
npx vercel --prod

# 2. Update DNS at your registrar (5 minutes)
# Follow table above for your specific registrar

# 3. Add custom domains (30 seconds)
npx vercel domains add bizra.ai
npx vercel domains add bizra.info

# 4. Wait for DNS propagation (15 min - 24 hours)
# 5. Visit https://bizra.ai ✅
```

---

**Created**: 2025-10-26
**احسان Standard**: Zero Assumptions, Complete Transparency
**Status**: Ready for professional deployment

_"Excellence in the sight of Allah - DNS configuration با احسان."_
