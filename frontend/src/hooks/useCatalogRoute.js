import { useLocation } from "react-router-dom";

/**
 * Returns true when the current route is a catalog or category page.
 * Used by the mobile nav components to hide themselves.
 */
export const useCatalogRoute = () => {
  const { pathname } = useLocation();
  return pathname.startsWith("/catalogo") || pathname.startsWith("/categoria");
};
