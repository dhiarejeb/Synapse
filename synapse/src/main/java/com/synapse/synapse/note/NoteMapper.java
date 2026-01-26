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
                .pinned(dto.getPinned())
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
        note.setPinned(dto.getPinned());
    }

    public void patchEntity(Note note, NoteRequestDto dto) {
        if (dto.getTitle() != null) note.setTitle(dto.getTitle());
        if (dto.getContent() != null) note.setContent(dto.getContent());
        if (dto.getImageUrl() != null) note.setImageUrl(dto.getImageUrl());
        if (dto.getColor() != null) note.setColor(dto.getColor());
        if (dto.getPositionX() != null) note.setPositionX(dto.getPositionX());
        if (dto.getPositionY() != null) note.setPositionY(dto.getPositionY());
        if (dto.getPinned() != null) note.setPinned(dto.getPinned());
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

