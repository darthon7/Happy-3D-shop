package com.dazehaze.controller;

import com.dazehaze.dto.auth.AuthResponse;
import com.dazehaze.dto.auth.ForgotPasswordRequest;
import com.dazehaze.dto.auth.LoginRequest;
import com.dazehaze.dto.auth.OAuth2LoginRequest;
import com.dazehaze.dto.auth.RegisterRequest;
import com.dazehaze.dto.auth.ResetPasswordRequest;
import com.dazehaze.service.AuthService;
import com.dazehaze.service.OAuth2AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final OAuth2AuthService oAuth2AuthService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/oauth2/{provider}")
    public ResponseEntity<AuthResponse> oauth2Login(
            @PathVariable String provider,
            @RequestBody OAuth2LoginRequest request) {
        AuthResponse response = oAuth2AuthService.authenticateWithOAuth2(provider, request.getAccessToken());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<String> getCurrentUser() {
        return ResponseEntity.ok("Authenticated user endpoint - will implement user details");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok("Si el correo existe, recibirás un enlace para recuperar tu contraseña");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok("Contraseña actualizada exitosamente");
    }

    @lombok.Data
    public static class RefreshTokenRequest {
        private String refreshToken;
    }
}
