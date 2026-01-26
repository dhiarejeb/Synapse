package com.synapse.synapse.note;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoteRequestDto {

    @NotBlank
    private String title;

    private String content;

    private String imageUrl;

    private String color;

    private Double positionX;

    private Double positionY;

    private Boolean pinned;
}

