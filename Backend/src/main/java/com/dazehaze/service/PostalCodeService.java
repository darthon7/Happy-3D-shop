package com.dazehaze.service;

import com.dazehaze.entity.PostalCode;
import com.dazehaze.repository.PostalCodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostalCodeService {

    private final PostalCodeRepository postalCodeRepository;
    private final PostalCodeBatchService postalCodeBatchService; // Injected

    public List<PostalCode> getByCode(String code) {
        return postalCodeRepository.findByCode(code);
    }

    public Map<String, Object> getZipCodeDetails(String code) {
        List<PostalCode> results = postalCodeRepository.findByCode(code);
        if (results.isEmpty())
            return null;

        PostalCode first = results.get(0);

        // Colonias list
        List<String> colonias = results.stream()
                .map(PostalCode::getSettlement)
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("code", code);
        response.put("state", first.getState());
        response.put("stateCode", first.getStateCode());
        response.put("municipality", first.getMunicipality());
        response.put("city", first.getCity());
        response.put("colonias", colonias);

        return response;
    }

    public void importData(String filePath) {
        importData(filePath, false);
    }

    public void importData(String filePath, boolean fromClasspath) {
        if (fromClasspath) {
            importDataFromClasspath(filePath);
        } else {
            importDataFromFile(filePath);
        }
    }

    private void importDataFromFile(String filePath) {
        log.info("Starting Postal Code Import from file: {}", filePath);
        long startTime = System.currentTimeMillis();
        try (BufferedReader br = new BufferedReader(new FileReader(filePath, StandardCharsets.ISO_8859_1))) {
            doImport(br, startTime);
        } catch (Exception e) {
            log.error("Failed to import postal codes from file: {}", filePath, e);
        }
    }

    private void importDataFromClasspath(String resourcePath) {
        log.info("Starting Postal Code Import from classpath: {}", resourcePath);
        long startTime = System.currentTimeMillis();
        try (InputStream is = getClass().getClassLoader().getResourceAsStream(resourcePath)) {
            if (is == null) {
                log.error("Classpath resource not found: {}", resourcePath);
                return;
            }
            BufferedReader br = new BufferedReader(new InputStreamReader(is, StandardCharsets.ISO_8859_1));
            doImport(br, startTime);
        } catch (Exception e) {
            log.error("Failed to import postal codes from classpath: {}", resourcePath, e);
        }
    }

    private void doImport(BufferedReader br, long startTime) throws Exception {
        List<PostalCode> batch = new ArrayList<>();
        int count = 0;

        try {
            String line;
            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty() || line.startsWith("d_codigo") || line.contains("Catálogo Nacional")
                        || line.contains("El Catálogo")) {
                    continue;
                }

                String[] parts = line.split("\\|");
                if (parts.length < 5)
                    continue;

                try {
                    String d_codigo = parts[0];
                    String d_asenta = parts[1];
                    String d_tipo_asenta = parts[2];
                    String d_mnpio = parts[3];
                    String d_estado = parts[4];
                    String d_ciudad = parts.length > 5 ? parts[5] : "";
                    String c_estado = parts.length > 7 ? parts[7] : "";

                    PostalCode pc = PostalCode.builder()
                            .code(d_codigo)
                            .settlement(d_asenta)
                            .settlementType(d_tipo_asenta)
                            .municipality(d_mnpio)
                            .state(d_estado)
                            .city(d_ciudad != null && d_ciudad.equals(d_estado) ? d_mnpio : d_ciudad)
                            .stateCode(c_estado)
                            .build();

                    batch.add(pc);
                    count++;

                    if (batch.size() >= 1000) {
                        try {
                            postalCodeBatchService.saveBatch(batch);
                        } catch (Exception e) {
                            log.error("Batch save failed, retrying individually...", e);
                            for (PostalCode p : batch) {
                                try {
                                    postalCodeBatchService.saveSingle(p);
                                } catch (Exception ex) {
                                    log.error("Failed to save record: {} | Error: {}", p.getCode(), ex.getMessage());
                                }
                            }
                        }
                        batch.clear();
                        log.info("Imported {} records...", count);
                    }
                } catch (Exception e) {
                    log.error("Error parsing line: {}", line, e);
                }
            }

            if (!batch.isEmpty()) {
                try {
                    postalCodeBatchService.saveBatch(batch);
                } catch (Exception e) {
                    for (PostalCode p : batch) {
                        try {
                            postalCodeBatchService.saveSingle(p);
                        } catch (Exception ex) {
                            log.error("Failed to save record: {}", p.getCode());
                        }
                    }
                }
            }

            log.info("Finished Postal Code Import. Total records: {} in {} ms", count,
                    System.currentTimeMillis() - startTime);

        } finally {
            br.close();
        }
    }

    public long count() {
        return postalCodeRepository.count();
    }

    public void deleteAll() {
        postalCodeRepository.deleteAll();
    }
}
