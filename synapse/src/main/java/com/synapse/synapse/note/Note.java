package com.synapse.synapse.note;

import com.synapse.synapse.board.Board;
import com.synapse.synapse.common.BaseEntity;
import com.synapse.synapse.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "NOTES")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
public class Note extends BaseEntity {

//    @Column(name = "TITLE", nullable = false)
//    private String title;

    @Column(name = "CONTENT", columnDefinition = "TEXT")
    private String content;

    @Column(name = "IMAGE_URL")
    private String imageUrl; //path to S3 uploads

    @Column(name = "COLOR")
    private String color;

    @Column(name = "POSITION_X")
    private Double positionX;

    @Column(name = "POSITION_Y")
    private Double positionY;

//    @Column(name = "IS_PINNED")
//    private boolean pinned = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "BOARD_ID", nullable = false)
    private Board board;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "AUTHOR_ID", nullable = false)
    private User author;
}

