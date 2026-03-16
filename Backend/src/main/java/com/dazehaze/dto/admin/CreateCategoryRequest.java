package com.dazehaze.dto.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCategoryRequest {

    @NotBlank(message = "Category name is required")
    private String name;

    private String description;

    @NotBlank(message = "Slug is required")
    private String slug;

    private String imageUrl;
    private Long parentId;
    private Integer sortOrder = 0;
    private Boolean isActive = true;
}
