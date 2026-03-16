package com.dazehaze.service;

import com.dazehaze.dto.user.*;
import com.dazehaze.entity.Address;
import com.dazehaze.entity.User;
import com.dazehaze.repository.AddressRepository;
import com.dazehaze.repository.OrderRepository;
import com.dazehaze.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<UserProfileResponse.AddressInfo> addresses = user.getAddresses().stream()
                .filter(addr -> !Boolean.TRUE.equals(addr.getDeleted()))
                .map(this::mapToAddressInfo)
                .collect(Collectors.toList());

        int wishlistCount = user.getWishlist() != null ? user.getWishlist().size() : 0;
        long ordersCount = orderRepository.countByUserId(userId);

        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .emailVerified(user.getEmailVerified())
                .createdAt(user.getCreatedAt())
                .addresses(addresses)
                .wishlistCount(wishlistCount)
                .ordersCount((int) ordersCount)
                .build();
    }

    @Transactional
    public UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email already in use");
            }
            user.setEmail(request.getEmail());
            user.setEmailVerified(false);
        }

        return getProfile(userId);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("New passwords do not match");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    // Address management
    @Transactional(readOnly = true)
    public List<UserProfileResponse.AddressInfo> getAddresses(Long userId) {
        return addressRepository.findByUserId(userId).stream()
                .filter(addr -> !Boolean.TRUE.equals(addr.getDeleted()))
                .map(this::mapToAddressInfo)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserProfileResponse.AddressInfo addAddress(Long userId, AddressRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // If this is set as default, remove default from others
        if (Boolean.TRUE.equals(request.getIsDefault())) {
            addressRepository.findByUserId(userId).forEach(addr -> {
                if (addr.getIsDefault()) {
                    addr.setIsDefault(false);
                    addressRepository.save(addr);
                }
            });
        }

        Address address = Address.builder()
                .user(user)
                .street(request.getStreet())
                .streetLine2(request.getStreetLine2())
                .city(request.getCity())
                .state(request.getState())
                .postalCode(request.getPostalCode())
                .country(request.getCountry())
                .addressType(request.getAddressType() != null ? Address.AddressType.valueOf(request.getAddressType())
                        : Address.AddressType.SHIPPING)
                .isDefault(request.getIsDefault())
                .build();

        Address saved = addressRepository.save(address);
        return mapToAddressInfo(saved);
    }

    @Transactional
    public UserProfileResponse.AddressInfo updateAddress(Long userId, Long addressId, AddressRequest request) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        if (!address.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        // If setting as default, remove default from others
        if (Boolean.TRUE.equals(request.getIsDefault()) && !Boolean.TRUE.equals(address.getIsDefault())) {
            addressRepository.findByUserId(userId).forEach(addr -> {
                if (addr.getIsDefault() && !addr.getId().equals(addressId)) {
                    addr.setIsDefault(false);
                    addressRepository.save(addr);
                }
            });
        }

        address.setStreet(request.getStreet());
        address.setStreetLine2(request.getStreetLine2());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setPostalCode(request.getPostalCode());
        address.setCountry(request.getCountry());
        if (request.getAddressType() != null) {
            address.setAddressType(Address.AddressType.valueOf(request.getAddressType()));
        }
        address.setIsDefault(request.getIsDefault());

        addressRepository.save(address);
        return mapToAddressInfo(address);
    }

    @Transactional
    public void deleteAddress(Long userId, Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        if (!address.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        address.setDeleted(true);
        addressRepository.save(address);
    }

    private UserProfileResponse.AddressInfo mapToAddressInfo(Address address) {
        return UserProfileResponse.AddressInfo.builder()
                .id(address.getId())
                .street(address.getStreet())
                .streetLine2(address.getStreetLine2())
                .city(address.getCity())
                .state(address.getState())
                .postalCode(address.getPostalCode())
                .country(address.getCountry())
                .addressType(address.getAddressType() != null ? address.getAddressType().name() : null)
                .isDefault(address.getIsDefault())
                .build();
    }
}
