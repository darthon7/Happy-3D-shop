package com.dazehaze.dto.gallery;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GalleryImageRequest {
    private String title;
    private String description;
    private String altText;
    private Integer sortOrder;
    private Boolean isActive;
}
