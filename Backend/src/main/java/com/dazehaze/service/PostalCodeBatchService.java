package com.dazehaze.service;

import com.dazehaze.entity.PostalCode;
import com.dazehaze.repository.PostalCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PostalCodeBatchService {

    private final PostalCodeRepository postalCodeRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveBatch(List<PostalCode> batch) {
        postalCodeRepository.saveAll(batch);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveSingle(PostalCode postalCode) {
        postalCodeRepository.save(postalCode);
    }
}
