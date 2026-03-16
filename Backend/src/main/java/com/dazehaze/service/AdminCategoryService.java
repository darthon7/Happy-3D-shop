package com.dazehaze.service;

import com.dazehaze.dto.admin.CreateCategoryRequest;
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
public class AdminCategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Transactional
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        if (categoryRepository.existsBySlug(request.getSlug())) {
            throw new RuntimeException("Category slug already exists: " + request.getSlug());
        }

        Category parent = null;
        if (request.getParentId() != null) {
            parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new RuntimeException("Parent category not found"));
        }

        Category category = Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .slug(request.getSlug())
                .imageUrl(request.getImageUrl())
                .parent(parent)
                .sortOrder(request.getSortOrder())
                .isActive(request.getIsActive())
                .build();

        Category saved = categoryRepository.save(category);
        return mapToCategoryResponse(saved);
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, CreateCategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        if (!category.getSlug().equals(request.getSlug()) && categoryRepository.existsBySlug(request.getSlug())) {
            throw new RuntimeException("Category slug already exists: " + request.getSlug());
        }

        Category parent = null;
        if (request.getParentId() != null) {
            if (request.getParentId().equals(id)) {
                throw new RuntimeException("Category cannot be its own parent");
            }
            parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new RuntimeException("Parent category not found"));
        }

        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setSlug(request.getSlug());
        category.setImageUrl(request.getImageUrl());
        category.setParent(parent);
        category.setSortOrder(request.getSortOrder());
        category.setIsActive(request.getIsActive());

        categoryRepository.save(category);
        return mapToCategoryResponse(category);
    }

    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        if (!category.getSubcategories().isEmpty()) {
            throw new RuntimeException("Cannot delete category with subcategories");
        }

        if (productRepository.countByCategoryIdAndIsActiveTrue(id) > 0) {
            throw new RuntimeException("Cannot delete category with products");
        }

        categoryRepository.delete(category);
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .filter(c -> c.getParent() == null)
                .map(this::mapToCategoryResponse)
                .collect(Collectors.toList());
    }

    private CategoryResponse mapToCategoryResponse(Category category) {
        long productCount = productRepository.countByCategoryIdAndIsActiveTrue(category.getId());

        List<CategoryResponse> subcategories = category.getSubcategories().stream()
                .map(this::mapToCategoryResponse)
                .collect(Collectors.toList());

        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .slug(category.getSlug())
                .imageUrl(category.getImageUrl())
                .productCount(productCount)
                .subcategories(subcategories.isEmpty() ? null : subcategories)
                .build();
    }
}
