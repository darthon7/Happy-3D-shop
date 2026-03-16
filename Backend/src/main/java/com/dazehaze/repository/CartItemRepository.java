package com.dazehaze.repository;

import com.dazehaze.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    Optional<CartItem> findByCartIdAndProductVariantId(Long cartId, Long variantId);

    void deleteByCartId(Long cartId);

    void deleteByProductVariantId(Long variantId);

    List<CartItem> findByProductVariantId(Long variantId);
}
