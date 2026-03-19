# AGENTS.md - DazeHaze Frontend Development Guide

This document provides guidance for AI agents working on the DazeHaze frontend codebase.

## Project Overview

- **Framework**: React 19 with Vite 7
- **Language**: JavaScript (JSX) - no TypeScript
- **Styling**: Tailwind CSS v4 (CSS-first approach with @theme)
- **State Management**: Zustand with persist middleware
- **Testing**: Jest 30 with @testing-library
- **Linting**: ESLint 9 flat config
- **Build**: Vite

## Commands

### Development
```bash
cd frontend
npm run dev        # Start development server
```

### Building
```bash
npm run build      # Production build
npm run preview    # Preview production build
```

### Linting
```bash
npm run lint       # Run ESLint on all files
```

### Testing
```bash
npm test                    # Run all tests once
npm run test:watch          # Run tests in watch mode

# Run a single test file
npm test -- src/stores/authStore.test.js

# Run tests matching a pattern
npm test -- --testPathPattern="useAuth"

# Run tests with coverage
npm test -- --coverage

# Run tests by name
npm test -- -t "should handle successful login"
```

## Code Style

### File Organization
- Components: `src/components/{category}/{ComponentName}.jsx`
- Pages: `src/pages/{PageName}.jsx` or `src/pages/{category}/{PageName}.jsx`
- Hooks: `src/hooks/use{FeatureName}.js`
- Stores: `src/stores/{storeName}Store.js`
- API: `src/api/index.js` (named exports per domain)
- Utils: `src/lib/utils.js`, `src/utils/`

### Naming Conventions
- **Components**: PascalCase (e.g., `ProductCard.jsx`, `Button.jsx`)
- **Hooks**: camelCase starting with `use` (e.g., `useIsMobile.js`)
- **Stores**: camelCase ending with `Store` (e.g., `authStore.js`)
- **Test files**: Match source name with `.test.js` suffix (e.g., `useIsMobile.test.js`)
- **CSS Classes**: Tailwind utility classes preferred

### Quotes
Use **double quotes** for strings (verify with ESLint config)

### Imports (ordered)
1. React/framework imports
2. External libraries (axios, zustand, etc.)
3. Internal components
4. Internal hooks/stores
5. Internal utilities
6. Styles/assets

```jsx
import { useState, useEffect, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";
import Button from "../ui/Button";
import useAuthStore from "../../stores/authStore";
import { formatPrice } from "../../lib/formatters";
```

### Components

Use `forwardRef` and CVA for component variants:
```jsx
import { forwardRef } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "base classes here",
  {
    variants: {
      variant: { primary: "...", secondary: "..." },
      size: { sm: "...", md: "...", lg: "..." },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

const ComponentName = forwardRef(({ prop1, className, ...props }, ref) => {
  return (
    <element ref={ref} className={cn(buttonVariants({ prop1, className }))} {...props}>
      {children}
    </element>
  );
});

ComponentName.displayName = "ComponentName";

export { ComponentName, buttonVariants };
```

Reference: `src/components/ui/Button.jsx` for CVA patterns.

### State Management (Zustand)

```javascript
import { create } from "zustand";
import { persist } from "zustand/middleware";

const useStoreName = create(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,

      action: async (param) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiCall(param);
          set({ user: response.data, isLoading: false });
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || "Error message";
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },
    }),
    {
      name: "store-storage-key",
      partialize: (state) => ({ user: state.user }),
    }
  )
);

export default useStoreName;
```

### Error Handling
- Always use try/catch for async operations
- Return `{ success: boolean, error?: string }` from store actions
- Extract error messages from `error.response?.data?.message` with fallback
- Use user-friendly Spanish messages for user-facing errors

### API Layer
- Use axios instance from `src/api/axios.js` (includes auth interceptors)
- Export using named exports: `export const authApi = { login, register, logout }`
- The axios instance handles token refresh automatically via interceptors

### Testing

```javascript
import useAuthStore from "./authStore";
import { authApi } from "../api";

jest.mock("../api", () => ({
  authApi: { login: jest.fn(), logout: jest.fn() },
}));

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isLoading: false, error: null });
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("should handle action", async () => {
    authApi.login.mockResolvedValueOnce({ data: { /* response */ } });
    const result = await useAuthStore.getState().login("email", "pass");
    expect(result.success).toBe(true);
  });
});
```

### Tailwind CSS v4
- Uses CSS-first approach with `@theme` directive (no tailwind.config.js)
- Custom colors defined in `src/index.css` with `--color-*` variables
- Common colors: `primary`, `surface`, `background`, `border`
- Use `@layer base` for base styles

### Accessibility
- Always include `aria-label` for icon-only buttons
- Use semantic HTML (`<button>`, `<input>`, `<label>`)
- Focus states: `focus-visible:ring-2 focus-visible:ring-primary`

## Directory Structure

```
frontend/
├── src/
│   ├── api/           # API layer (axios.js, index.js with named exports)
│   ├── assets/        # Static assets
│   ├── components/
│   │   ├── 3d/        # Three.js components
│   │   ├── auth/      # Auth-related components
│   │   ├── common/    # ProtectedRoute, ScrollToTop, Animations
│   │   ├── layout/    # Navbar, Footer, Layout
│   │   ├── order/     # Order components
│   │   ├── payment/   # Payment components
│   │   ├── product/   # Product components
│   │   ├── reviews/   # Review components
│   │   └── ui/        # Button, Input, Card, Badge, etc.
│   ├── data/          # Static data
│   ├── hooks/         # useIsMobile, useCatalogRoute, etc.
│   ├── lib/           # utils.js, formatters
│   ├── pages/
│   │   ├── admin/     # Admin pages
│   │   ├── auth/      # Login, Register
│   │   └── user/      # User pages
│   ├── stores/         # Zustand stores
│   └── utils/         # Additional utilities
├── eslint.config.js   # ESLint flat config
├── jest.config.js     # Jest configuration
├── vite.config.js     # Vite configuration
└── tailwind.config.js # Tailwind config (mostly @theme in CSS)
```

## Common Patterns

### Protected Routes
```jsx
<Route element={<ProtectedRoute />}>
  <Route path="checkout" element={<Checkout />} />
</Route>
```

### Form Handling
Use `react-hook-form` for forms:
```jsx
import { useForm } from "react-hook-form";
const { register, handleSubmit, formState: { errors } } = useForm();
```

### Toast Notifications
Use `react-hot-toast` for user feedback:
```jsx
import toast from "react-hot-toast";
toast.success("Operación exitosa");
toast.error("Error al procesar");
```
