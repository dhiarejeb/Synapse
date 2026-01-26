package com.synapse.synapse.link;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateLinkRequest {
    private String fromNoteId;
    private String toNoteId;
}
