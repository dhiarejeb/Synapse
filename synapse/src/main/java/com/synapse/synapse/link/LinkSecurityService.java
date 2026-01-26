package com.synapse.synapse.link;

import com.synapse.synapse.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LinkSecurityService {

    private final LinkRepository LinkRepository;

    @Transactional(readOnly = true)
    public boolean isLinkOwner(final String linkId) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = ((User) authentication.getPrincipal()).getId();

        Link link = LinkRepository.findById(linkId)
                .orElseThrow(() -> new RuntimeException("Link not found"));

        return link.getCreatedBy().equals(userId);
    }
}

