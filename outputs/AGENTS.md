# Dashboard theme requirements

Financial Overview (`center-overview.html`) is the visual source for every dashboard page, including future pages. This is an explicit user preference.

- Use Inter everywhere, including body text, headings, KPI values, form controls, dialogs, tables and SVG chart labels.
- Load `dashboard-financial-foundation.css`, then page-specific styles, and load `dashboard-theme.css` last. Do not override the shared font or typography tokens in page CSS.
- Use `dashboard-financial-foundation.js` for shared KPI and table enhancement; load it after the page markup and report scripts.
- Use the sizes, weights, colours, surfaces, financial semantic colours, spacing and interactions defined by the shared theme. Page CSS should describe layout and genuinely page-specific states.
- Retain `application-sidebar.css` / `application-sidebar.js` for the common sidebar and `application-chart-backgrounds.css` for chart surfaces.
- Retain existing tab designs on Revenue & Sales and Financial Overview. Revenue-style report tabs, including TAT & Operations, use `revenue-report-layout.css` and the existing icon system in `lucide-ui.js`.
- Keep switches anchored to the right when tabs are hidden. Preserve responsive layouts, accessible controls, reduced-motion behaviour and financial colour meaning.
- Preserve report calculations and filters when changing presentation. Never invent source rows hidden by PDF pagination.
- Load `dashboard-value-formulas.js` after report scripts for contextual table explanations. Explain only calculations verified against the displayed result and actual available inputs; keep raw source values unannotated when their inputs are missing.
- Do not edit backup HTML files containing `Copy` in their names.

See `DASHBOARD_THEME.md` for the new-page stylesheet contract.
