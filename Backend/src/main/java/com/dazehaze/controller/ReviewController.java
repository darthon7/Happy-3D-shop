package com.dazehaze.controller;

import com.dazehaze.dto.common.PageResponse;
import com.dazehaze.dto.review.ReviewRequest;
import com.dazehaze.dto.review.ReviewResponse;
import com.dazehaze.dto.review.ReviewStatsResponse;
import com.dazehaze.entity.User;
import com.dazehaze.repository.UserRepository;
import com.dazehaze.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final UserRepository userRepository;

    @GetMapping("/product/{productId}")
    public ResponseEntity<PageResponse<ReviewResponse>> getProductReviews(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reviewService.getProductReviews(productId, page, size));
    }

    @GetMapping("/product/{productId}/stats")
    public ResponseEntity<ReviewStatsResponse> getProductReviewStats(@PathVariable Long productId) {
        return ResponseEntity.ok(reviewService.getProductReviewStats(productId));
    }

    @GetMapping("/product/{productId}/can-review")
    public ResponseEntity<Map<String, Boolean>> canUserReview(
            @PathVariable Long productId,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            Map<String, Boolean> response = new HashMap<>();
            response.put("canReview", false);
            return ResponseEntity.ok(response);
        }
        User user = getUser(userDetails);
        boolean canReview = reviewService.canUserReviewProduct(productId, user.getId());

        Map<String, Boolean> response = new HashMap<>();
        response.put("canReview", canReview);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/product/{productId}")
    public ResponseEntity<ReviewResponse> createReview(
            @PathVariable Long productId,
            @Valid @RequestBody ReviewRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        ReviewResponse response = reviewService.createReview(productId, request, user);
        return ResponseEntity.ok(response);
    }

    private User getUser(UserDetails userDetails) {
        if (userDetails == null) {
            throw new RuntimeException("User not authenticated");
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
