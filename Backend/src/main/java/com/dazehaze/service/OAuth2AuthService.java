package com.dazehaze.service;

import com.dazehaze.dto.auth.AuthResponse;
import com.dazehaze.dto.auth.OAuth2UserInfo;
import com.dazehaze.entity.User;
import com.dazehaze.repository.UserRepository;
import com.dazehaze.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OAuth2AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;
    private final RestTemplate restTemplate = new RestTemplate();

    private static final String GOOGLE_USER_INFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
    private static final String FACEBOOK_USER_INFO_URL = "https://graph.facebook.com/me?fields=id,name,email,first_name,last_name,picture";

    @Transactional
    public AuthResponse authenticateWithOAuth2(String provider, String accessToken) {
        OAuth2UserInfo userInfo = fetchUserInfo(provider, accessToken);
        User user = findOrCreateUser(userInfo);
        return generateAuthResponse(user);
    }

    private OAuth2UserInfo fetchUserInfo(String provider, String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            if ("google".equalsIgnoreCase(provider)) {
                return fetchGoogleUserInfo(entity);
            } else if ("facebook".equalsIgnoreCase(provider)) {
                return fetchFacebookUserInfo(accessToken);
            } else {
                throw new RuntimeException("Unsupported OAuth2 provider: " + provider);
            }
        } catch (Exception e) {
            log.error("Error fetching user info from {}: {}", provider, e.getMessage());
            throw new RuntimeException("Failed to authenticate with " + provider);
        }
    }

    private OAuth2UserInfo fetchGoogleUserInfo(HttpEntity<String> entity) {
        ResponseEntity<Map> response = restTemplate.exchange(
                GOOGLE_USER_INFO_URL,
                HttpMethod.GET,
                entity,
                Map.class);

        Map<String, Object> attributes = response.getBody();
        if (attributes == null) {
            throw new RuntimeException("Failed to get user info from Google");
        }

        return OAuth2UserInfo.builder()
                .id((String) attributes.get("sub"))
                .email((String) attributes.get("email"))
                .firstName((String) attributes.get("given_name"))
                .lastName((String) attributes.get("family_name"))
                .name((String) attributes.get("name"))
                .pictureUrl((String) attributes.get("picture"))
                .provider("google")
                .build();
    }

    private OAuth2UserInfo fetchFacebookUserInfo(String accessToken) {
        String url = FACEBOOK_USER_INFO_URL + "&access_token=" + accessToken;
        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);

        Map<String, Object> attributes = response.getBody();
        if (attributes == null) {
            throw new RuntimeException("Failed to get user info from Facebook");
        }

        String pictureUrl = null;
        if (attributes.get("picture") instanceof Map) {
            Map<String, Object> picture = (Map<String, Object>) attributes.get("picture");
            if (picture.get("data") instanceof Map) {
                Map<String, Object> data = (Map<String, Object>) picture.get("data");
                pictureUrl = (String) data.get("url");
            }
        }

        return OAuth2UserInfo.builder()
                .id((String) attributes.get("id"))
                .email((String) attributes.get("email"))
                .firstName((String) attributes.get("first_name"))
                .lastName((String) attributes.get("last_name"))
                .name((String) attributes.get("name"))
                .pictureUrl(pictureUrl)
                .provider("facebook")
                .build();
    }

    private User findOrCreateUser(OAuth2UserInfo userInfo) {
        String email = userInfo.getEmail().trim().toLowerCase();
        return userRepository.findByEmail(email)
                .map(existingUser -> updateExistingUser(existingUser, userInfo))
                .orElseGet(() -> createNewUser(userInfo));
    }

    private User updateExistingUser(User user, OAuth2UserInfo userInfo) {
        // Update profile image if not set
        if (user.getProfileImageUrl() == null && userInfo.getPictureUrl() != null) {
            user.setProfileImageUrl(userInfo.getPictureUrl());
        }

        // Link account to OAuth provider if it was originally local
        if ("local".equals(user.getAuthProvider())) {
            user.setAuthProvider(userInfo.getProvider());
            user.setOauth2ProviderId(userInfo.getId());
        }

        return userRepository.save(user);
    }

    private User createNewUser(OAuth2UserInfo userInfo) {
        User user = User.builder()
                .email(userInfo.getEmail().trim().toLowerCase())
                .firstName(userInfo.getFirstName())
                .lastName(userInfo.getLastName())
                .password(passwordEncoder.encode(UUID.randomUUID().toString())) // Random password for OAuth users
                .profileImageUrl(userInfo.getPictureUrl())
                .role(User.Role.CUSTOMER)
                .enabled(true)
                .emailVerified(true) // Email verified by OAuth provider
                .authProvider(userInfo.getProvider())
                .oauth2ProviderId(userInfo.getId())
                .build();
        return userRepository.save(user);
    }

    private AuthResponse generateAuthResponse(User user) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtService.generateToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(86400L) // 24 hours
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .role(user.getRole().name())
                        .profileImageUrl(user.getProfileImageUrl())
                        .build())
                .build();
    }
}
