package com.dazehaze.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.apache.tika.Tika;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    /**
     * Sube una imagen a Cloudinary
     * 
     * @param file   Archivo a subir
     * @param folder Carpeta destino en Cloudinary (ej: "dazehaze/products")
     * @return Map con información de la imagen subida (url, public_id, etc)
     */
    public Map<String, Object> uploadImage(MultipartFile file, String folder) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("El archivo está vacío");
        }

        // 1. Validar Magic Bytes con Apache Tika
        Tika tika = new Tika();
        String detectedMimeType;
        try {
            detectedMimeType = tika.detect(file.getInputStream());
        } catch (IOException e) {
            log.error("Error detectando MIME type: {}", e.getMessage());
            throw new IllegalArgumentException("No se pudo verificar el contenido del archivo");
        }

        if (detectedMimeType == null || !detectedMimeType.startsWith("image/")) {
            log.warn("Intento de subida denegado. Tipo detectado: {}", detectedMimeType);
            throw new IllegalArgumentException("El contenido del archivo no es una imagen permitida");
        }

        // 2. Validar que el MIME type detectado sea uno de los permitidos
        Set<String> allowedMimeTypes = Set.of("image/jpeg", "image/png", "image/webp", "image/gif", "image/avif");
        if (!allowedMimeTypes.contains(detectedMimeType)) {
            throw new IllegalArgumentException("Formato de imagen no permitido. Use: jpg, jpeg, png, webp, gif, avif");
        }

        // 3. Validar tamaño (máx 10MB)
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("El archivo no puede superar 10MB");
        }

        try {
            Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", folder,
                            "resource_type", "image"));

            log.info("Imagen subida exitosamente: {}", uploadResult.get("secure_url"));
            return uploadResult;
        } catch (IOException e) {
            log.error("Error al subir imagen a Cloudinary: {}", e.getMessage());
            throw new IOException("Error al subir la imagen: " + e.getMessage());
        }
    }

    /**
     * Sube una imagen de producto
     */
    public String uploadProductImage(MultipartFile file) throws IOException {
        Map<String, Object> result = uploadImage(file, "dazehaze/products");
        return (String) result.get("secure_url");
    }

    /**
     * Sube una imagen de categoría
     */
    public String uploadCategoryImage(MultipartFile file) throws IOException {
        Map<String, Object> result = uploadImage(file, "dazehaze/categories");
        return (String) result.get("secure_url");
    }

    /**
     * Elimina una imagen de Cloudinary
     * 
     * @param publicId ID público de la imagen
     */
    public boolean deleteImage(String publicId) {
        try {
            Map<String, Object> result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            String status = (String) result.get("result");
            log.info("Imagen eliminada: {} - Status: {}", publicId, status);
            return "ok".equals(status);
        } catch (IOException e) {
            log.error("Error al eliminar imagen: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Extrae el public_id de una URL de Cloudinary
     */
    public String extractPublicId(String cloudinaryUrl) {
        if (cloudinaryUrl == null || !cloudinaryUrl.contains("cloudinary.com")) {
            return null;
        }
        // URL format:
        // https://res.cloudinary.com/cloud_name/image/upload/v.../folder/filename.ext
        try {
            String[] parts = cloudinaryUrl.split("/upload/");
            if (parts.length > 1) {
                String pathWithVersion = parts[1];
                // Remove version (v1234567890/)
                String pathWithoutVersion = pathWithVersion.replaceFirst("v\\d+/", "");
                // Remove extension
                int lastDot = pathWithoutVersion.lastIndexOf('.');
                if (lastDot > 0) {
                    return pathWithoutVersion.substring(0, lastDot);
                }
                return pathWithoutVersion;
            }
        } catch (Exception e) {
            log.error("Error extrayendo public_id de URL: {}", cloudinaryUrl);
        }
        return null;
    }
}
