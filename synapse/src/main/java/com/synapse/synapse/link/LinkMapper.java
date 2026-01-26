package com.synapse.synapse.link;

import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class LinkMapper {

    public LinkResponse toResponse(Link link) {
        return LinkResponse.builder()
                .id(link.getId())
                .boardId(link.getBoard().getId())
                .fromNoteId(link.getFromNote().getId())
                .toNoteId(link.getToNote().getId())
                .createdDate(link.getCreatedDate())
                .build();
    }
}

