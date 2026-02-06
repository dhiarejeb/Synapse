package com.synapse.synapse.note;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoteRequestDto {




    private String content;

    //private String imageUrl; image upload has different endpoint with s3

    private String color;

    private Double positionX;

    private Double positionY;

    private String noteType;
    private Double width;
    private Double height;


}

