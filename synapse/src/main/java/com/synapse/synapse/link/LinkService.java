package com.synapse.synapse.link;

import org.springframework.security.core.Authentication;

import java.util.List;

public interface LinkService {

    List<LinkResponse> getBoardLinks(String boardId, Authentication authentication);

    LinkResponse createLink(
            String boardId,
            CreateLinkRequest request,
            Authentication authentication
    );

    void deleteLink(String boardId, String linkId, Authentication authentication);
}

