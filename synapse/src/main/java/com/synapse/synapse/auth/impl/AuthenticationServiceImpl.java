package com.synapse.synapse.auth.impl;

import com.synapse.synapse.auth.AuthenticationService;
import com.synapse.synapse.auth.request.AuthenticationRequest;
import com.synapse.synapse.auth.request.RefreshRequest;
import com.synapse.synapse.auth.request.RegistrationRequest;
import com.synapse.synapse.auth.response.AuthenticationResponse;
import com.synapse.synapse.exception.BusinessException;
import com.synapse.synapse.role.Role;
import com.synapse.synapse.role.RoleRepository;
import com.synapse.synapse.security.JwtService;
import com.synapse.synapse.user.User;
import com.synapse.synapse.user.UserMapper;
import com.synapse.synapse.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;


import static com.synapse.synapse.exception.ErrorCode.EMAIL_ALREADY_EXISTS;
import static com.synapse.synapse.exception.ErrorCode.PASSWORD_MISMATCH;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationServiceImpl implements AuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;

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

        final Role userRole = this.roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new EntityNotFoundException("Role user does not exist"));
        final List<Role> roles = new ArrayList<>();
        roles.add(userRole);

        final User user = this.userMapper.toUser(request);
        user.setRoles(roles);
        log.debug("Saving user {}", user);
        this.userRepository.save(user);

        final List<User> users = new ArrayList<>();
        users.add(user);
        userRole.setUsers(users);

        this.roleRepository.save(userRole);

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


}
