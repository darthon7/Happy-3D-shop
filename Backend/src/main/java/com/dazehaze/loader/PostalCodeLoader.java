package com.dazehaze.loader;

import com.dazehaze.service.PostalCodeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.File;

@Component
@RequiredArgsConstructor
@Slf4j
public class PostalCodeLoader implements CommandLineRunner {

    private final PostalCodeService postalCodeService;

    @Override
    public void run(String... args) throws Exception {
        long count = postalCodeService.count();
        if (count > 100000) {
            log.info("Postal codes already imported ({}) records. Skipping.", count);
            return;
        }

        if (count > 0) {
            log.warn("Detected partial import ({} records). Re-importing...", count);
            postalCodeService.deleteAll();
        }

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
            postalCodeService.importData(path);
        } else {
            log.warn("Codigo Postal.txt not found in any standard locations. Skipping import.");
        }
    }
}
