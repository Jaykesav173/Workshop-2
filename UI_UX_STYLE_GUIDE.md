# VISOR UI/UX Style Guide

**Version 1.0** | **Last Updated:** 2024

This document defines the visual design system and UI/UX standards for the VISOR (Visual Inspection Report Automation) platform. All components, pages, and modules must adhere to these guidelines to ensure a consistent, modern, and professional user experience.

---

## 🎨 Design Philosophy

VISOR follows a **clean, minimal, modern SaaS interface** aesthetic inspired by leading platforms like Notion, Linear, Stripe, and Vercel. The design prioritizes:

- **Clarity** over decoration
- **Functionality** over flashy effects
- **Consistency** across all modules
- **Accessibility** and usability

---

## 🎨 Color Palette

### Primary Colors

```css
/* Primary Blue - Main brand color */
--color-primary: #2563EB;
--color-primary-hover: #1D4ED8;
--color-primary-light: #DBEAFE;
--color-primary-dark: #1E40AF;

/* Background Colors */
--color-bg-primary: #FFFFFF;
--color-bg-secondary: #F3F4F6;
--color-bg-tertiary: #F9FAFB;

/* Border Colors */
--color-border: #E5E7EB;
--color-border-light: #F3F4F6;
--color-border-dark: #D1D5DB;

/* Text Colors */
--color-text-primary: #111827;
--color-text-secondary: #6B7280;
--color-text-tertiary: #9CA3AF;
--color-text-inverse: #FFFFFF;
```

### Semantic Colors

```css
/* Success */
--color-success: #10B981;
--color-success-light: #D1FAE5;
--color-success-dark: #059669;

/* Warning */
--color-warning: #FBBF24;
--color-warning-light: #FEF3C7;
--color-warning-dark: #F59E0B;

/* Error */
--color-error: #EF4444;
--color-error-light: #FEE2E2;
--color-error-dark: #DC2626;

/* Info */
--color-info: #3B82F6;
--color-info-light: #DBEAFE;
--color-info-dark: #2563EB;
```

### Usage Guidelines

- **Primary Blue (#2563EB)**: Use for primary actions, links, active states, and key UI elements
- **Text Primary (#111827)**: Main body text, headings
- **Text Secondary (#6B7280)**: Supporting text, labels, descriptions
- **Background Gray (#F3F4F6)**: Page backgrounds, subtle dividers
- **Card White (#FFFFFF)**: All card components, modals, dropdowns

---

## 📐 Typography

### Font Family

```css
font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Primary Font:** Inter (preferred)  
**Fallback:** Roboto, system fonts

### Font Sizes & Weights

```css
/* Headings */
--text-4xl: 2.25rem;    /* 36px */ - font-bold (700)
--text-3xl: 1.875rem;   /* 30px */ - font-bold (700)
--text-2xl: 1.5rem;     /* 24px */ - font-semibold (600)
--text-xl: 1.25rem;     /* 20px */ - font-semibold (600)
--text-lg: 1.125rem;    /* 18px */ - font-medium (500)

/* Body */
--text-base: 1rem;      /* 16px */ - font-normal (400)
--text-sm: 0.875rem;    /* 14px */ - font-normal (400)
--text-xs: 0.75rem;     /* 12px */ - font-normal (400)
```

### Line Heights

- Headings: `1.2` (tight)
- Body text: `1.5` (comfortable)
- Small text: `1.4`

---

## 📦 Component Specifications

### Cards

**All cards must follow this structure:**

```jsx
<div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
  {/* Card content */}
</div>
```

**Specifications:**
- **Border Radius:** `16px` (rounded-2xl)
- **Padding:** `24px` (p-6)
- **Background:** White (#FFFFFF)
- **Border:** `1px solid #E5E7EB`
- **Shadow:** `shadow-sm` (subtle), `shadow-md` on hover
- **Spacing:** Minimum 20-28px internal padding

**KPI Cards Pattern:**
```jsx
<div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
  <div className="flex items-start justify-between">
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
      <div className="flex items-center gap-1 text-sm text-green-600">
        {/* Trend indicator */}
      </div>
    </div>
    <div className="p-3 rounded-xl bg-blue-50">
      <div className="text-blue-600">
        {/* Icon */}
      </div>
    </div>
  </div>
</div>
```

---

### Tables

**Standard Table Structure:**

```jsx
<div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
  <div className="p-6 border-b border-gray-200">
    <h3 className="text-lg font-semibold text-gray-900">Table Title</h3>
  </div>
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Column Header
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        <tr className="hover:bg-gray-50 transition-colors">
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            Cell Content
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

**Specifications:**
- **Container:** White background, rounded-2xl, border, shadow-sm
- **Header:** Gray-50 background (#F9FAFB)
- **Header Text:** `text-xs font-medium text-gray-500 uppercase tracking-wider`
- **Row Padding:** `px-6 py-4` (24px horizontal, 16px vertical)
- **Row Hover:** `hover:bg-gray-50` with transition
- **Borders:** `divide-y divide-gray-200` between rows
- **Cell Text:** `text-sm` for body, `text-gray-900` for primary, `text-gray-600` for secondary

---

### Modals / Dialogs

**Standard Modal Structure:**

```jsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
    {/* Header */}
    <div className="p-6 border-b border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-900">Modal Title</h2>
    </div>
    
    {/* Content */}
    <div className="p-6">
      {/* Modal content */}
    </div>
    
    {/* Footer */}
    <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
      <button className="px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200">
        Cancel
      </button>
      <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
        Confirm
      </button>
    </div>
  </div>
</div>
```

**Specifications:**
- **Backdrop:** `bg-black bg-opacity-50` (semi-transparent overlay)
- **Container:** White, rounded-2xl, shadow-xl, max-width constraints
- **Padding:** `p-6` (24px) for all sections
- **Border:** `border-gray-200` between header/content/footer
- **Buttons:** Right-aligned in footer, gap-3 between buttons
- **Z-index:** `z-50` for modal, ensure proper layering

---

### Forms

**Input Field Pattern:**

```jsx
<div className="mb-5">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Label Text
  </label>
  <input
    type="text"
    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    placeholder="Placeholder text"
  />
</div>
```

**Select Dropdown Pattern:**

```jsx
<select className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
  <option>Select option</option>
</select>
```

**Textarea Pattern:**

```jsx
<textarea
  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
  rows="4"
></textarea>
```

**Form Specifications:**
- **Label:** `text-sm font-medium text-gray-700`, `mb-2` spacing
- **Input Height:** `py-2.5` (40px total height)
- **Border Radius:** `rounded-xl` (12px)
- **Border:** `border-gray-300` (#D1D5DB)
- **Focus Ring:** `focus:ring-2 focus:ring-blue-500` (2px blue ring)
- **Spacing:** `mb-5` (20px) between form fields
- **Placeholder:** `text-gray-500` (#6B7280)

---

### Buttons

**Primary Button:**

```jsx
<button className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
  Primary Action
</button>
```

**Secondary Button:**

```jsx
<button className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">
  Secondary Action
</button>
```

**Danger Button:**

```jsx
<button className="px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors">
  Delete
</button>
```

**Floating Action Button (FAB):**

```jsx
<button className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 flex items-center justify-center">
  {/* Icon */}
</button>
```

**Button Specifications:**
- **Padding:** `px-4 py-2.5` (16px horizontal, 10px vertical)
- **Border Radius:** `rounded-xl` (12px) for standard, `rounded-full` for FAB
- **Font Weight:** `font-medium` (500)
- **Hover:** Darken background color by 100 shade
- **Transition:** `transition-colors` for smooth color change
- **FAB:** `w-14 h-14` (56px), `shadow-lg`, `hover:scale-110` for lift effect

---

### Navigation Layout

**Standard Dashboard Layout:**

```jsx
<div className="min-h-screen bg-gray-50 flex">
  {/* Sidebar */}
  <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
    {/* Sidebar content */}
  </aside>

  {/* Main Content */}
  <div className="flex-1 flex flex-col overflow-hidden">
    {/* Top Navigation */}
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      {/* Header content */}
    </header>

    {/* Page Content */}
    <main className="flex-1 overflow-y-auto p-6">
      {/* Page content */}
    </main>
  </div>
</div>
```

**Specifications:**
- **Sidebar Width:** `w-64` (256px) when open
- **Sidebar Background:** White with right border
- **Top Nav:** White background, bottom border, `px-6 py-4` padding
- **Main Content:** `p-6` (24px) padding, `overflow-y-auto` for scrolling
- **Background:** `bg-gray-50` (#F3F4F6) for page background

**Sidebar Menu Item:**

```jsx
<button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
  isActive
    ? 'bg-blue-50 text-blue-600 font-medium'
    : 'text-gray-700 hover:bg-gray-50'
}`}>
  <div className={isActive ? 'text-blue-600' : 'text-gray-500'}>
    {/* Icon */}
  </div>
  <span className="text-sm">Menu Label</span>
</button>
```

---

### Charts

**Chart Container:**

```jsx
<div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">Chart Title</h3>
  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
    {/* Chart component */}
  </div>
</div>
```

**Chart Specifications:**
- **Container:** Same as card component (white, rounded-2xl, shadow-sm)
- **Title:** `text-lg font-semibold text-gray-900 mb-4`
- **Chart Area:** `h-64` (256px height), `bg-gray-50` background, `rounded-xl`
- **Colors:** Use primary blue (#2563EB) and gray tones
- **Gridlines:** Light gray, subtle
- **Tooltips:** Rounded corners, soft shadow

---

### Badges / Tags

**Status Badge:**

```jsx
<span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
  Active
</span>
```

**Priority Badge:**

```jsx
<span className={`px-2 py-1 text-xs font-medium rounded-full ${
  priority === 'High' 
    ? 'bg-red-100 text-red-800' 
    : 'bg-yellow-100 text-yellow-800'
}`}>
  {priority}
</span>
```

**Badge Specifications:**
- **Padding:** `px-2 py-1` (8px horizontal, 4px vertical)
- **Font:** `text-xs font-medium`
- **Border Radius:** `rounded-full`
- **Colors:** Light background with darker text (e.g., `bg-blue-100 text-blue-800`)

---

## 🎯 Spacing System

Use consistent spacing throughout:

```css
/* Spacing Scale (Tailwind) */
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px */
--spacing-3: 0.75rem;   /* 12px */
--spacing-4: 1rem;      /* 16px */
--spacing-5: 1.25rem;   /* 20px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
--spacing-10: 2.5rem;   /* 40px */
```

**Usage Guidelines:**
- **Between form fields:** `mb-5` (20px)
- **Card padding:** `p-6` (24px)
- **Section spacing:** `mb-8` (32px)
- **Page padding:** `p-6` (24px)
- **Grid gaps:** `gap-6` (24px)

---

## 🎭 Icons

**Icon Style:** Lucide / HeroIcons (outline style)

**Icon Sizes:**
- **Small:** `w-4 h-4` (16px)
- **Medium:** `w-5 h-5` (20px) - **Standard**
- **Large:** `w-6 h-6` (24px)
- **XLarge:** `w-8 h-8` (32px)

**Icon Colors:**
- **Default:** `text-gray-500` (#6B7280)
- **Active:** `text-blue-600` (#2563EB)
- **Hover:** `text-gray-700` (#374151)
- **Success:** `text-green-600` (#10B981)
- **Error:** `text-red-600` (#EF4444)

---

## ✨ Animations & Transitions

**Guidelines:**
- Keep animations **subtle and professional**
- Use transitions for hover states
- Avoid heavy animations

**Standard Transitions:**

```css
/* Hover transitions */
transition-colors duration-200
transition-all duration-200
transition-shadow duration-200

/* Card hover lift */
hover:shadow-md transition-shadow

/* Button hover */
hover:bg-blue-700 transition-colors

/* FAB hover */
hover:scale-110 transition-all

/* Modal open/close */
transition-opacity duration-300
```

---

## 📱 Responsive Breakpoints

```css
/* Tailwind Breakpoints */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large */
2xl: 1536px /* 2X Extra large */
```

**Responsive Patterns:**
- **Mobile:** Single column, stacked layout
- **Tablet:** 2-column grids where appropriate
- **Desktop:** 3-column grids, full sidebar

---

## 🎨 Component Examples

### Search Bar

```jsx
<div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
    <Icons.Search className="w-5 h-5 text-gray-400" />
  </div>
  <input
    type="text"
    placeholder="Search users, inspections, sites..."
    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl bg-gray-50 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  />
</div>
```

### KPI Card with Trend

```jsx
<div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
  <div className="flex items-start justify-between">
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-600 mb-1">Total Users</p>
      <p className="text-3xl font-bold text-gray-900 mb-2">57</p>
      <div className="flex items-center gap-1 text-sm text-green-600">
        <Icons.TrendingUp className="w-4 h-4" />
        <span>+12%</span>
      </div>
    </div>
    <div className="p-3 rounded-xl bg-blue-50">
      <Icons.Users className="w-5 h-5 text-blue-600" />
    </div>
  </div>
</div>
```

### Alert/Notification Card

```jsx
<div className="p-4 bg-red-50 border border-red-200 rounded-xl">
  <div className="flex items-start justify-between mb-2">
    <p className="text-sm font-medium text-gray-900">Alert message</p>
    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
      High
    </span>
  </div>
</div>
```

---

## ✅ Checklist for New Components

When creating new components, ensure:

- [ ] Uses white background for cards/modals
- [ ] Rounded corners (12-16px)
- [ ] Soft shadows (shadow-sm, shadow-md)
- [ ] Consistent spacing (p-6, mb-5, gap-6)
- [ ] Proper typography (text-sm, font-medium)
- [ ] Blue accent color (#2563EB) for primary actions
- [ ] Gray borders (#E5E7EB)
- [ ] Hover effects with transitions
- [ ] Responsive design (mobile-first)
- [ ] Matches Admin Dashboard aesthetic

---

## 📚 Reference Components

All components should visually match:

- **Admin Dashboard** (`/admin/dashboard`)
- **KPI Cards** - Modern, clean, with icons
- **Tables** - Clean rows, hover effects
- **Forms** - Rounded inputs, proper spacing
- **Modals** - Centered, rounded, soft shadow
- **Navigation** - Sidebar + top nav pattern

---

## 🔄 Version History

- **v1.0** (2024) - Initial style guide based on Admin Dashboard design

---

**Remember:** Consistency is key. Every component should feel like part of the same unified platform.

