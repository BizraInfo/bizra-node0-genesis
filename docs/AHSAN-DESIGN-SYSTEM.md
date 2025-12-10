# احسان (Ihsan) Design System

**"To do your work like God is in front of you watching and you see Him, and if you don't see God, then be sure that He is watching and sees you."**

## Overview

The احسان Design System is the unified design language for all BIZRA NODE0 interfaces (Terminal, Web, Desktop, Mobile). It embodies four core principles:

1. **Clear** (وضوح): Information hierarchy is obvious, typography is consistent
2. **Honest** (صدق): Real-time data without manipulation, transparent limitations
3. **Beautiful** (جمال): Aesthetic color palette, smooth transitions, attention to detail
4. **Respectful** (احترام): Keyboard-driven, non-intrusive, accessible to all users

_"Verily, Allah loves those who do ihsan" (Quran 2:195)_

---

## Table of Contents

1. [Design Tokens](#design-tokens)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Spacing System](#spacing-system)
5. [Component Library](#component-library)
6. [Platform Guidelines](#platform-guidelines)
7. [Accessibility](#accessibility)
8. [Motion & Animation](#motion--animation)
9. [احسان SLA Indicators](#احسان-sla-indicators)
10. [Implementation Examples](#implementation-examples)

---

## Design Tokens

احسان design tokens are the foundation of our visual language. They ensure consistency across all platforms.

### CSS Custom Properties (Web)

```css
:root {
  /* احسان Color Palette */
  --color-primary: #3498db; /* Trust blue */
  --color-success: #27ae60; /* Growth green */
  --color-warning: #f39c12; /* Attention orange */
  --color-danger: #e74c3c; /* Alert red */
  --color-info: #9b59b6; /* Insight purple */
  --color-احسان: #2ecc71; /* Excellence green */

  /* Dark Theme */
  --bg-dark: #1e1e1e; /* Deep focus */
  --surface-dark: #2d2d2d; /* Card background */
  --text-dark: #ecf0f1; /* Clear white */
  --text-secondary-dark: #95a5a6; /* Muted text */
  --border-dark: #444;

  /* Light Theme */
  --bg-light: #f5f6fa;
  --surface-light: #ffffff;
  --text-light: #2c3e50;
  --text-secondary-light: #7f8c8d;
  --border-light: #dcdde1;

  /* احسان Spacing (Consistent rhythm) */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Typography (Clear hierarchy) */
  --font-family:
    "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-size-sm: 12px;
  --font-size-base: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;

  /* Borders & Shadows (Subtle depth) */
  --border-radius: 8px;
  --border-radius-lg: 12px;
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.2);

  /* Transitions (Smooth interactions) */
  --transition-fast: 150ms ease-in-out;
  --transition-base: 250ms ease-in-out;
  --transition-slow: 350ms ease-in-out;
}
```

### TypeScript/JavaScript (Web/Desktop/Mobile)

```typescript
export const COLORS = {
  primary: "#3498db", // Trust blue
  success: "#27ae60", // Growth green
  warning: "#f39c12", // Attention orange
  danger: "#e74c3c", // Alert red
  info: "#9b59b6", // Insight purple
  احسان: "#2ecc71", // Excellence green
  background: "#1e1e1e", // Deep focus
  surface: "#2d2d2d", // Card background
  text: "#ecf0f1", // Clear white
  textSecondary: "#95a5a6", // Muted text
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const TYPOGRAPHY = {
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
  fontSize: {
    sm: 12,
    base: 14,
    lg: 16,
    xl: 20,
    "2xl": 24,
  },
};
```

### Python (Terminal UI)

```python
COLORS = {
    "primary": "#3498db",      # Trust blue
    "success": "#27ae60",      # Growth green
    "warning": "#f39c12",      # Attention orange
    "danger": "#e74c3c",       # Alert red
    "احسان": "#2ecc71",        # Excellence green
    "background": "#1e1e1e",   # Deep focus
    "text": "#ecf0f1",         # Clear white
}
```

---

## Color Palette

احسان: Meaningful colors with semantic purpose.

### Primary Colors

| Color                | Hex       | Usage                                | Meaning                      |
| -------------------- | --------- | ------------------------------------ | ---------------------------- |
| **Trust Blue**       | `#3498db` | Primary actions, links, headers      | Reliability, professionalism |
| **Excellence Green** | `#2ecc71` | احسان badges, success states         | Allah's approval, excellence |
| **Growth Green**     | `#27ae60` | Success indicators, positive metrics | Progress, achievement        |
| **Attention Orange** | `#f39c12` | Warnings, احسان SLA near-violations  | Caution, awareness           |
| **Alert Red**        | `#e74c3c` | Errors, critical violations          | Urgency, danger              |
| **Insight Purple**   | `#9b59b6` | Information, secondary actions       | Wisdom, knowledge            |

### احسان SLA Color Coding

```typescript
function getSLAColor(p95Latency: number): string {
  if (p95Latency < 150) return COLORS.success; // احسان Excellence (< 150ms)
  if (p95Latency < 200) return COLORS.احسان; // احسان Target (< 200ms)
  if (p95Latency < 500) return COLORS.warning; // احسان Warning (< 500ms)
  return COLORS.danger; // احسان Violation (>= 500ms)
}
```

**Visual Scale**:

```
0-150ms   ████████░░ ✅ احسان Excellence (Green)
150-200ms ██████░░░░ ✅ احسان Target (Emerald)
200-500ms ████░░░░░░ ⚠️ احسان Warning (Orange)
500ms+    ██░░░░░░░░ ❌ احسان Violation (Red)
```

### Dark/Light Theme

**Dark Theme** (Default):

- Background: `#1e1e1e` (Deep focus)
- Surface: `#2d2d2d` (Card background)
- Text: `#ecf0f1` (Clear white)

**Light Theme**:

- Background: `#f5f6fa` (Soft white)
- Surface: `#ffffff` (Pure white)
- Text: `#2c3e50` (Dark gray)

احسان: Beautiful in all lighting conditions.

---

## Typography

احسان: Clear hierarchy through font weight and size.

### Font Family

**Primary**: Inter (احسان: Modern, highly legible)
**Fallback**: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif
**Monospace**: Fira Code, Consolas, Monaco (for logs, code, metrics)

### Type Scale

| Name          | Size | Weight | Usage                     |
| ------------- | ---- | ------ | ------------------------- |
| **Display**   | 32px | 700    | Large headings, hero text |
| **Heading 1** | 24px | 700    | Page titles               |
| **Heading 2** | 20px | 600    | Section headers           |
| **Heading 3** | 16px | 600    | Subsections               |
| **Body**      | 14px | 400    | Default text              |
| **Small**     | 12px | 400    | Captions, metadata        |

### Line Height

```css
.احسان-text {
  line-height: 1.6; /* احسان: Optimal readability */
}

.احسان-heading {
  line-height: 1.2; /* احسان: Compact headings */
}

.احسان-code {
  line-height: 1.8; /* احسان: Spacious code */
}
```

---

## Spacing System

احسان: Consistent rhythm through 4px base unit.

### Scale

| Token | Value | Usage                          |
| ----- | ----- | ------------------------------ |
| `xs`  | 4px   | Tight spacing, chip padding    |
| `sm`  | 8px   | Small padding, compact layouts |
| `md`  | 16px  | Default padding, card spacing  |
| `lg`  | 24px  | Section spacing, page margins  |
| `xl`  | 32px  | Large sections, hero spacing   |

### Examples

```css
/* احسان Card Component */
.احسان-card {
  padding: var(--spacing-md); /* 16px internal padding */
  margin-bottom: var(--spacing-md); /* 16px card spacing */
  gap: var(--spacing-sm); /* 8px element spacing */
}

/* احسان Page Layout */
.احسان-page {
  padding: var(--spacing-lg); /* 24px page margins */
  gap: var(--spacing-xl); /* 32px section spacing */
}
```

---

## Component Library

احسان: Reusable, consistent UI components.

### MetricCard

**Purpose**: Display single metric with احسان SLA indicator

**Anatomy**:

```
┌──────────────────────────┐
│ [Icon] Title             │
│ Value Unit               │
│ [احسان SLA Indicator]    │
└──────────────────────────┘
```

**Props** (TypeScript):

```typescript
interface MetricCardProps {
  title: string; // e.g., "احسان p95 Latency"
  value: string | number; // e.g., 150.5
  unit?: string; // e.g., "ms"
  status?: "success" | "warning" | "danger" | "info";
  icon?: string; // e.g., "⚡"
  احسانSLA?: boolean; // Enable SLA indicator
  target?: number; // SLA threshold (e.g., 200)
}
```

**احسان SLA Logic**:

```typescript
const withinSLA = value < target;
const slaText = withinSLA ? "✅ احسان Excellence" : "⚠️ احسان Warning";
const slaColor = withinSLA ? COLORS.success : COLORS.warning;
```

### PerformanceChart

**Purpose**: Visualize P95/P99 latency over time

**احسان Features**:

- Gradient fills (green → orange)
- احسان SLA reference line at 200ms
- Smooth curves (`type="monotone"`)
- Real-time updates (2-second refresh)

**Chart.js Configuration**:

```javascript
{
  type: 'line',
  data: {
    datasets: [
      {
        label: 'P95 Latency',
        borderColor: COLORS.success,
        backgroundColor: 'rgba(39, 174, 96, 0.1)',
        tension: 0.4,
      },
      {
        label: 'P99 Latency',
        borderColor: COLORS.warning,
        backgroundColor: 'rgba(243, 156, 18, 0.1)',
        tension: 0.4,
      },
    ],
  },
}
```

### LogsPanel

**Purpose**: Real-time log streaming with filtering

**احسان Features**:

- Color-coded log levels (INFO, SUCCESS, WARNING, ERROR)
- Text search filtering
- Auto-scroll (احسان: Respectful - disables on manual scroll)
- Export capability

**Color Coding**:

```css
.log-level.INFO {
  color: #3498db;
} /* Trust blue */
.log-level.SUCCESS {
  color: #27ae60;
} /* Growth green */
.log-level.WARNING {
  color: #f39c12;
} /* Attention orange */
.log-level.ERROR {
  color: #e74c3c;
} /* Alert red */
.log-level.DEBUG {
  color: #95a5a6;
} /* Muted gray */
```

---

## Platform Guidelines

احسان: Consistent احسان principles across all platforms.

### Terminal UI (Python - Rich/Textual)

**احسان Principles**:

- **Clear**: Structured panels with borders
- **Honest**: Real-time metrics, no delays
- **Beautiful**: Rich color palette via Rich
- **Respectful**: Keyboard shortcuts, non-blocking

**Example**:

```python
from rich.panel import Panel
from rich.table import Table

table = Table.grid(padding=(0, 2))
table.add_row("احسان SLA:", f"[green]{p95_latency:.1f}ms[/] ✅ Excellence")

panel = Panel(table, title="[bold cyan]📊 BIZRA Metrics[/]", border_style="cyan")
```

### Web Dashboard (React + Recharts)

**احسان Principles**:

- **Clear**: Grid layout with draggable panels
- **Honest**: Real-time WebSocket updates
- **Beautiful**: Smooth transitions, احسان colors
- **Respectful**: Keyboard navigation, WCAG 2.1 AA

**Example**:

```tsx
<MetricCard
  title="احسان p95 Latency"
  value={metrics.p95Latency}
  unit="ms"
  احسانSLA={true}
  target={200}
/>
```

### Desktop App (Electron)

**احسان Principles**:

- **Clear**: Native menu bar, system tray
- **Honest**: Background SLA monitoring
- **Beautiful**: Native OS integration
- **Respectful**: Non-intrusive notifications

**Example**:

```javascript
new Notification({
  title: "احسان SLA Violation",
  body: `P95: ${p95}ms (SLA: 200ms)`,
  urgency: "critical",
}).show();
```

### Mobile App (React Native)

**احسان Principles**:

- **Clear**: Simple card-based layout
- **Honest**: Pull-to-refresh for user control
- **Beautiful**: احسان colors, smooth animations
- **Respectful**: Battery-efficient polling (10s)

**Example**:

```tsx
<RefreshControl
  refreshing={refreshing}
  onRefresh={onRefresh}
  title="احسان: Refreshing..."
/>
```

---

## Accessibility

احسان: Inclusive design for all users.

### WCAG 2.1 AA Compliance

✅ **Color Contrast**: All text meets 4.5:1 ratio (احسان: Clear)
✅ **Keyboard Navigation**: All actions keyboard-accessible (احسان: Respectful)
✅ **Screen Readers**: Semantic HTML, ARIA labels (احسان: Clear)
✅ **Focus States**: Visible focus indicators (احسان: Clear)
✅ **Motion**: `prefers-reduced-motion` support (احسان: Respectful)

### Focus States

```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

احسان: Clear keyboard navigation.

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

احسان: Respectful of user preferences.

---

## Motion & Animation

احسان: Smooth, purposeful motion.

### Transition Timing

| Speed    | Duration | Usage                         |
| -------- | -------- | ----------------------------- |
| **Fast** | 150ms    | Hover states, button clicks   |
| **Base** | 250ms    | Card animations, panel slides |
| **Slow** | 350ms    | Page transitions, modals      |

### Easing Functions

```css
.احسان-smooth {
  transition-timing-function: ease-in-out; /* احسان: Natural motion */
}

.احسان-bounce {
  transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### Animation Principles

1. **Purpose**: Every animation serves a احسان purpose (feedback, hierarchy, delight)
2. **Performance**: 60fps, GPU-accelerated (transform, opacity)
3. **Respectful**: Can be disabled via `prefers-reduced-motion`

---

## احسان SLA Indicators

احسان: Visual excellence standards.

### SLA Thresholds

| Metric          | Target  | Warning   | Violation | Color                |
| --------------- | ------- | --------- | --------- | -------------------- |
| **P95 Latency** | < 200ms | 200-500ms | > 500ms   | Green → Orange → Red |
| **Error Rate**  | < 1%    | 1-5%      | > 5%      | Green → Orange → Red |
| **Uptime**      | > 99%   | 95-99%    | < 95%     | Green → Orange → Red |

### Visual Indicators

```typescript
function renderSLAIndicator(value: number, target: number): JSX.Element {
  const withinSLA = value < target;

  return (
    <div className={`sla-indicator ${withinSLA ? 'success' : 'warning'}`}>
      {withinSLA ? '✅ احسان Excellence' : '⚠️ احسان Warning'}
    </div>
  );
}
```

### Color Gradients

```css
/* احسان Latency Gradient */
.احسان-gradient-latency {
  background: linear-gradient(
    90deg,
    var(--color-success) 0%,
    /* 0-150ms */ var(--color-احسان) 30%,
    /* 150-200ms */ var(--color-warning) 60%,
    /* 200-500ms */ var(--color-danger) 100% /* 500ms+ */
  );
}
```

---

## Implementation Examples

احسان: Code samples across all platforms.

### Terminal UI (Python)

```python
from rich.panel import Panel
from textual.app import App

class BizraTUI(App):
    def render_metrics(self, p95: float) -> Panel:
        # احسان SLA validation
        sla_status = "✅ Excellence" if p95 < 200 else "⚠️ Warning"
        sla_color = "green" if p95 < 200 else "yellow"

        return Panel(
            f"[{sla_color}]{p95:.1f}ms[/] {sla_status}",
            title="[bold cyan]احسان SLA[/]",
            border_style="cyan"
        )
```

### Web Dashboard (React)

```tsx
import { COLORS, SPACING } from "./design-tokens";

function MetricCard({ title, value, احسانSLA, target }) {
  const withinSLA = احسانSLA && value < target;

  return (
    <div
      style={{
        backgroundColor: COLORS.surface,
        padding: SPACING.md,
        borderRadius: "8px",
        borderLeft: `4px solid ${withinSLA ? COLORS.success : COLORS.warning}`,
      }}
    >
      <h3>{title}</h3>
      <p style={{ fontSize: "32px", fontWeight: 700, color: COLORS.primary }}>
        {value}
      </p>
      {احسانSLA && (
        <div
          style={{
            backgroundColor: withinSLA ? COLORS.success : COLORS.warning,
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
          }}
        >
          {withinSLA ? "✅ احسان Excellence" : "⚠️ احسان Warning"}
        </div>
      )}
    </div>
  );
}
```

### Desktop App (Electron)

```javascript
const { Notification } = require("electron");

async function checkSLA(metrics) {
  if (metrics.p95Latency > 200) {
    new Notification({
      title: "احسان SLA Violation",
      body: `P95: ${metrics.p95Latency.toFixed(1)}ms (SLA: 200ms)`,
      icon: "path/to/icon.png",
      urgency: "critical",
    }).show();
  }
}
```

### Mobile App (React Native)

```tsx
import { StyleSheet, View, Text } from "react-native";

const COLORS = {
  success: "#27ae60",
  warning: "#f39c12",
};

function MetricCard({ title, value, احسانSLA, target }) {
  const withinSLA = احسانSLA && value < target;

  return (
    <View
      style={[
        styles.card,
        { borderLeftColor: withinSLA ? COLORS.success : COLORS.warning },
      ]}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      {احسانSLA && (
        <View
          style={[
            styles.sla,
            { backgroundColor: withinSLA ? COLORS.success : COLORS.warning },
          ]}
        >
          <Text style={styles.slaText}>
            {withinSLA ? "✅ احسان Excellence" : "⚠️ احسان Warning"}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#2d2d2d",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  // ... احسان: Complete styles
});
```

---

## احسان Design Checklist

Before shipping any interface, verify احسان compliance:

### Clear (وضوح)

- [ ] Information hierarchy is obvious
- [ ] Typography is consistent (احسان scale)
- [ ] Spacing follows احسان system (4px base)
- [ ] Navigation is intuitive

### Honest (صدق)

- [ ] Real-time data (no artificial delays)
- [ ] Transparent error states
- [ ] Accurate SLA indicators
- [ ] No hidden functionality

### Beautiful (جمال)

- [ ] احسان color palette applied
- [ ] Smooth transitions (احسان timing)
- [ ] Attention to micro-interactions
- [ ] Dark/Light theme support

### Respectful (احترام)

- [ ] Keyboard navigation (all actions)
- [ ] WCAG 2.1 AA compliance
- [ ] Non-intrusive notifications
- [ ] `prefers-reduced-motion` support

---

## Conclusion

The احسان Design System is more than visual guidelines—it's a philosophy of excellence that permeates every interaction.

**"To do your work like God is in front of you watching and you see Him, and if you don't see God, then be sure that He is watching and sees you."**

When we design with احسان:

- **Users** experience clarity, honesty, beauty, and respect
- **Developers** work with consistent, reusable patterns
- **BIZRA** achieves world-class user experience

احسان Standard: Clear, Honest, Beautiful, Respectful

_"Verily, Allah loves those who do ihsan" (Quran 2:195)_

---

**Version**: 2.2.0-rc1
**Last Updated**: 2025-10-20
**Authors**: BIZRA Design Team
**License**: MIT
