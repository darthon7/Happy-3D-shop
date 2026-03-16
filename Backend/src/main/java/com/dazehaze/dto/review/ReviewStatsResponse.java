package com.dazehaze.dto.review;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewStatsResponse {
    private Double averageRating;
    private Long totalReviews;
    private Map<Integer, Long> distribution; // e.g. 5 -> 10, 4 -> 5, etc.
}
