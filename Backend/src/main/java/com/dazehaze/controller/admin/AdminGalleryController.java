package com.dazehaze.controller.admin;

import com.dazehaze.dto.gallery.GalleryImageRequest;
import com.dazehaze.dto.gallery.GalleryImageResponse;
import com.dazehaze.service.GalleryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/admin/gallery")
@RequiredArgsConstructor
public class AdminGalleryController {

    private final GalleryService galleryService;

    @GetMapping
    public ResponseEntity<List<GalleryImageResponse>> getAllImages() {
        return ResponseEntity.ok(galleryService.getAllImages());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<GalleryImageResponse> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "altText", required = false) String altText,
            @RequestParam(value = "sortOrder", required = false, defaultValue = "0") Integer sortOrder,
            @RequestParam(value = "isActive", required = false, defaultValue = "true") Boolean isActive)
            throws IOException {
        GalleryImageRequest request = GalleryImageRequest.builder()
                .title(title)
                .description(description)
                .altText(altText)
                .sortOrder(sortOrder)
                .isActive(isActive)
                .build();

        return ResponseEntity.ok(galleryService.createImage(file, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GalleryImageResponse> updateImage(
            @PathVariable Long id,
            @RequestBody GalleryImageRequest request) {
        return ResponseEntity.ok(galleryService.updateImage(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteImage(@PathVariable Long id) {
        galleryService.deleteImage(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reorder")
    public ResponseEntity<List<GalleryImageResponse>> reorderImages(@RequestBody List<Long> imageIds) {
        return ResponseEntity.ok(galleryService.reorderImages(imageIds));
    }
}
