package com.dazehaze.service;

import com.dazehaze.dto.gallery.GalleryImageRequest;
import com.dazehaze.dto.gallery.GalleryImageResponse;
import com.dazehaze.entity.GalleryImage;
import com.dazehaze.repository.GalleryImageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GalleryService {

    private final GalleryImageRepository galleryImageRepository;
    private final CloudinaryService cloudinaryService;

    /**
     * Get all active images for public gallery
     */
    public List<GalleryImageResponse> getActiveImages() {
        return galleryImageRepository.findByIsActiveTrueOrderBySortOrderAsc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all images for admin panel
     */
    public List<GalleryImageResponse> getAllImages() {
        return galleryImageRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Upload new gallery image
     */
    @Transactional
    public GalleryImageResponse createImage(MultipartFile file, GalleryImageRequest request) throws IOException {
        // Upload to Cloudinary
        Map<String, Object> uploadResult = cloudinaryService.uploadImage(file, "dazehaze/gallery");
        String imageUrl = (String) uploadResult.get("secure_url");
        String publicId = (String) uploadResult.get("public_id");

        // Create entity
        GalleryImage galleryImage = GalleryImage.builder()
                .url(imageUrl)
                .publicId(publicId)
                .title(request.getTitle())
                .description(request.getDescription())
                .altText(request.getAltText())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        GalleryImage saved = galleryImageRepository.save(galleryImage);
        log.info("Gallery image created: {} - {}", saved.getId(), imageUrl);

        return mapToResponse(saved);
    }

    /**
     * Update gallery image metadata
     */
    @Transactional
    public GalleryImageResponse updateImage(Long id, GalleryImageRequest request) {
        GalleryImage galleryImage = galleryImageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Imagen no encontrada: " + id));

        if (request.getTitle() != null) {
            galleryImage.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            galleryImage.setDescription(request.getDescription());
        }
        if (request.getAltText() != null) {
            galleryImage.setAltText(request.getAltText());
        }
        if (request.getSortOrder() != null) {
            galleryImage.setSortOrder(request.getSortOrder());
        }
        if (request.getIsActive() != null) {
            galleryImage.setIsActive(request.getIsActive());
        }

        GalleryImage saved = galleryImageRepository.save(galleryImage);
        log.info("Gallery image updated: {}", saved.getId());

        return mapToResponse(saved);
    }

    /**
     * Delete gallery image (from DB and Cloudinary)
     */
    @Transactional
    public void deleteImage(Long id) {
        GalleryImage galleryImage = galleryImageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Imagen no encontrada: " + id));

        // Delete from Cloudinary
        if (galleryImage.getPublicId() != null) {
            cloudinaryService.deleteImage(galleryImage.getPublicId());
        }

        // Delete from DB
        galleryImageRepository.delete(galleryImage);
        log.info("Gallery image deleted: {}", id);
    }

    /**
     * Reorder gallery images
     */
    @Transactional
    public List<GalleryImageResponse> reorderImages(List<Long> imageIds) {
        for (int i = 0; i < imageIds.size(); i++) {
            Long imageId = imageIds.get(i);
            GalleryImage image = galleryImageRepository.findById(imageId)
                    .orElseThrow(() -> new RuntimeException("Imagen no encontrada: " + imageId));
            image.setSortOrder(i);
            galleryImageRepository.save(image);
        }
        log.info("Gallery images reordered: {}", imageIds);
        return getAllImages();
    }

    private GalleryImageResponse mapToResponse(GalleryImage image) {
        return GalleryImageResponse.builder()
                .id(image.getId())
                .url(image.getUrl())
                .title(image.getTitle())
                .description(image.getDescription())
                .altText(image.getAltText())
                .sortOrder(image.getSortOrder())
                .isActive(image.getIsActive())
                .createdAt(image.getCreatedAt())
                .build();
    }
}
