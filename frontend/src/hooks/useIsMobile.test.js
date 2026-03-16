import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "./useIsMobile";

describe("useIsMobile", () => {
  // Store original window size
  const originalInnerWidth = window.innerWidth;

  afterEach(() => {
    // Restore window size after each test
    window.innerWidth = originalInnerWidth;
  });

  const triggerResize = (width) => {
    window.innerWidth = width;
    window.dispatchEvent(new Event("resize"));
  };

  it("should return true when innerWidth is below breakpoint", () => {
    window.innerWidth = 500;
    const { result } = renderHook(() => useIsMobile(768));

    expect(result.current).toBe(true);
  });

  it("should return false when innerWidth is above breakpoint", () => {
    window.innerWidth = 1024;
    const { result } = renderHook(() => useIsMobile(768));

    expect(result.current).toBe(false);
  });

  it("should update value dynamically on window resize", () => {
    // Start desktop
    window.innerWidth = 1024;
    const { result } = renderHook(() => useIsMobile(768));
    expect(result.current).toBe(false);

    // Resize to mobile
    act(() => {
      triggerResize(500);
    });
    expect(result.current).toBe(true);

    // Resize back to desktop
    act(() => {
      triggerResize(1024);
    });
    expect(result.current).toBe(false);
  });

  it("should use default breakpoint (768) if not provided", () => {
    window.innerWidth = 767;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);

    act(() => {
      triggerResize(769);
    });
    expect(result.current).toBe(false);
  });
});
