import { renderHook } from "@testing-library/react";
import { useCatalogRoute } from "./useCatalogRoute";

// Declaramos el mock de la librería
jest.mock("react-router-dom", () => ({
  useLocation: jest.fn(),
}));

// Importamos useLocation mockeado para poder cambiar su valor en los tests
import { useLocation } from "react-router-dom";

describe("useCatalogRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return true for /catalogo", () => {
    useLocation.mockReturnValue({ pathname: "/catalogo" });
    const { result } = renderHook(() => useCatalogRoute());
    expect(result.current).toBe(true);
  });

  it("should return true for subroutes like /catalogo/hombres", () => {
    useLocation.mockReturnValue({ pathname: "/catalogo/hombres" });
    const { result } = renderHook(() => useCatalogRoute());
    expect(result.current).toBe(true);
  });

  it("should return true for /categoria paths", () => {
    useLocation.mockReturnValue({ pathname: "/categoria/chamarras" });
    const { result } = renderHook(() => useCatalogRoute());
    expect(result.current).toBe(true);
  });

  it("should return false for unrelated routes like /carrito", () => {
    useLocation.mockReturnValue({ pathname: "/carrito" });
    const { result } = renderHook(() => useCatalogRoute());
    expect(result.current).toBe(false);
  });

  it("should return false for root /", () => {
    useLocation.mockReturnValue({ pathname: "/" });
    const { result } = renderHook(() => useCatalogRoute());
    expect(result.current).toBe(false);
  });
});
