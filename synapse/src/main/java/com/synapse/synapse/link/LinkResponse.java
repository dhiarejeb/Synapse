package com.synapse.synapse.link;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class LinkResponse {

    private String id;
    private String boardId;
    private String fromNoteId;
    private String toNoteId;
    private LocalDateTime createdDate;
}

