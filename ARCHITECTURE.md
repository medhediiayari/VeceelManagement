# Project Structure & Troubleshooting Guide

This document explains the component-based architecture of the Veceel project for easy troubleshooting and maintenance.

## 📁 Project Structure Overview

```
veceelmg/
├── app/                        # Next.js App Router pages
│   ├── (dashboard)/           # Dashboard route group (shares layout)
│   │   ├── layout.tsx         # Shared dashboard layout with sidebar
│   │   ├── page.tsx           # Dashboard home
│   │   ├── vessels/page.tsx   # Vessels page
│   │   ├── users/page.tsx     # Users page
│   │   ├── roles/page.tsx     # Roles page
│   │   ├── documents/page.tsx # Documents page
│   │   ├── settings/page.tsx  # Settings page
│   │   └── help/page.tsx      # Help page
│   └── layout.tsx             # Root layout
│
├── components/
│   ├── shared/                # 🔧 REUSABLE COMPONENTS
│   │   ├── index.ts           # Export all shared components
│   │   ├── page-wrapper.tsx   # Standard page layout wrapper
│   │   ├── stats-card.tsx     # Stats display cards
│   │   ├── activity-list.tsx  # Activity feed component
│   │   ├── quick-stats-card.tsx # Quick status indicators
│   │   ├── data-table.tsx     # Generic data table with actions
│   │   └── form-dialog.tsx    # Reusable form dialogs
│   │
│   ├── dashboard/             # Dashboard-specific components
│   │   ├── dashboard-content.tsx  # Main dashboard content
│   │   ├── sidebar.tsx        # Navigation sidebar
│   │   ├── header.tsx         # Page header with search
│   │   └── mobile-nav.tsx     # Mobile navigation
│   │
│   ├── vessels/               # Vessel management
│   │   └── vessels-content.tsx
│   │
│   ├── users/                 # User management
│   │   └── users-content.tsx
│   │
│   ├── roles/                 # Role management
│   │   └── roles-content.tsx
│   │
│   ├── documents/             # Document management
│   │   └── documents-content.tsx
│   │
│   ├── settings/              # Settings
│   │   └── settings-content.tsx
│   │
│   ├── help/                  # Help & Support
│   │   └── help-content.tsx
│   │
│   └── ui/                    # Base UI components (shadcn/ui)
│
├── data/                      # 📊 DATA LAYER
│   └── mock-data.ts           # All mock data in one place
│
├── types/                     # 📝 TYPE DEFINITIONS
│   └── index.ts               # All TypeScript interfaces
│
└── lib/                       # Utility functions
    └── utils.ts
```

## 🔍 Troubleshooting Guide

### Issue Categories & Where to Look

#### 1. **Layout Issues** (sidebar, header, navigation)
- **File**: `app/(dashboard)/layout.tsx`
- **Components**: `components/dashboard/sidebar.tsx`, `components/dashboard/header.tsx`

#### 2. **Page Content Issues**
Each page has its own isolated content component:

| Page | Content Component |
|------|-------------------|
| Dashboard | `components/dashboard/dashboard-content.tsx` |
| Vessels | `components/vessels/vessels-content.tsx` |
| Users | `components/users/users-content.tsx` |
| Roles | `components/roles/roles-content.tsx` |
| Documents | `components/documents/documents-content.tsx` |
| Settings | `components/settings/settings-content.tsx` |
| Help | `components/help/help-content.tsx` |

#### 3. **Data Issues** (wrong values, missing data)
- **File**: `data/mock-data.ts`
- Contains all mock data for vessels, users, roles, documents, activities

#### 4. **Type Errors**
- **File**: `types/index.ts`
- All TypeScript interfaces are defined here

#### 5. **Shared Component Issues** (tables, dialogs, cards)
- **Folder**: `components/shared/`
- `data-table.tsx` - Table display issues
- `form-dialog.tsx` - Dialog/modal issues
- `stats-card.tsx` - Stats card issues
- `page-wrapper.tsx` - Page layout wrapper

#### 6. **Base UI Issues** (buttons, inputs, etc.)
- **Folder**: `components/ui/`
- These are shadcn/ui components

## 🛠️ How to Add a New Feature

### Adding a New Page

1. **Create content component**: `components/[feature]/[feature]-content.tsx`
2. **Create page file**: `app/(dashboard)/[feature]/page.tsx`
3. **Add types if needed**: `types/index.ts`
4. **Add mock data if needed**: `data/mock-data.ts`
5. **Update sidebar**: `components/dashboard/sidebar.tsx`

### Adding a New Shared Component

1. Create component in `components/shared/`
2. Export from `components/shared/index.ts`
3. Import using `import { Component } from "@/components/shared"`

## 🧪 Testing Components in Isolation

Each content component can be tested independently:

```tsx
// Test just the vessels content
import { VesselsContent } from "@/components/vessels/vessels-content"

// Render in isolation without the full layout
<VesselsContent />
```

## 📦 Import Patterns

```tsx
// Shared components (preferred)
import { PageWrapper, DataTable, FormDialog } from "@/components/shared"

// Types
import type { Vessel, User, Role, Document } from "@/types"

// Mock data
import { mockVessels, mockUsers, vesselNames } from "@/data/mock-data"

// UI components
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
```

## 🔄 Component Hierarchy

```
RootLayout
└── DashboardLayout (app/(dashboard)/layout.tsx)
    ├── Sidebar
    └── Main Content Area
        └── PageWrapper (shared)
            ├── Header
            └── Page Content (*-content.tsx)
                ├── DataTable (shared)
                ├── FormDialog (shared)
                ├── StatsGrid (shared)
                └── etc.
```

## ⚡ Quick Fixes

### Component not rendering?
1. Check import paths use `@/` alias
2. Verify component is exported from index.ts
3. Check for TypeScript errors in terminal

### Data not showing?
1. Check `data/mock-data.ts` for the data source
2. Verify correct data is passed to components
3. Check console for any errors

### Styles broken?
1. Check Tailwind classes
2. Verify `globals.css` imports
3. Check for conflicting className props

### Dialog not opening?
1. Check state management in content component
2. Verify `open` and `onOpenChange` props are correct
3. Check FormDialog component for issues
