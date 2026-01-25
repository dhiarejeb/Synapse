package com.synapse.synapse.note;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoteResponseDto {

    private String id;
    private String title;
    private String content;
    private String imageUrl;
    private String color;
    private Double positionX;
    private Double positionY;
    private boolean pinned;
    private LocalDateTime createdDate;
}

