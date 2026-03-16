# AGENTS.md - DazeHaze Frontend Development Guide

This document provides guidance for AI agents working on the DazeHaze frontend codebase.

## Project Overview

- **Framework**: React 19 with Vite
- **Language**: JavaScript (JSX) - no TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand with persist middleware
- **Testing**: Jest with @testing-library
- **Linting**: ESLint flat config
- **Build**: Vite

## Commands

### Development
```bash
cd DazeHaze-Frontend
npm run dev        # Start development server
```

### Building
```bash
npm run build      # Production build
npm run preview   # Preview production build
```

### Linting
```bash
npm run lint       # Run ESLint on all files
```

### Testing
```bash
npm run test              # Run all tests once
npm run test:watch       # Run tests in watch mode

# Run a single test file
npm test -- authStore.test.js

# Run tests matching a pattern
npm test -- --testPathPattern="useAuth"

# Run tests with coverage
npm test -- --coverage
```

## Code Style Guidelines

### File Organization
- Components: `src/components/{category}/{ComponentName}.jsx`
- Pages: `src/pages/{PageName}.jsx` or `src/pages/{category}/{PageName}.jsx`
- Hooks: `src/hooks/use{FeatureName}.js`
- Stores: `src/stores/{storeName}Store.js`
- API: `src/api/{apiName}.js`
- Utils: `src/lib/utils.js`

### Naming Conventions
- **Components**: PascalCase (e.g., `ProductCard.jsx`, `OrderTrackingBar.jsx`)
- **Hooks**: camelCase starting with `use` (e.g., `useInactivityTimeout.js`, `useCatalogRoute.js`)
- **Stores**: camelCase ending with `Store` (e.g., `authStore.js`, `cartStore.js`)
- **Files**: kebab-case (e.g., `use-is-mobile.test.js`)
- **CSS Classes**: Tailwind utility classes preferred

### Imports

**Order (grouped)**:
1. React/framework imports
2. External libraries
3. Internal components
4. Internal hooks/stores
5. Internal utilities
6. Styles/assets

```jsx
import { useState, useEffect, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';
import Button from '../ui/Button';
import useAuthStore from '../../stores/authStore';
import { formatPrice } from '../../lib/formatters';
```

**Path conventions**:
- Relative paths for local imports (use `../../` pattern)
- No file extensions in imports (React resolves automatically)

### Components

**Component Structure**:
```jsx
import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'base classes here',
  {
    variants: {
      variant: { primary: '...', secondary: '...' },
      size: { sm: '...', md: '...', lg: '...' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

const ComponentName = forwardRef(({ prop1, prop2, className, ...props }, ref) => {
  return (
    <element ref={ref} className={cn(componentVariants({ prop1, prop2, className }))} {...props}>
      {children}
    </element>
  );
});

ComponentName.displayName = 'ComponentName';

export { ComponentName, componentVariants };
```

**Use CVA (class-variance-authority)** for component variants - see `Button.jsx` as reference.

### State Management (Zustand)

```javascript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStoreName = create(
  persist(
    (set, get) => ({
      state: 'initial',
      
      action: async (param) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiCall(param);
          set({ state: response.data, isLoading: false });
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Default error message';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },
    }),
    {
      name: 'store-storage-key',
      partialize: (state) => ({ /* fields to persist */ }),
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
- Log technical errors to console for debugging

```javascript
try {
  const response = await apiCall();
  return { success: true, data: response.data };
} catch (error) {
  const message = error.response?.data?.message || 'Error unexpected';
  return { success: false, error: message };
}
```

### API Layer

- Use axios instance from `src/api/axios.js` (includes auth interceptors)
- Create API modules in `src/api/` (e.g., `authApi.js`, `productApi.js`)
- Export using named exports: `export const authApi = { login, register, logout }`
- The axios instance handles token refresh automatically

### Testing

**Test file naming**: `{name}.test.js` or `{name}.test.jsx`

**Store tests** (reference: `authStore.test.js`):
```javascript
import useAuthStore from './authStore';
import { authApi } from '../api';

jest.mock('../api', () => ({
  authApi: { login: jest.fn(), logout: jest.fn() },
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ /* initial state */ });
    jest.clearAllMocks();
  });

  it('should handle action', async () => {
    authApi.login.mockResolvedValueOnce({ data: { /* mock response */ } });
    const result = await useAuthStore.getState().login('email', 'pass');
    expect(result.success).toBe(true);
  });
});
```

### UI Components

- Use existing UI components from `src/components/ui/`
- Components support variants via CVA: `variant="primary|secondary|outline|ghost|destructive|glass|link"`
- Sizes: `sm`, `md`, `lg`, `xl`, `icon`, `icon-sm`, `icon-lg`
- Use `cn()` from `src/lib/utils` for conditional classes

### Tailwind CSS

- Use Tailwind v4 syntax (no config needed, uses CSS-first approach)
- Custom colors defined in `index.css` (search for `--color-`)
- Common colors: `primary`, `surface`, `background`, `border`
- Use arbitrary values sparingly: `hover:bg-white/10`

### Accessibility

- Always include `aria-label` for icon-only buttons
- Use semantic HTML (`<button>`, `<input>`, `<label>`)
- Focus states: `focus-visible:ring-2 focus-visible:ring-primary`
- Use `disabled` and `aria-disabled` appropriately

## Directory Structure

```
DazeHaze-Frontend/
├── src/
│   ├── api/           # API layer (axios, api modules)
│   ├── assets/        # Static assets (images, fonts)
│   ├── components/    # React components
│   │   ├── common/    # Shared components (ProtectedRoute, ScrollToTop)
│   │   ├── layout/    # Layout components (Navbar, Footer, Layout)
│   │   ├── order/     # Order-related components
│   │   ├── payment/   # Payment components
│   │   ├── product/   # Product components
│   │   └── ui/        # Base UI components (Button, Input, Card)
│   ├── data/          # Static data (constants, mock data)
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utilities (utils.js, formatters)
│   ├── pages/         # Page components
│   │   ├── admin/    # Admin pages
│   │   ├── auth/     # Authentication pages
│   │   └── user/     # User pages
│   └── stores/        # Zustand stores
├── eslint.config.js   # ESLint flat config
├── jest.config.js     # Jest configuration
├── vite.config.js     # Vite configuration
└── tailwind.config.js # Tailwind configuration
```

## Common Patterns

### Protected Routes
Use the `ProtectedRoute` component to wrap protected pages:
```jsx
<Route element={<ProtectedRoute />}>
  <Route path="checkout" element={<Checkout />} />
</Route>
```

### Form Handling
Use `react-hook-form` for complex forms:
```jsx
import { useForm } from 'react-hook-form';
const { register, handleSubmit, formState: { errors } } = useForm();
```

### Toast Notifications
Use `react-hot-toast` for user feedback:
```jsx
import toast from 'react-hot-toast';
toast.success('Operación exitosa');
toast.error('Error al procesar');
```

## Running Single Tests

To run a specific test file:
```bash
npm test -- src/stores/authStore.test.js
```

To run tests matching a name:
```bash
npm test -- -t "should handle successful login"
```

To run in watch mode for a specific file:
```bash
npm test -- src/stores/authStore.test.js --watch
```
