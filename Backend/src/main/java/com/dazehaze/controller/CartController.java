package com.dazehaze.controller;

import com.dazehaze.dto.cart.AddToCartRequest;
import com.dazehaze.dto.cart.ApplyCouponRequest;
import com.dazehaze.dto.cart.CartResponse;
import com.dazehaze.dto.cart.UpdateCartItemRequest;
import com.dazehaze.service.CartService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private final com.dazehaze.repository.UserRepository userRepository;

    @GetMapping
    public ResponseEntity<CartResponse> getCart(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request) {
        Long userId = getUserId(userDetails);
        String sessionId = getOrCreateSessionId(request);
        return ResponseEntity.ok(cartService.getCart(userId, sessionId));
    }

    @PostMapping("/items")
    public ResponseEntity<CartResponse> addToCart(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request,
            @Valid @RequestBody AddToCartRequest addRequest) {
        Long userId = getUserId(userDetails);
        String sessionId = getOrCreateSessionId(request);
        return ResponseEntity.ok(cartService.addToCart(userId, sessionId, addRequest));
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<CartResponse> updateCartItem(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request,
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateCartItemRequest updateRequest) {
        Long userId = getUserId(userDetails);
        String sessionId = getOrCreateSessionId(request);
        return ResponseEntity.ok(cartService.updateCartItem(userId, sessionId, itemId, updateRequest));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<CartResponse> removeFromCart(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request,
            @PathVariable Long itemId) {
        Long userId = getUserId(userDetails);
        String sessionId = getOrCreateSessionId(request);
        return ResponseEntity.ok(cartService.removeFromCart(userId, sessionId, itemId));
    }

    @PostMapping("/coupon")
    public ResponseEntity<CartResponse> applyCoupon(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request,
            @Valid @RequestBody ApplyCouponRequest couponRequest) {
        Long userId = getUserId(userDetails);
        String sessionId = getOrCreateSessionId(request);
        return ResponseEntity.ok(cartService.applyCoupon(userId, sessionId, couponRequest.getCode()));
    }

    @DeleteMapping("/coupon")
    public ResponseEntity<CartResponse> removeCoupon(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request) {
        Long userId = getUserId(userDetails);
        String sessionId = getOrCreateSessionId(request);
        return ResponseEntity.ok(cartService.removeCoupon(userId, sessionId));
    }

    @DeleteMapping
    public ResponseEntity<Void> clearCart(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request) {
        Long userId = getUserId(userDetails);
        String sessionId = getOrCreateSessionId(request);
        cartService.clearCart(userId, sessionId);
        return ResponseEntity.noContent().build();
    }

    // Helper methods
    private Long getUserId(UserDetails userDetails) {
        if (userDetails == null)
            return null;
        return userRepository.findByEmail(userDetails.getUsername())
                .map(com.dazehaze.entity.User::getId)
                .orElse(null);
    }

    private String getOrCreateSessionId(HttpServletRequest request) {
        String sessionId = request.getHeader("X-Session-Id");
        if (sessionId == null || sessionId.isEmpty()
                || !sessionId
                        .matches("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")) {
            sessionId = UUID.randomUUID().toString();
        }
        return sessionId;
    }
}
