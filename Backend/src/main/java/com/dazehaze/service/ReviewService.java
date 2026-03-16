package com.dazehaze.service;

import com.dazehaze.dto.common.PageResponse;
import com.dazehaze.dto.review.ReviewRequest;
import com.dazehaze.dto.review.ReviewResponse;
import com.dazehaze.dto.review.ReviewStatsResponse;
import com.dazehaze.entity.Order;
import com.dazehaze.entity.Product;
import com.dazehaze.entity.Review;
import com.dazehaze.entity.User;
import com.dazehaze.exception.ResourceNotFoundException;
import com.dazehaze.repository.OrderRepository;
import com.dazehaze.repository.ProductRepository;
import com.dazehaze.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    public PageResponse<ReviewResponse> getProductReviews(Long productId, int page, int size) {
        Page<Review> reviewPage = reviewRepository.findByProductIdAndIsApprovedTrue(
                productId,
                PageRequest.of(page, size, Sort.by("createdAt").descending()));

        List<ReviewResponse> content = reviewPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PageResponse.<ReviewResponse>builder()
                .content(content)
                .page(reviewPage.getNumber())
                .size(reviewPage.getSize())
                .totalElements(reviewPage.getTotalElements())
                .totalPages(reviewPage.getTotalPages())
                .isFirst(reviewPage.isFirst())
                .isLast(reviewPage.isLast())
                .hasNext(reviewPage.hasNext())
                .hasPrevious(reviewPage.hasPrevious())
                .build();
    }

    public ReviewStatsResponse getProductReviewStats(Long productId) {
        Double avgRating = reviewRepository.getAverageRating(productId);
        long totalReviews = reviewRepository.countApprovedByProductId(productId);

        List<Object[]> distributionResult = reviewRepository.getRatingDistribution(productId);
        Map<Integer, Long> distribution = new HashMap<>();

        // Initialize all from 1 to 5 with 0
        for (int i = 1; i <= 5; i++) {
            distribution.put(i, 0L);
        }

        for (Object[] row : distributionResult) {
            Integer rating = (Integer) row[0];
            Long count = (Long) row[1];
            distribution.put(rating, count);
        }

        return ReviewStatsResponse.builder()
                .averageRating(avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0)
                .totalReviews(totalReviews)
                .distribution(distribution)
                .build();
    }

    public boolean canUserReviewProduct(Long productId, Long userId) {
        // Validation 1: Have already reviewed?
        if (reviewRepository.existsByProductIdAndUserId(productId, userId)) {
            return false;
        }

        // Validation 2: Have purchased and received order with this product?
        long count = orderRepository.countPurchasedProductByUser(userId, productId, Order.OrderStatus.DELIVERED);
        return count > 0;
    }

    @Transactional
    public ReviewResponse createReview(Long productId, ReviewRequest request, User user) {
        if (!canUserReviewProduct(productId, user.getId())) {
            throw new IllegalStateException("El usuario no puede agregar una reseña a este producto. " +
                    "Debe haber comprado y recibido el producto, y no haberlo reseñado antes.");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        Review review = Review.builder()
                .product(product)
                .user(user)
                .rating(request.getRating())
                .title(request.getTitle())
                .comment(request.getComment())
                .isVerified(true) // Automatically true because they purchased it
                .isApproved(true) // Set to true immediately so it displays. (can be false if manual approval
                                  // needed)
                .build();

        review = reviewRepository.save(review);
        return mapToResponse(review);
    }

    private ReviewResponse mapToResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .rating(review.getRating())
                .title(review.getTitle())
                .comment(review.getComment())
                .isVerified(review.getIsVerified())
                .authorName(
                        review.getUser().getFirstName() + " " + review.getUser().getLastName().substring(0, 1) + ".")
                .createdAt(review.getCreatedAt())
                .build();
    }
}
