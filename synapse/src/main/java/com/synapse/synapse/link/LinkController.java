package com.synapse.synapse.link;

import com.synapse.synapse.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/boards/{boardId}/links")
@RequiredArgsConstructor
public class LinkController {

    private final LinkService linkService;

    @GetMapping
    public List<LinkResponse> getBoardLinks(
            @PathVariable String boardId,
            Authentication authentication
    ) {
        return linkService.getBoardLinks(boardId, authentication);
    }

    @GetMapping("/{linkId}")
    @PreAuthorize("@linkSecurityService.isLinkOwner(#linkId)")
    public LinkResponse getLinkById(
            @PathVariable String boardId,
            @PathVariable String linkId,
            Authentication authentication
    ) {
        User user = (User) authentication.getPrincipal();
        return linkService.getLinkById(boardId, linkId, user);
    }

    @PostMapping
    public ResponseEntity<LinkResponse> createLink(
            @PathVariable String boardId,
            @RequestBody @Valid CreateLinkRequest request,
            Authentication authentication
    ) {
        LinkResponse response =
                linkService.createLink(boardId, request, authentication);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{linkId}")
    @PreAuthorize("@linkSecurityService.isLinkOwner(#id)")
    public ResponseEntity<Void> deleteLink(
            @PathVariable String boardId,
            @PathVariable String linkId,
            Authentication authentication
    ) {
        linkService.deleteLink(boardId, linkId, authentication);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{linkId}")
    @PreAuthorize("@linkSecurityService.isLinkOwner(#id)")
    public LinkResponse patchLink(
            @PathVariable String boardId,
            @PathVariable String linkId,
            @RequestBody UpdateLinkRequest request,
            Authentication authentication
    ) {
        return linkService.patchLink(boardId, linkId, request, authentication);
    }


}

