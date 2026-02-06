package com.synapse.synapse.board.request;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardResponseDto {

    private String id;
    private String name;
    private String description;

    private LocalDateTime createdDate;
}

