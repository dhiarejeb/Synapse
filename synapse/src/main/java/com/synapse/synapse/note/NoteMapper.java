package com.synapse.synapse.note;

import com.synapse.synapse.board.Board;
import com.synapse.synapse.user.User;
import org.springframework.stereotype.Component;

@Component
public class NoteMapper {

    public Note toEntity(NoteRequestDto dto, Board board, User author) {
        return Note.builder()
                .title(dto.getTitle())
                .content(dto.getContent())
                .imageUrl(dto.getImageUrl())
                .color(dto.getColor())
                .positionX(dto.getPositionX())
                .positionY(dto.getPositionY())
                .pinned(dto.isPinned())
                .board(board)
                .author(author)
                .build();
    }

    public void updateEntity(Note note, NoteRequestDto dto) {
        note.setTitle(dto.getTitle());
        note.setContent(dto.getContent());
        note.setImageUrl(dto.getImageUrl());
        note.setColor(dto.getColor());
        note.setPositionX(dto.getPositionX());
        note.setPositionY(dto.getPositionY());
        note.setPinned(dto.isPinned());
    }

    public NoteResponseDto toNoteResponse(Note note) {
        return NoteResponseDto.builder()
                .id(note.getId())
                .title(note.getTitle())
                .content(note.getContent())
                .imageUrl(note.getImageUrl())
                .color(note.getColor())
                .positionX(note.getPositionX())
                .positionY(note.getPositionY())
                .pinned(note.isPinned())
                .createdDate(note.getCreatedDate())
                .build();
    }
}

