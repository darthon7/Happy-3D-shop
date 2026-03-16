package com.dazehaze.controller.admin;

import com.dazehaze.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/upload")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class ImageUploadController {

    private final CloudinaryService cloudinaryService;

    /**
     * Sube una imagen de producto
     */
    @PostMapping("/product")
    public ResponseEntity<Map<String, String>> uploadProductImage(
            @RequestParam("image") MultipartFile file) {
        try {
            String imageUrl = cloudinaryService.uploadProductImage(file);
            return ResponseEntity.ok(Map.of(
                    "url", imageUrl,
                    "message", "Imagen subida exitosamente"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error al subir la imagen"));
        }
    }

    /**
     * Sube una imagen de categoría
     */
    @PostMapping("/category")
    public ResponseEntity<Map<String, String>> uploadCategoryImage(
            @RequestParam("image") MultipartFile file) {
        try {
            String imageUrl = cloudinaryService.uploadCategoryImage(file);
            return ResponseEntity.ok(Map.of(
                    "url", imageUrl,
                    "message", "Imagen subida exitosamente"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error al subir la imagen"));
        }
    }

    /**
     * Elimina una imagen por su URL
     */
    @DeleteMapping
    public ResponseEntity<Map<String, String>> deleteImage(@RequestParam("url") String imageUrl) {
        String publicId = cloudinaryService.extractPublicId(imageUrl);
        if (publicId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "URL inválida"));
        }

        boolean deleted = cloudinaryService.deleteImage(publicId);
        if (deleted) {
            return ResponseEntity.ok(Map.of("message", "Imagen eliminada exitosamente"));
        } else {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error al eliminar la imagen"));
        }
    }
}
