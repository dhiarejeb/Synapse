package com.synapse.synapse.link;

import com.synapse.synapse.board.Board;
import com.synapse.synapse.common.BaseEntity;
import com.synapse.synapse.note.Note;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "links")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Link extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_note_id", nullable = false)
    private Note fromNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_note_id", nullable = false)
    private Note toNote;
}

