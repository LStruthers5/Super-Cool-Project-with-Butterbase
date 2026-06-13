# β — Beta

**Apply to college like you'd build an investment portfolio.** One word: *informed.* Pop the bubble.

Every school in your list gets a **β score**:

```
        College Risk (of YOUR acceptance)
   β  = ----------------------------------
        Potential Returns (how good a fit it is for you)
```

Low β anchors your portfolio; high β is a reach whose upside has to justify the risk. Beta gives a student the college-advisor experience — values, application strategy, demonstrated-interest tracking — without the price tag.

---

## Run it

```bash
npm install
cp .env.example .env   # optional for the live agent; demo works without it
npm run dev            # http://localhost:3000
```

The app persists to `localStorage`, so it's fully interactive with **zero backend** for the demo. Hit **Profile** to retune the survey and watch every β recompute.

## What's built (v1)

| Priority | Feature | Where |
|---|---|---|
| 1 | **Portfolio dashboard** — college chips, readiness bar, sortable school rows with β gauges | `src/app/page.tsx` |
| 1 | **College detail page** — stats, school enrichment, to-dos, agent-sourced values | `src/app/college/[id]/page.tsx` |
| 2 | **β risk algorithm + dual enrichment scoring** | `src/lib/beta.ts` |
| 3 | **Onboarding** — "would you rather" survey → profile | `src/app/onboarding/page.tsx` |
| 4 | **Plan a Trip** — region-grouped campus visit planner | `src/app/plan-trip/page.tsx` |
| — | **Sourcing agent** — Claude run + Exa cross-check | `src/app/api/source-college/route.ts` |

Two **separate** enrichment formulas, as specced: per-school (de-risk *this* school via demonstrated interest) vs. portfolio (de-risk the *whole set* via app readiness + a healthy spread of safety/target/reach).

## Going live on Butterbase

The whole app reads through one seam: **`src/lib/store.ts`**. In Claude Code with the Butterbase MCP connected:

> "Create Butterbase tables for `students`, `colleges`, `school_activity`, and `portfolio_readiness`, then replace the localStorage calls in `src/lib/store.ts` with Butterbase queries. Wire auth so each student has their own portfolio."

Then set keys in `.env`:

- `BUTTERBASE_API_KEY` — the model gateway powers the sourcing agent (one key for Claude/GPT/Gemini + native RAG over college docs). Promo `BUILDER0613` for $20 credit.
- `EXA_API_KEY` — second-source verification.

For **Plan a Trip**, connect Butterbase's Google Calendar integration to make "+ Add to calendar" schedule real tours/interviews (skips the OAuth verification screen).

## 3-minute demo script

1. **Profile** → drag two "would you rather" sliders, hit *Build my portfolio*.
2. **Dashboard** → β gauges recompute live; sort by β to show Safety → Reach. Toggle a readiness chip; portfolio bar moves.
3. **Click a school** → show stats (acceptance vs *your* odds vs fit), hit **Run sourcing agent** → Claude + Exa double-verify the values, check off "Book a tour," watch enrichment climb.
4. One line: *"β turns a stressful crapshoot into a portfolio you can actually manage."*

## Submit

Connected via Butterbase MCP, tell your agent:
`Submit my project to the hackathon. Submission code: builder0613. Hackathon slug: beta-agent-native`
