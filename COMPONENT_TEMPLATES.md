# VISOR Component Templates

Quick reference templates for creating new components that match the Admin Dashboard design.

---

## 📋 Table Component Template

```jsx
import { Icons } from './Icons' // Your icon component

function DataTable({ data, columns }) {
  return (
    <div className="visor-table-container">
      <div className="visor-card-header">
        <h3 className="visor-card-title">Table Title</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="visor-table">
          <thead className="visor-table-header">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="visor-table-header-cell">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr key={index} className="visor-table-row">
                {columns.map((col) => (
                  <td key={col.key} className="visor-table-cell visor-table-cell-primary">
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

---

## 📝 Form Component Template

```jsx
function FormExample() {
  return (
    <div className="visor-card">
      <div className="visor-card-header">
        <h2 className="visor-card-title">Form Title</h2>
      </div>
      <form className="visor-card-content">
        <div className="visor-form-group">
          <label className="visor-form-label">Field Label</label>
          <input
            type="text"
            className="visor-form-input"
            placeholder="Enter value"
          />
        </div>
        
        <div className="visor-form-group">
          <label className="visor-form-label">Select Field</label>
          <select className="visor-form-select">
            <option>Choose option</option>
          </select>
        </div>
        
        <div className="visor-form-group">
          <label className="visor-form-label">Textarea</label>
          <textarea
            className="visor-form-textarea"
            rows="4"
            placeholder="Enter text"
          />
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button type="button" className="visor-btn visor-btn-secondary">
            Cancel
          </button>
          <button type="submit" className="visor-btn visor-btn-primary">
            Submit
          </button>
        </div>
      </form>
    </div>
  )
}
```

---

## 🎴 Modal Component Template

```jsx
function ModalExample({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="visor-modal-backdrop" onClick={onClose}>
      <div className="visor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="visor-modal-header">
          <h2 className="visor-modal-title">Modal Title</h2>
        </div>
        
        <div className="visor-modal-content">
          {/* Modal content here */}
        </div>
        
        <div className="visor-modal-footer">
          <button onClick={onClose} className="visor-btn visor-btn-secondary">
            Cancel
          </button>
          <button className="visor-btn visor-btn-primary">
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 📊 KPI Card Template

```jsx
function KPICard({ title, value, trend, trendUp, icon: Icon, color = 'blue' }) {
  const bgColors = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    yellow: 'bg-yellow-50',
    red: 'bg-red-50',
  }
  
  const iconColors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
  }

  return (
    <div className="visor-kpi-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="visor-kpi-label">{title}</p>
          <p className="visor-kpi-value">{value}</p>
          <div className={`flex items-center gap-1 text-sm ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trendUp ? <Icons.TrendingUp className="w-4 h-4" /> : <Icons.TrendingDown className="w-4 h-4" />}
            <span>{trend}</span>
          </div>
        </div>
        <div className={`visor-kpi-icon ${bgColors[color]}`}>
          <div className={iconColors[color]}>
            <Icon />
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## 🔔 Alert Component Template

```jsx
function Alert({ type = 'info', title, message, onClose }) {
  const alertClasses = {
    success: 'visor-alert visor-alert-success',
    warning: 'visor-alert visor-alert-warning',
    error: 'visor-alert visor-alert-error',
    info: 'visor-alert visor-alert-info',
  }

  return (
    <div className={alertClasses[type]}>
      <div className="flex items-start justify-between">
        <div>
          {title && <p className="text-sm font-medium text-gray-900 mb-1">{title}</p>}
          <p className="text-sm text-gray-700">{message}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Icons.X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}
```

---

## 🏷️ Badge Component Template

```jsx
function Badge({ children, variant = 'info' }) {
  const badgeClasses = {
    success: 'visor-badge visor-badge-success',
    warning: 'visor-badge visor-badge-warning',
    error: 'visor-badge visor-badge-error',
    info: 'visor-badge visor-badge-info',
  }

  return (
    <span className={badgeClasses[variant]}>
      {children}
    </span>
  )
}
```

---

## 📈 Chart Container Template

```jsx
function ChartContainer({ title, children }) {
  return (
    <div className="visor-chart-container">
      <h3 className="visor-chart-title">{title}</h3>
      <div className="visor-chart-area">
        {children}
      </div>
    </div>
  )
}
```

---

## 🔍 Search Bar Template

```jsx
function SearchBar({ placeholder = "Search...", onSearch }) {
  return (
    <div className="visor-search-container">
      <div className="visor-search-icon">
        <Icons.Search className="w-5 h-5 text-gray-400" />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        className="visor-search-input"
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  )
}
```

---

## 📱 Dashboard Layout Template

```jsx
function DashboardLayout({ children, sidebarItems, activeItem, onNavigate }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="visor-sidebar">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">VISOR</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.path)}
              className={`visor-sidebar-item ${
                activeItem === item.id
                  ? 'visor-sidebar-item-active'
                  : 'visor-sidebar-item-inactive'
              }`}
            >
              <div className={activeItem === item.id ? 'text-blue-600' : 'text-gray-500'}>
                <item.icon />
              </div>
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="visor-top-nav">
          {/* Header content */}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

---

## ✅ Usage Checklist

When creating new components:

1. ✅ Use CSS classes from `components.css` or match Tailwind classes
2. ✅ Follow spacing guidelines (p-6, mb-5, gap-6)
3. ✅ Use rounded-2xl for cards, rounded-xl for inputs/buttons
4. ✅ Apply shadow-sm for cards, shadow-md on hover
5. ✅ Use blue-600 for primary actions
6. ✅ Match typography (text-sm, font-medium, etc.)
7. ✅ Include hover states with transitions
8. ✅ Ensure responsive design
9. ✅ Test against Admin Dashboard for visual consistency

---

**Remember:** All components should feel like part of the same unified VISOR platform!


