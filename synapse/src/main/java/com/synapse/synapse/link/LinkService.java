package com.synapse.synapse.link;

import com.synapse.synapse.user.User;
import org.springframework.security.core.Authentication;

import java.util.List;

public interface LinkService {



    List<LinkResponse> getBoardLinks(String boardId, Authentication authentication);
    LinkResponse getLinkById(String boardId, String linkId, User user);

    LinkResponse createLink(
            String boardId,
            CreateLinkRequest request,
            Authentication authentication
    );

    void deleteLink(String boardId, String linkId, Authentication authentication);

    LinkResponse patchLink(
            String boardId,
            String linkId,
            UpdateLinkRequest request,
            Authentication authentication
    );

}

