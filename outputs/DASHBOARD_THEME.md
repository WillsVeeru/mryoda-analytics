# Shared dashboard theme

Financial Overview is the design reference. `dashboard-theme.css` is the final shared typography and token layer; `dashboard-financial-foundation.css` and its JavaScript provide common card, control and table behaviour.

Every new dashboard page must include these assets, with the theme stylesheet last:

```html
<link rel="stylesheet" href="dashboard-financial-foundation.css">
<link rel="stylesheet" href="application-sidebar.css">
<link rel="stylesheet" href="application-chart-backgrounds.css">
<!-- Page layout stylesheet(s) go here. -->
<link rel="stylesheet" href="dashboard-theme.css">
<script src="lucide-ui.js"></script>
```

After page markup and page scripts:

```html
<script src="application-sidebar.js"></script>
<script src="application-header-scroll.js"></script>
<script src="dashboard-financial-foundation.js"></script>
<script src="dashboard-value-formulas.js"></script>
```

Use the shared variables instead of hard-coded sizes or alternate fonts. Defaults are Inter, 16px report titles with weight 500, 12.5px table rows with weight 400, 10.5px uppercase table headings with weight 700, 12px control/caption text, and 11px pagination text. KPI labels use 12px/500, values 26px/700 and supporting text 11px/400. Small screens reduce KPI values to 24px.

Keep Financial Overview's semantic colours for revenue, deductions, costs, results and comparison values. Keep Cost Analysis summary backgrounds and existing banner layouts. Inter loads via Google Fonts with `display=swap`, with Arial/system sans-serif as fallback while the font is loading or unavailable.

Financial Overview tables with dynamic date headings can pass explicit `columnTones` in `financialTable`'s fourth options argument. These tones cover header cells, body cells and generated totals. Inventory's monthly stock comparison uses inflow for the current month, benchmark for the previous month, and deduction for unit changes; stock movements keep their original values.

Home uses `home-dashboard-model.js` to read the existing revenue, Location Explorer, TAT and saved-target sources. Latest reports shows each section's own available dates; Selected dates requires complete coverage and supported scope, otherwise values stay unavailable. Do not recreate Home's former proportional sample generator. Finance model data and expense allocation are shared by Home and Financial Overview in `dashboard-financial-data.js`. Home reads saved targets and exact-period actual snapshots without creating targets or activity. It also uses the same labelled, presentation-only target previews as Targets & Alerts via `targets-alerts-sample.js`; available recorded actuals and saved targets take priority, including zero. Mark samples in rows and CSV source columns; keep unknown directory activity unavailable. Explicit Home report links carry their source dates through `dashboard-home-report-link.js`. Home revenue trend charts opt into chronological ordering; other chart ordering stays unchanged.

Table alignment is shared across all pages: names and descriptive text left, counts and other numeric measures (including percentages and durations) center, and currency amounts right. Apply the same alignment to column headings and totals. `dashboard-financial-foundation.js` maintains alignment after filtering, sorting, pagination and drilldowns, including Financial Overview. Use `data-column-align="left|center|right"` on a header when an ambiguous column needs an explicit type; preserve the actual data, calculations and semantic colours.

Drilldown reports share Location Explorer's structure: `dashboard-report-breadcrumb`, followed by `dashboard-summary-info` (context title and selected dates), `dashboard-context-summary` metric cards, then a separate table. Use `dashboard-summary-icon` with the existing icons; four-card summaries can set `data-summary-columns="4"`, and cards can preserve semantic colours with `data-summary-tone`. Breadcrumb ancestors are buttons and the current item uses `aria-current="page"`. Keep initial root views free of redundant breadcrumbs.

Location Explorer keeps its section title **Centers** at every drilldown level. The contextual heading below the breadcrumb names the selected branch, client or category and the next level: Client-level breakdown, Category-level breakdown or Test-level breakdown. Show client names and their IDs in one visible column, with the ID below the name; preserve the underlying ID for navigation, search and CSV export.

When adding a new page, link it from the existing sidebar navigation. Run the relevant page checks. `node tmp/check-tat-operations.cjs` checks the TAT reports and sidebar links.

Receivables preserves the supplied ageing snapshot as of 17 Nov 2026 and daily collections for 11–17 Nov 2026 in `receivables-data.js`. Missing manager, client and invoice detail is explicitly labelled sample allocation; it reconciles to the snapshot without claiming source invoice identities. Keep the outstanding as-of scope separate from collection dates, do not partially sum unavailable collection ranges, and never write sample collection targets into the shared revenue/test target store. Exports retain source labels and complete manager/client/branch context. `node tmp/check-receivables.cjs` checks reconciliation, scopes, formula inputs and navigation.

`login.html` is a standalone authentication presentation based on the supplied Yoda Lounge reference. It retains the shared Financial Overview theme and Inter, with a local font and its licence in `assets/fonts`. It has no dashboard sidebar or global report filters. Sign-in validates fields and reports that authentication is not connected; it never transmits/stores credentials, creates an authentication flag or treats a preview as a signed-in session. The separately labelled dashboard preview links to Home. Connect an actual identity service before enabling production sign-in.

Use `application-header-scroll.js` for the primary `main > header`: it hides after downward page scrolling and returns on upward scrolling, keyboard focus, or returning to the top. Focused or expanded filters keep the header visible. The shared theme provides sticky positioning, motion preferences and print handling. Pages without a global header do not gain an extra header.

Cost Analysis separates report dates from comparison dates. Overview, Pivot and By Branch use the global From/To range; the local Report dates controls update that same range. Period Comparison owns its independent Current period and Compare with selections, including year and calendar-quarter fields. Overview's change metric uses the immediately preceding equal-length range. Use `financialCostActivePeriod` for matching table captions, charts, formulas and exports; retain `financialPeriod`'s existing calendar behavior for Inventory.

Report dates supports Monthly (Year + Month), Quarterly (Year + Quarter), Half-yearly (Year + H1/H2), Yearly (Year), and Custom dates (From/To). The initial selection is Custom dates with both From and To set to Today in Asia/Kolkata. Preserve selections when switching tabs; switching a calendar period to Custom dates retains that period for editing. Selections are drafts: always preview their resolved date range, mark unapplied changes, and update the global range only on Apply period. Preserve an externally changed global date range by synchronizing the report controls to its matching calendar period or Custom dates. Report selections do not change the independent Period Comparison controls.

Cost Analysis Overview, Pivot and By Branch share one four-card summary: total spend, operating expenses, capital expenses, and the change in total spend against the prior equal-length range. Use the same expense allocations and selected branch/date scope in all three views. Suppress the generic single-card table summary when this shared row is present, while retaining table totals and pagination. Overview summarizes all four categories; its branch comparisons, salary share, per-branch operating average and spending trend retain their operating-expense scope. Show branch change amounts and percentages explicitly; a zero prior baseline is new spend, with no percentage change. Period Comparison retains its own four comparison metrics and independent date selections.

Quality Control and the separate Center Overview navigation entry are temporarily hidden using `hidden data-sidebar-hidden="true"`. Keep their buttons, destinations and pages intact. Financial Overview remains visible even though it uses the same underlying page as Center Overview.
