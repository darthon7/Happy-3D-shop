package com.dazehaze.dto.gallery;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GalleryImageResponse {
    private Long id;
    private String url;
    private String title;
    private String description;
    private String altText;
    private Integer sortOrder;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
