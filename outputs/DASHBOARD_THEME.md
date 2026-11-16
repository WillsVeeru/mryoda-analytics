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

Table alignment is shared across all pages: names and descriptive text left, counts and other numeric measures (including percentages and durations) center, and currency amounts right. Apply the same alignment to column headings and totals. `dashboard-financial-foundation.js` maintains alignment after filtering, sorting, pagination and drilldowns, including Financial Overview. Use `data-column-align="left|center|right"` on a header when an ambiguous column needs an explicit type; preserve the actual data, calculations and semantic colours.

Drilldown reports share Location Explorer's structure: `dashboard-report-breadcrumb`, followed by `dashboard-summary-info` (context title and selected dates), `dashboard-context-summary` metric cards, then a separate table. Use `dashboard-summary-icon` with the existing icons; four-card summaries can set `data-summary-columns="4"`, and cards can preserve semantic colours with `data-summary-tone`. Breadcrumb ancestors are buttons and the current item uses `aria-current="page"`. Keep initial root views free of redundant breadcrumbs.

When adding a new page, link it from the existing sidebar navigation. Run the relevant page checks. `node tmp/check-tat-operations.cjs` checks the TAT reports and sidebar links.

Use `application-header-scroll.js` for the primary `main > header`: it hides after downward page scrolling and returns on upward scrolling, keyboard focus, or returning to the top. Focused or expanded filters keep the header visible. The shared theme provides sticky positioning, motion preferences and print handling. Pages without a global header do not gain an extra header.

Quality Control and the separate Center Overview navigation entry are temporarily hidden using `hidden data-sidebar-hidden="true"`. Keep their buttons, destinations and pages intact. Financial Overview remains visible even though it uses the same underlying page as Center Overview.
