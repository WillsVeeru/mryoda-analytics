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
<script src="dashboard-financial-foundation.js"></script>
<script src="dashboard-value-formulas.js"></script>
```

Use the shared variables instead of hard-coded sizes or alternate fonts. Defaults are Inter, 16px report titles with weight 500, 12.5px table rows with weight 400, 10.5px uppercase table headings with weight 700, 12px control/caption text, and 11px pagination text. KPI labels use 12px/500, values 26px/700 and supporting text 11px/400. Small screens reduce KPI values to 24px.

Keep Financial Overview's semantic colours for revenue, deductions, costs, results and comparison values. Keep Cost Analysis summary backgrounds and existing banner layouts. Inter loads via Google Fonts with `display=swap`, with Arial/system sans-serif as fallback while the font is loading or unavailable.

When adding a new page, link it from the existing sidebar navigation. Run the relevant page checks. `node tmp/check-tat-operations.cjs` checks the TAT reports and sidebar links.
