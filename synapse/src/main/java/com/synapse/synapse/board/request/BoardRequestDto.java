package com.synapse.synapse.board.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardRequestDto {

    @NotBlank
    private String name;

    private String description;

    //private String color;
}

