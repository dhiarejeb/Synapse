package com.synapse.synapse.link;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateLinkRequest {

    @NotBlank
    private String fromNoteId;

    @NotBlank
    private String toNoteId;
}

