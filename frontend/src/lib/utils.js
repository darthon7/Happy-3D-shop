import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge for conflict resolution
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Token utilities
 */
const SAFETY_MARGIN = 2 * 60 * 1000;

export const getTokenExpiry = (token) => {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token) => {
  if (!token) return true;
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;
  return Date.now() >= expiry;
};

export const getTimeUntilExpiry = (token) => {
  const expiry = getTokenExpiry(token);
  if (!expiry) return 0;
  return Math.max(0, expiry - Date.now());
};

export const getInactivityTimeout = () => {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;
  
  const timeUntilExpiry = getTimeUntilExpiry(token);
  if (timeUntilExpiry <= 0) return null;
  
  const timeout = timeUntilExpiry - SAFETY_MARGIN;
  return timeout > 0 ? timeout : timeUntilExpiry;
};

export const WARNING_TIME = 2 * 60 * 1000;

/**
 * Focus ring utility for consistent focus states
 */
export const focusRing = cn(
  "focus-visible:outline-none focus-visible:ring-2",
  "focus-visible:ring-primary focus-visible:ring-offset-2",
  "focus-visible:ring-offset-background-dark",
);

/**
 * Disabled state utility
 */
export const disabledStyles =
  "disabled:pointer-events-none disabled:opacity-50";
