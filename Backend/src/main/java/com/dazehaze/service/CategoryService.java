package com.dazehaze.service;

import com.dazehaze.dto.category.CategoryResponse;
import com.dazehaze.entity.Category;
import com.dazehaze.repository.CategoryRepository;
import com.dazehaze.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public List<CategoryResponse> getAllCategories() {
        List<Category> rootCategories = categoryRepository.findByParentIsNullAndIsActiveTrue();
        return rootCategories.stream()
                .map(this::mapToCategoryResponse)
                .collect(Collectors.toList());
    }

    public CategoryResponse getCategoryBySlug(String slug) {
        Category category = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Category not found: " + slug));
        return mapToCategoryResponse(category);
    }

    public List<CategoryResponse> getSubcategories(String parentSlug) {
        Category parent = categoryRepository.findBySlug(parentSlug)
                .orElseThrow(() -> new RuntimeException("Category not found: " + parentSlug));

        return categoryRepository.findByParentIdAndIsActiveTrue(parent.getId()).stream()
                .map(this::mapToCategoryResponse)
                .collect(Collectors.toList());
    }

    private CategoryResponse mapToCategoryResponse(Category category) {
        long productCount = productRepository.countByCategoryIdAndIsActiveTrue(category.getId());

        List<CategoryResponse> subcategories = category.getSubcategories().stream()
                .filter(Category::getIsActive)
                .map(this::mapToCategoryResponse)
                .collect(Collectors.toList());

        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .slug(category.getSlug())
                .imageUrl(category.getImageUrl())
                .isActive(category.getIsActive())
                .productCount(productCount)
                .subcategories(subcategories.isEmpty() ? null : subcategories)
                .build();
    }
}
