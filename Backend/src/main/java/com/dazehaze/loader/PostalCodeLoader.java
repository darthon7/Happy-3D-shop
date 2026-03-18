package com.dazehaze.loader;

import com.dazehaze.service.PostalCodeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;

@Component
@RequiredArgsConstructor
@Slf4j
public class PostalCodeLoader implements CommandLineRunner {

    private static final String CLASSPATH_RESOURCE = "data/codigos-postales-mexico.txt";

    private final PostalCodeService postalCodeService;

    @Override
    public void run(String... args) throws Exception {
        long count = postalCodeService.count();
        if (count > 100000) {
            log.info("Postal codes already imported ({} records). Skipping.", count);
            return;
        }

        if (count > 0) {
            log.warn("Detected partial import ({} records). Re-importing...", count);
            postalCodeService.deleteAll();
        }

        try {
            ClassPathResource resource = new ClassPathResource(CLASSPATH_RESOURCE);
            if (!resource.exists()) {
                log.warn("Postal codes resource not found in classpath: {}. Falling back to filesystem...", CLASSPATH_RESOURCE);
                loadFromFilesystem();
                return;
            }

            File tempFile = copyToTempFile(resource);
            if (tempFile != null) {
                String path = tempFile.getAbsolutePath();
                log.info("Loading postal codes from classpath resource. Temp file: {}", path);
                postalCodeService.importData(path, false);
                boolean deleted = tempFile.delete();
                if (!deleted) {
                    log.warn("Could not delete temp file: {}", path);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to load from classpath, trying filesystem: {}", e.getMessage());
            loadFromFilesystem();
        }
    }

    private File copyToTempFile(ClassPathResource resource) throws Exception {
        File tempFile = File.createTempFile("postal-codes-", ".txt");
        try (InputStream is = resource.getInputStream();
             FileOutputStream fos = new FileOutputStream(tempFile)) {
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = is.read(buffer)) != -1) {
                fos.write(buffer, 0, bytesRead);
            }
        }
        return tempFile;
    }

    private void loadFromFilesystem() {
        String[] possiblePaths = {
                "../Codigo Postal.txt",
                "Codigo Postal.txt",
                "c:\\Users\\Visio\\OneDrive\\Desktop\\DazeHaze\\Codigo Postal.txt"
        };

        File file = null;
        for (String p : possiblePaths) {
            File f = new File(p);
            if (f.exists() && f.isFile()) {
                file = f;
                break;
            }
        }

        if (file != null) {
            String path = file.getAbsolutePath();
            log.info("Found Codigo Postal.txt at {}. Starting import...", path);
            postalCodeService.importData(path, false);
        } else {
            log.warn("Codigo Postal.txt not found. Postal code import skipped.");
        }
    }
}
