package com.dazehaze.service;

import com.dazehaze.dto.user.WishlistResponse;
import com.dazehaze.entity.Product;
import com.dazehaze.entity.ProductImage;
import com.dazehaze.entity.User;
import com.dazehaze.repository.ProductRepository;
import com.dazehaze.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WishlistService {

        private final UserRepository userRepository;
        private final ProductRepository productRepository;

        @Transactional(readOnly = true)
        public WishlistResponse getWishlist(Long userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                List<WishlistResponse.WishlistItem> items = user.getWishlist().stream()
                                .map(this::mapToWishlistItem)
                                .collect(Collectors.toList());

                return WishlistResponse.builder()
                                .items(items)
                                .totalItems(items.size())
                                .build();
        }

        @Transactional
        public WishlistResponse addToWishlist(Long userId, Long productId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                Product product = productRepository.findById(productId)
                                .orElseThrow(() -> new RuntimeException("Product not found"));

                if (user.getWishlist() == null) {
                        user.setWishlist(new HashSet<>());
                }

                // Check if already in wishlist
                boolean alreadyExists = user.getWishlist().stream()
                                .anyMatch(p -> p.getId().equals(productId));

                if (!alreadyExists) {
                        user.getWishlist().add(product);
                        userRepository.save(user);
                }

                return getWishlist(userId);
        }

        @Transactional
        public WishlistResponse removeFromWishlist(Long userId, Long productId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                if (user.getWishlist() != null) {
                        user.getWishlist().removeIf(p -> p.getId().equals(productId));
                        userRepository.save(user);
                }

                return getWishlist(userId);
        }

        @Transactional(readOnly = true)
        public boolean isInWishlist(Long userId, Long productId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                if (user.getWishlist() == null) {
                        return false;
                }

                return user.getWishlist().stream()
                                .anyMatch(p -> p.getId().equals(productId));
        }

        @Transactional
        public void clearWishlist(Long userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                if (user.getWishlist() != null) {
                        user.getWishlist().clear();
                        userRepository.save(user);
                }
        }

        private WishlistResponse.WishlistItem mapToWishlistItem(Product product) {
                String imageUrl = product.getImages().stream()
                                .filter(ProductImage::getIsMain)
                                .findFirst()
                                .map(ProductImage::getUrl)
                                .orElse(product.getImages().isEmpty() ? null : product.getImages().get(0).getUrl());

                boolean inStock = product.getVariants().stream()
                                .anyMatch(v -> v.getStock() > 0);

                return WishlistResponse.WishlistItem.builder()
                                .productId(product.getId())
                                .productName(product.getName())
                                .productSlug(product.getSlug())
                                .imageUrl(imageUrl)
                                .price(product.getBasePrice())
                                .salePrice(product.getSalePrice())
                                .isOnSale(product.isOnSale())
                                .inStock(inStock)
                                .build();
        }
}
