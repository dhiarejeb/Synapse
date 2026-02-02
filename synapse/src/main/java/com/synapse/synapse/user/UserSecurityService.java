package com.synapse.synapse.user;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service("userSecurityService")
@RequiredArgsConstructor
public class UserSecurityService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public boolean isCurrentUser(String userId) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            return false;
        }

        return user.getId().equals(userId);
    }
}
