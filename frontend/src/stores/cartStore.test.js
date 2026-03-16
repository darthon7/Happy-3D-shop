import useCartStore from "./cartStore";
import { cartApi } from "../api";

// Mock the cartApi module
jest.mock("../api", () => ({
  cartApi: {
    get: jest.fn(),
    addItem: jest.fn(),
    removeItem: jest.fn(),
    updateItem: jest.fn(),
    applyCoupon: jest.fn(),
    removeCoupon: jest.fn(),
    clear: jest.fn(),
  },
}));

describe("useCartStore", () => {
  beforeEach(() => {
    // Reset the store state before each test
    useCartStore.setState({
      items: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
      coupon: null,
      itemCount: 0,
      isLoading: false,
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  const mockCartData = {
    items: [{ id: 1, quantity: 2, price: 50 }],
    subtotal: 100,
    discount: 0,
    tax: 16,
    total: 116,
    coupon: null,
  };

  it("should have initial empty state", () => {
    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
    expect(state.total).toBe(0);
    expect(state.itemCount).toBe(0);
    expect(state.isLoading).toBe(false);
  });

  it("should fetch cart successfully and calculate itemCount and totals", async () => {
    // Arrange
    cartApi.get.mockResolvedValueOnce({ data: mockCartData });

    // Act
    await useCartStore.getState().fetchCart();

    // Assert
    const state = useCartStore.getState();
    expect(cartApi.get).toHaveBeenCalledTimes(1);
    expect(state.items).toHaveLength(1);
    expect(state.subtotal).toBe(100);
    expect(state.tax).toBe(16);
    expect(state.total).toBe(116);

    // items[0] has quantity 2
    expect(state.itemCount).toBe(2);
    expect(state.isLoading).toBe(false);
  });

  it("should handle fetchCart errors gracefully", async () => {
    // Arrange
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    cartApi.get.mockRejectedValueOnce(new Error("Network error"));

    // Act
    await useCartStore.getState().fetchCart();

    // Assert
    const state = useCartStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.items).toEqual([]); // state unchanged

    consoleSpy.mockRestore();
  });

  it("should add item and then fetch fresh cart", async () => {
    // Arrange
    cartApi.addItem.mockResolvedValueOnce({ success: true });
    // After adding, it fetches the cart
    cartApi.get.mockResolvedValueOnce({ data: mockCartData });

    // Act
    await useCartStore.getState().addItem(123, 2);

    // Assert
    expect(cartApi.addItem).toHaveBeenCalledWith(123, 2);
    expect(cartApi.get).toHaveBeenCalledTimes(1);
    const state = useCartStore.getState();
    expect(state.itemCount).toBe(2);
  });

  it("should update item quantity and fetch fresh cart", async () => {
    // Arrange
    cartApi.updateItem.mockResolvedValueOnce({ success: true });
    cartApi.get.mockResolvedValueOnce({ data: mockCartData });

    // Act
    await useCartStore.getState().updateItem(1, 5);

    // Assert
    expect(cartApi.updateItem).toHaveBeenCalledWith(1, 5);
    expect(cartApi.get).toHaveBeenCalledTimes(1);
  });

  it("should remove item and fetch fresh cart", async () => {
    // Arrange
    cartApi.removeItem.mockResolvedValueOnce({ success: true });
    cartApi.get.mockResolvedValueOnce({ data: { ...mockCartData, items: [] } });

    // Act
    await useCartStore.getState().removeItem(1);

    // Assert
    expect(cartApi.removeItem).toHaveBeenCalledWith(1);
    expect(cartApi.get).toHaveBeenCalledTimes(1);
  });

  it("should apply coupon successfully", async () => {
    // Arrange
    const discountData = {
      ...mockCartData,
      discount: 20,
      total: 96, // 100 - 20 = 80 + 16(tax) = 96
      coupon: { code: "WELCOME20", discountPercentage: 20 },
    };

    cartApi.applyCoupon.mockResolvedValueOnce({ success: true });
    cartApi.get.mockResolvedValueOnce({ data: discountData });

    // Act
    const result = await useCartStore.getState().applyCoupon("WELCOME20");

    // Assert
    expect(result.success).toBe(true);
    expect(cartApi.applyCoupon).toHaveBeenCalledWith("WELCOME20");
    expect(cartApi.get).toHaveBeenCalledTimes(1);

    const state = useCartStore.getState();
    expect(state.discount).toBe(20);
    expect(state.coupon.code).toBe("WELCOME20");
  });

  it("should handle failed coupon application", async () => {
    // Arrange
    const errorResponse = {
      response: { data: { message: "Invalid coupon code" } },
    };
    cartApi.applyCoupon.mockRejectedValueOnce(errorResponse);

    // Act
    const result = await useCartStore.getState().applyCoupon("FAKE");

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid coupon code");
    expect(useCartStore.getState().isLoading).toBe(false);
    expect(cartApi.get).not.toHaveBeenCalled();
  });

  it("should remove coupon successfully", async () => {
    // Arrange
    cartApi.removeCoupon.mockResolvedValueOnce({ success: true });
    cartApi.get.mockResolvedValueOnce({ data: mockCartData });

    // Act
    await useCartStore.getState().removeCoupon();

    // Assert
    expect(cartApi.removeCoupon).toHaveBeenCalledTimes(1);
    expect(cartApi.get).toHaveBeenCalledTimes(1);
  });

  it("should clear cart successfully", async () => {
    // Arrange
    useCartStore.setState({
      items: [{ id: 1, quantity: 2, price: 50 }],
      total: 100,
      itemCount: 2,
    });

    cartApi.clear.mockResolvedValueOnce({ data: { success: true } });

    // Act
    await useCartStore.getState().clearCart();

    // Assert
    const state = useCartStore.getState();
    expect(cartApi.clear).toHaveBeenCalledTimes(1);
    expect(state.items).toEqual([]);
    expect(state.total).toBe(0);
    expect(state.itemCount).toBe(0);
  });
});
