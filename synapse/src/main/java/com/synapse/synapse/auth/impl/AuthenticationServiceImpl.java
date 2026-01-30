package com.synapse.synapse.auth.impl;

import com.synapse.synapse.auth.AuthenticationService;
import com.synapse.synapse.auth.request.ActivationRequest;
import com.synapse.synapse.auth.request.AuthenticationRequest;
import com.synapse.synapse.auth.request.RefreshRequest;
import com.synapse.synapse.auth.request.RegistrationRequest;
import com.synapse.synapse.auth.response.AuthenticationResponse;
import com.synapse.synapse.email.EmailService;
import com.synapse.synapse.email.EmailTemplateName;
import com.synapse.synapse.exception.BusinessException;
import com.synapse.synapse.role.Role;
import com.synapse.synapse.role.RoleRepository;
import com.synapse.synapse.security.JwtService;
import com.synapse.synapse.user.*;
import jakarta.mail.MessagingException;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static com.synapse.synapse.exception.ErrorCode.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationServiceImpl implements AuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final TokenRepository tokenRepository;
    private final UserMapper userMapper;

    @Override
    public AuthenticationResponse login(final AuthenticationRequest request) {
        //check if email and password valid
        final Authentication auth = this.authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        final User user = (User) auth.getPrincipal();
        final String token = this.jwtService.generateAccessToken(user.getUsername());
        final String refreshToken = this.jwtService.generateRefreshToken(user.getUsername());
        final String tokenType = "Bearer";
        return AuthenticationResponse.builder()
                .accessToken(token)
                .refreshToken(refreshToken)
                .tokenType(tokenType)
                .build();
    }

    @Override
    @Transactional
    public void register(final RegistrationRequest request) {

        checkUserEmail(request.getEmail());
        checkPasswords(request.getPassword(), request.getConfirmPassword());

        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new EntityNotFoundException("Role ROLE_USER does not exist"));

        User user = userMapper.toUser(request);
        user.setRoles(List.of(userRole));

        // 🔐 IMPORTANT FLAGS
        user.setEnabled(false);
        user.setEmailVerified(false);
        user.setLocked(false);
        user.setCredentialsExpired(false);

        userRepository.save(user);

        sendActivationEmail(user);
    }

    @Override
    public AuthenticationResponse refreshToken(final RefreshRequest req) {
        final String newAccessToken = this.jwtService.refreshAccessToken(req.getRefreshToken());
        final String tokenType = "Bearer";
        return AuthenticationResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(req.getRefreshToken())
                .tokenType(tokenType)
                .build();
    }

    @Override
    @Transactional
    public void activateAccount(ActivationRequest request) {

        User user = userRepository.findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> new BusinessException(USER_NOT_FOUND));

        Token token = tokenRepository.findByToken(request.getCode())
                .orElseThrow(() -> new BusinessException(INVALID_ACTIVATION_CODE));

        System.out.println("Token user ID: " + token.getUser().getId());
        System.out.println("Request user ID: " + user.getId());
        System.out.println("Equals? " + token.getUser().getId().equals(user.getId()));

        if (!token.getUser().getId().equals(user.getId())) {
            throw new BusinessException(INVALID_ACTIVATION_CODE);
        }

        if (token.getValidatedAt() != null) {
            throw new BusinessException(ACTIVATION_CODE_ALREADY_USED);
        }

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException(ACTIVATION_CODE_EXPIRED);
        }

        user.setEnabled(true);
        user.setEmailVerified(true);

        token.setValidatedAt(LocalDateTime.now());

        userRepository.save(user);
        tokenRepository.save(token);
    }


    private void checkUserEmail(final String email) {
        final boolean emailExists = this.userRepository.existsByEmailIgnoreCase(email);
        if (emailExists) {
            throw new BusinessException(EMAIL_ALREADY_EXISTS);
        }
    }

    private void checkPasswords(final String password,
                                final String confirmPassword) {
        if (password == null || !password.equals(confirmPassword)) {
            throw new BusinessException(PASSWORD_MISMATCH);
        }
    }

    private void sendActivationEmail(User user) {

        // Remove previous unused token (if exists)
        tokenRepository.findByUserAndValidatedAtIsNull(user)
                .ifPresent(tokenRepository::delete);

        String activationCode = generateActivationCode(6);

        Token token = Token.builder()
                .token(activationCode)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(20))
                .user(user)
                .build();

        tokenRepository.save(token);

        try {
            emailService.sendEmail(
                    user.getEmail(),
                    user.getFirstName(),
                    EmailTemplateName.ACTIVATE_ACCOUNT,
                    null,
                    activationCode,
                    "Activate your Synapse account"
            );
        } catch (MessagingException e) {
            throw new IllegalStateException("Failed to send activation email", e);
        }
    }

    private String generateActivationCode(int length) {
        String characters = "0123456789";
        StringBuilder codeBuilder = new StringBuilder();
        SecureRandom secureRandom = new SecureRandom();

        for (int i = 0; i < length; i++) {
            int randomIndex = secureRandom.nextInt(characters.length());
            codeBuilder.append(characters.charAt(randomIndex));
        }

        return codeBuilder.toString();
    }



}
