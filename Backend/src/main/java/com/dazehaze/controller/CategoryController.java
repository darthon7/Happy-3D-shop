package com.dazehaze.controller;

import com.dazehaze.dto.category.CategoryResponse;
import com.dazehaze.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @GetMapping("/{slug}")
    public ResponseEntity<CategoryResponse> getCategoryBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(categoryService.getCategoryBySlug(slug));
    }

    @GetMapping("/{slug}/subcategories")
    public ResponseEntity<List<CategoryResponse>> getSubcategories(@PathVariable String slug) {
        return ResponseEntity.ok(categoryService.getSubcategories(slug));
    }
}
