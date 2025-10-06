# 🤖 AI CODING AGENT HANDOFF INSTRUCTIONS

> **For Oscar:** How to use these documents with your AI coder working on the Shopify integration

---

## 📦 WHAT I CREATED FOR YOU

I've synthesized all your context documentation into **three comprehensive briefing documents** for the AI agent that will work on your Shopify store:

### 1. **SHOPIFY_AI_BRIEF.md** (Master Document)
**Size:** ~1,200 lines | **Purpose:** Complete integration guide

**Contains:**
- Full business context (Pawpaya → Tapify strategy)
- System architecture diagrams
- Complete technical specifications
- Database schema reference
- Code implementations (webhook handler, attribution JS)
- Testing procedures
- Security best practices
- Deployment checklist

**When to use:** Give this to the AI as primary context when starting the project.

---

### 2. **SHOPIFY_QUICK_START.md** (Action-Oriented)
**Size:** ~300 lines | **Purpose:** Immediate action plan

**Contains:**
- Prioritized task list (Phase 1, 2, 3)
- Step-by-step implementation instructions
- Testing command cheatsheet
- Troubleshooting scenarios
- Done criteria checklist

**When to use:** Give this to the AI alongside the main brief for concrete next steps.

---

### 3. **SHOPIFY_INTEGRATION_DIAGRAMS.md** (Visual)
**Size:** ~500 lines | **Purpose:** Visual understanding & debugging

**Contains:**
- ASCII system architecture diagram
- 5 scenario walkthroughs (happy path, edge cases, failures)
- Debugging flowcharts
- Data structure visualizations
- Health checklist

**When to use:** Reference this when the AI needs to understand data flows or debug issues.

---

## 🚀 HOW TO USE THESE WITH YOUR AI CODER

### Option 1: Claude Code (Recommended)
```bash
# 1. Copy your Shopify repo to local machine
cd ~/shopify-repo

# 2. Copy these briefing documents into the repo
cp ~/tapify-marketplace/SHOPIFY_AI_BRIEF.md .
cp ~/tapify-marketplace/SHOPIFY_QUICK_START.md .
cp ~/tapify-marketplace/SHOPIFY_INTEGRATION_DIAGRAMS.md .

# 3. Start Claude Code session
claude-code

# 4. Give initial prompt:
"Read SHOPIFY_AI_BRIEF.md and SHOPIFY_QUICK_START.md.
Your mission is to fix the Shopify integration so orders sync
to Supabase correctly. Start with Phase 1 tasks."
```

---

### Option 2: Cursor / GitHub Copilot
```
1. Open Shopify repo in Cursor
2. Add these 3 files to the repo root
3. Open SHOPIFY_AI_BRIEF.md
4. Use Cmd+K and say:
   "Read this document and implement the webhook handler
   according to the specifications in Integration Point 2"
```

---

### Option 3: ChatGPT / Claude (Web)
```
1. Copy entire contents of SHOPIFY_AI_BRIEF.md
2. Start new chat session
3. Paste document and say:
   "I need you to act as my Shopify integration engineer.
   Read this briefing document, then help me implement
   the webhook handler in pages/api/shopify-webhook.js"

4. For specific issues, paste relevant sections from
   SHOPIFY_INTEGRATION_DIAGRAMS.md (e.g., debugging flowcharts)
```

---

## 📋 RECOMMENDED WORKFLOW

### Phase 1: Give Context (30 minutes)
```
1. AI reads SHOPIFY_AI_BRIEF.md (full context)
2. AI reads SHOPIFY_QUICK_START.md (action plan)
3. AI explores Shopify theme files
4. AI explores Next.js repo (pages/api/ directory)
```

**You ask:** "What files need to be created or modified?"

**AI should identify:**
- pages/api/shopify-webhook.js (create or fix)
- Shopify theme.liquid (add attribution JS)
- .env.local (add SHOPIFY_WEBHOOK_SECRET)
- Shopify webhook configuration (via admin)

---

### Phase 2: Implementation (2-4 hours)
```
Task 1: Implement webhook handler
  → AI creates/fixes pages/api/shopify-webhook.js
  → You verify HMAC validation logic
  → You add SHOPIFY_WEBHOOK_SECRET to .env.local

Task 2: Fix attribution capture
  → AI adds JavaScript to Shopify theme.liquid
  → You deploy theme changes to Shopify
  → You test with ?ref=TEST123 parameter

Task 3: Configure webhook
  → You go to Shopify Admin → Settings → Notifications → Webhooks
  → You create webhook for orders/create
  → You copy webhook secret, add to .env.local
  → AI verifies webhook configuration
```

---

### Phase 3: Testing (1-2 hours)
```
1. Set up ngrok for local testing
   → npm run dev
   → ngrok http 3000
   → Update Shopify webhook URL to ngrok URL

2. Run attribution flow test
   → Visit /t?u=TEST123 (after creating test UID)
   → Verify redirect to Shopify with ref
   → Check cart.json for attributes

3. Trigger test webhook
   → shopify webhook trigger orders/create
   → Verify 200 OK response
   → Check Supabase for new order row

4. End-to-end test
   → Real NFC tap (or simulate with URL)
   → Complete actual test checkout
   → Verify order + payout job created
```

---

### Phase 4: Verification (30 minutes)
```
AI runs through verification checklist from SHOPIFY_QUICK_START.md:

✅ Attribution flow works
✅ Webhook processes successfully
✅ Orders sync to Supabase
✅ Payout jobs created
✅ retailer_id populated correctly
✅ Commission splits calculated
✅ Works on mobile device
```

---

## 🎯 WHAT SUCCESS LOOKS LIKE

**Before (Broken):**
```
Customer taps NFC → Shopify checkout → Order completes
❌ Order not in Supabase
❌ No payout job created
❌ Retailer can't get paid
```

**After (Fixed):**
```
Customer taps NFC → Shopify checkout → Order completes
✅ Webhook fires within 1 second
✅ Order synced to Supabase
✅ Payout job created with retailer_id
✅ Retailer sees pending commission in dashboard
✅ Admin can process payout via Dwolla
```

---

## 🆘 IF THE AI GETS STUCK

### Common Sticking Points & Solutions

**1. "I can't access your Shopify store"**
```
→ AI doesn't need direct access
→ It should generate code for you to deploy
→ You deploy theme changes via Shopify admin
→ You configure webhooks manually
```

**2. "I need the SHOPIFY_WEBHOOK_SECRET"**
```
→ Go to Shopify Admin → Settings → Notifications → Webhooks
→ Create webhook for orders/create
→ Copy the webhook signing secret
→ Give to AI to add to .env.local
```

**3. "How do I test without a real NFC tag?"**
```
→ Create test UID in Supabase manually:
   INSERT INTO uids (uid, is_claimed, affiliate_url)
   VALUES ('TEST123', true, 'https://pawpayaco.com?ref=TEST123');

→ Visit http://localhost:3000/t?u=TEST123 in browser
→ Should redirect to Shopify with ref parameter
```

**4. "Database schema doesn't match documentation"**
```
→ Your database recently underwent migration (Oct 2025)
→ Refer to context/CLAUDE.md for migration notes
→ Use context/supabase/tables_and_columns.md for current schema
→ Key change: retailer_owners deprecated, data now in retailers
```

---

## 📚 SUPPLEMENTARY CONTEXT

If the AI needs deeper understanding, point it to your `/context/` folder:

**Business Strategy:**
- `context/GAME_PLAN_2.0.md` → Why Tapify exists, business model
- `context/data_model.md` → Entity relationships

**Shopify Deep Dive:**
- `context/shopify/flows.md` → Transaction flow diagrams
- `context/shopify/webhooks.md` → Webhook payload examples
- `context/shopify/integration_points.md` → API specs

**Database:**
- `context/supabase/tables_and_columns.md` → Full schema
- `context/supabase/foreign_keys.md` → Relationships

**Next.js:**
- `context/nextjs/pages_api_summary.md` → All API routes
- `context/nextjs/shopify_integration.md` → Frontend patterns

---

## 🎬 EXAMPLE PROMPTS TO USE

### Initial Prompt
```
I need you to fix the Shopify integration for my Tapify marketplace.

Read these documents:
1. SHOPIFY_AI_BRIEF.md (complete context)
2. SHOPIFY_QUICK_START.md (action plan)

Your goal: Make orders sync from Shopify to Supabase via webhooks,
with proper retailer attribution for commission tracking.

Start by analyzing the current state of pages/api/shopify-webhook.js
and identify what's broken or missing.
```

---

### Debugging Prompt
```
Orders are syncing to Supabase, but retailer_id is always null.

Refer to SHOPIFY_INTEGRATION_DIAGRAMS.md "Scenario 3: Missing Attribution"
and the debugging flowchart for "Attribution Not Working".

Walk me through the diagnosis steps to find where attribution is failing.
```

---

### Implementation Prompt
```
Implement the webhook handler according to Integration Point 2
in SHOPIFY_AI_BRIEF.md.

Requirements:
- HMAC validation using crypto.timingSafeEqual()
- Extract ref from note_attributes
- Lookup retailer from uids table
- Insert into orders table
- Create payout_job
- Update scans table
- Always return 200 OK

Show me the complete implementation.
```

---

## ✅ FINAL CHECKLIST FOR YOU (OSCAR)

Before handing off to AI:

- [ ] Shopify store URL confirmed: pawpayaco.com ✅
- [ ] Next.js repo accessible to AI ✅
- [ ] Supabase credentials in .env.local ✅
- [ ] These 3 briefing documents in Shopify repo root ✅
- [ ] Context folder available if AI needs deep dive ✅

During AI work:

- [ ] Monitor AI's understanding (does it get the business model?)
- [ ] Verify code implementations match security requirements
- [ ] Test locally with ngrok before deploying to production
- [ ] Check Supabase for data after each test

After AI completes:

- [ ] Run full end-to-end test (NFC tap → checkout → database)
- [ ] Verify payout job created with correct commission splits
- [ ] Test on mobile device (90% of NFC users)
- [ ] Deploy to production
- [ ] Monitor Shopify webhook delivery logs

---

## 🎯 SUCCESS METRICS

**The integration is successful when:**

1. ✅ Customer taps NFC → lands on Shopify with ref parameter
2. ✅ Customer completes checkout → webhook fires within 5 seconds
3. ✅ Order appears in Supabase `orders` table
4. ✅ Payout job created in `payout_jobs` table
5. ✅ `retailer_id` is populated (not null)
6. ✅ Commission amounts correct (20% retailer, 80% vendor)
7. ✅ Can repeat 10 times without errors
8. ✅ Works on mobile Safari & Chrome

**Then:** Tapify's revenue engine is operational. Retailers can earn passive income. The business model works.

---

## 💬 FEEDBACK LOOP

**After AI completes the work:**

1. Document what the AI fixed
2. Document any issues it struggled with
3. Update these briefing docs if needed
4. Consider adding AI-generated code to `/context/` as examples

**This creates a virtuous cycle:**
- Better documentation → Better AI performance → Better code → Better documentation

---

*Handoff Instructions Version: 1.0*
*For use with: SHOPIFY_AI_BRIEF.md, SHOPIFY_QUICK_START.md, SHOPIFY_INTEGRATION_DIAGRAMS.md*

---

## 🚀 YOU'RE READY

These documents give your AI coder everything it needs to:
- Understand your business model
- Comprehend the technical architecture
- Implement the Shopify integration
- Test and verify functionality
- Deploy to production

**Go build the future of retail. 🐾**
