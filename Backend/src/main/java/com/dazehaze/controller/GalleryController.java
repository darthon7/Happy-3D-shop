package com.dazehaze.controller;

import com.dazehaze.dto.gallery.GalleryImageResponse;
import com.dazehaze.service.GalleryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/gallery")
@RequiredArgsConstructor
public class GalleryController {

    private final GalleryService galleryService;

    @GetMapping
    public ResponseEntity<List<GalleryImageResponse>> getGalleryImages() {
        return ResponseEntity.ok(galleryService.getActiveImages());
    }
}
