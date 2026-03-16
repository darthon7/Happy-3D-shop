package com.dazehaze.service;

import com.dazehaze.dto.cart.AddToCartRequest;
import com.dazehaze.dto.cart.CartResponse;
import com.dazehaze.dto.cart.UpdateCartItemRequest;
import com.dazehaze.entity.*;
import com.dazehaze.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CouponRepository couponRepository;
    private final ProductImageRepository productImageRepository;

    @Transactional(readOnly = true)
    public CartResponse getCart(Long userId, String sessionId) {
        Cart cart = getOrCreateCart(userId, sessionId);
        return mapToCartResponse(cart);
    }

    @Transactional
    public CartResponse addToCart(Long userId, String sessionId, AddToCartRequest request) {
        Cart cart = getOrCreateCart(userId, sessionId);
        ProductVariant variant = productVariantRepository.findById(request.getVariantId())
                .orElseThrow(() -> new RuntimeException("Product variant not found"));

        // Check stock
        if (variant.getStock() < request.getQuantity()) {
            throw new RuntimeException("Not enough stock available. Available: " + variant.getStock());
        }

        // Check if item already exists in cart
        CartItem existingItem = cartItemRepository.findByCartIdAndProductVariantId(cart.getId(), variant.getId())
                .orElse(null);

        if (existingItem != null) {
            int newQuantity = existingItem.getQuantity() + request.getQuantity();
            if (variant.getStock() < newQuantity) {
                throw new RuntimeException("Not enough stock. Available: " + variant.getStock());
            }
            existingItem.setQuantity(newQuantity);
            cartItemRepository.save(existingItem);
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .productVariant(variant)
                    .quantity(request.getQuantity())
                    .build();
            cart.getItems().add(newItem);
            cartItemRepository.save(newItem);
        }

        return mapToCartResponse(cart);
    }

    @Transactional
    public CartResponse updateCartItem(Long userId, String sessionId, Long itemId, UpdateCartItemRequest request) {
        Cart cart = getOrCreateCart(userId, sessionId);
        CartItem item = cart.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Cart item not found"));

        // Check stock
        if (item.getProductVariant().getStock() < request.getQuantity()) {
            throw new RuntimeException("Not enough stock. Available: " + item.getProductVariant().getStock());
        }

        item.setQuantity(request.getQuantity());
        cartItemRepository.save(item);

        return mapToCartResponse(cart);
    }

    @Transactional
    public CartResponse removeFromCart(Long userId, String sessionId, Long itemId) {
        Cart cart = getOrCreateCart(userId, sessionId);
        CartItem item = cart.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Cart item not found"));

        cart.getItems().remove(item);
        cartItemRepository.delete(item);

        return mapToCartResponse(cart);
    }

    @Transactional
    public CartResponse applyCoupon(Long userId, String sessionId, String couponCode) {
        Cart cart = getOrCreateCart(userId, sessionId);
        Coupon coupon = couponRepository.findByCodeAndIsActiveTrue(couponCode)
                .orElseThrow(() -> new RuntimeException("Invalid coupon code"));

        if (!coupon.isApplicable(cart.getSubtotal())) {
            throw new RuntimeException("Coupon cannot be applied. Minimum purchase: " + coupon.getMinPurchase());
        }

        cart.setAppliedCoupon(coupon);
        cartRepository.save(cart);

        return mapToCartResponse(cart);
    }

    @Transactional
    public CartResponse removeCoupon(Long userId, String sessionId) {
        Cart cart = getOrCreateCart(userId, sessionId);
        cart.setAppliedCoupon(null);
        cartRepository.save(cart);
        return mapToCartResponse(cart);
    }

    @Transactional
    public void clearCart(Long userId, String sessionId) {
        Cart cart = getOrCreateCart(userId, sessionId);
        cart.getItems().clear();
        cart.setAppliedCoupon(null);
        cartRepository.save(cart);
    }

    @Transactional
    public void mergeGuestCartToUser(String sessionId, Long userId) {
        Cart guestCart = cartRepository.findBySessionId(sessionId).orElse(null);
        if (guestCart == null)
            return;

        Cart userCart = cartRepository.findByUserId(userId).orElse(null);

        if (userCart == null) {
            // Transfer guest cart to user
            guestCart.setSessionId(null);
            guestCart.setUser(User.builder().id(userId).build());
            cartRepository.save(guestCart);
        } else {
            // Merge items
            for (CartItem guestItem : guestCart.getItems()) {
                CartItem existingItem = userCart.getItems().stream()
                        .filter(i -> i.getProductVariant().getId().equals(guestItem.getProductVariant().getId()))
                        .findFirst()
                        .orElse(null);

                if (existingItem != null) {
                    existingItem.setQuantity(existingItem.getQuantity() + guestItem.getQuantity());
                } else {
                    CartItem newItem = CartItem.builder()
                            .cart(userCart)
                            .productVariant(guestItem.getProductVariant())
                            .quantity(guestItem.getQuantity())
                            .build();
                    userCart.getItems().add(newItem);
                }
            }
            cartRepository.save(userCart);
            cartRepository.delete(guestCart);
        }
    }

    @Transactional
    public Cart getCartEntity(Long userId, String sessionId) {
        Cart cart = getOrCreateCart(userId, sessionId);
        cart.getItems().size(); // Initialize lazy collection
        return cart;
    }

    // Helper methods
    public Cart getOrCreateCart(Long userId, String sessionId) {
        if (userId != null) {
            return cartRepository.findByUserId(userId)
                    .orElseGet(() -> cartRepository.save(Cart.builder()
                            .user(User.builder().id(userId).build())
                            .build()));
        } else {
            return cartRepository.findBySessionId(sessionId)
                    .orElseGet(() -> cartRepository.save(Cart.builder()
                            .sessionId(sessionId)
                            .build()));
        }
    }

    private CartResponse mapToCartResponse(Cart cart) {
        var items = cart.getItems().stream()
                .map(this::mapToCartItemResponse)
                .collect(Collectors.toList());

        CartResponse.CouponInfo couponInfo = null;
        if (cart.getAppliedCoupon() != null) {
            couponInfo = CartResponse.CouponInfo.builder()
                    .code(cart.getAppliedCoupon().getCode())
                    .description(cart.getAppliedCoupon().getDescription())
                    .discountAmount(cart.getDiscount())
                    .build();
        }

        return CartResponse.builder()
                .id(cart.getId())
                .items(items)
                .totalItems(cart.getTotalItems())
                .subtotal(cart.getSubtotal())
                .discount(cart.getDiscount())
                .tax(cart.getTax())
                .total(cart.getTotal())
                .appliedCoupon(couponInfo)
                .build();
    }

    private CartResponse.CartItemResponse mapToCartItemResponse(CartItem item) {
        ProductVariant variant = item.getProductVariant();
        Product product = variant.getProduct();

        // Try to get main image first, then fallback to first available image
        String imageUrl = productImageRepository.findByProductIdAndIsMainTrue(product.getId())
                .map(ProductImage::getUrl)
                .orElseGet(() -> {
                    // Fallback: get first image from product's images
                    if (product.getImages() != null && !product.getImages().isEmpty()) {
                        return product.getImages().get(0).getUrl();
                    }
                    return null;
                });

        return CartResponse.CartItemResponse.builder()
                .id(item.getId())
                .variantId(variant.getId())
                .productName(product.getName())
                .productSlug(product.getSlug())
                .sku(variant.getSku())
                .size(variant.getSize())
                .color(variant.getColor())
                .imageUrl(imageUrl)
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .totalPrice(item.getTotalPrice())
                .availableStock(variant.getStock())
                .build();
    }
}
