<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Design System

Before writing any UI code, read @DESIGN.md. All components must follow the design system defined there. Key rules:
- Use CSS variables (`--red`, `--black`, `--bg-soft`, etc.) — never hex codes directly
- Use existing CSS classes (`stat-tile`, `stat-tile red`, `stat-tile dark`, `stats-grid`, `sec-title`, `chip`, etc.)
- 2-column grid with `stats-grid` class for stat tiles
- Tabs use `chips` / `chip` / `chip active` classes
- Section headers use `sec-header`, `sec-title`, `sec-title-small`
