package com.dazehaze.controller;

import com.dazehaze.dto.user.WishlistResponse;
import com.dazehaze.entity.User;
import com.dazehaze.repository.UserRepository;
import com.dazehaze.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<WishlistResponse> getWishlist(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(wishlistService.getWishlist(userId));
    }

    @PostMapping("/products/{productId}")
    public ResponseEntity<WishlistResponse> addToWishlist(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long productId) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(wishlistService.addToWishlist(userId, productId));
    }

    @DeleteMapping("/products/{productId}")
    public ResponseEntity<WishlistResponse> removeFromWishlist(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long productId) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(wishlistService.removeFromWishlist(userId, productId));
    }

    @GetMapping("/products/{productId}/check")
    public ResponseEntity<Boolean> isInWishlist(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long productId) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(wishlistService.isInWishlist(userId, productId));
    }

    @DeleteMapping
    public ResponseEntity<Void> clearWishlist(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        wishlistService.clearWishlist(userId);
        return ResponseEntity.noContent().build();
    }

    private Long getUserId(UserDetails userDetails) {
        if (userDetails == null) {
            throw new RuntimeException("User not authenticated");
        }
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }
}
