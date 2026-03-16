package com.dazehaze.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private String role;
    private Boolean emailVerified;
    private LocalDateTime createdAt;
    private List<AddressInfo> addresses;
    private int wishlistCount;
    private int ordersCount;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddressInfo {
        private Long id;
        private String street;
        private String streetLine2;
        private String city;
        private String state;
        private String postalCode;
        private String country;
        private String addressType;
        private Boolean isDefault;
    }
}
