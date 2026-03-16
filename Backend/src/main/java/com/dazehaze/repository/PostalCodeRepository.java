package com.dazehaze.repository;

import com.dazehaze.entity.PostalCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostalCodeRepository extends JpaRepository<PostalCode, Long> {
    List<PostalCode> findByCode(String code);
}
