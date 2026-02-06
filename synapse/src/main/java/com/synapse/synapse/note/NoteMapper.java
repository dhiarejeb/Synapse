package com.synapse.synapse.note;

import com.synapse.synapse.board.Board;
import com.synapse.synapse.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NoteMapper {
    private final S3Service s3Service;

    public Note toEntity(NoteRequestDto dto, Board board, User author) {
        return Note.builder()
                //.title(dto.getTitle())
                .content(dto.getContent())
                .color(dto.getColor())
                .positionX(dto.getPositionX())
                .positionY(dto.getPositionY())
                .noteType(NoteType.fromString(dto.getNoteType()))
                .width(dto.getWidth())
                .height(dto.getHeight())
                //.pinned(dto.getPinned())
                .board(board)
                .author(author)
                .build();
    }

    public void updateEntity(Note note, NoteRequestDto dto) {
        //note.setTitle(dto.getTitle());
        note.setContent(dto.getContent());
        note.setColor(dto.getColor());
        note.setPositionX(dto.getPositionX());
        note.setPositionY(dto.getPositionY());
        note.setNoteType(NoteType.fromString(dto.getNoteType()));
        note.setWidth(dto.getWidth());
        note.setHeight(dto.getHeight());
        //note.setPinned(dto.getPinned());
    }

    public void patchEntity(Note note, NoteRequestDto dto) {
        //if (dto.getTitle() != null) note.setTitle(dto.getTitle());
        if (dto.getContent() != null) note.setContent(dto.getContent());
        if (dto.getColor() != null) note.setColor(dto.getColor());
        if (dto.getPositionX() != null) note.setPositionX(dto.getPositionX());
        if (dto.getPositionY() != null) note.setPositionY(dto.getPositionY());
        if (dto.getNoteType() != null)
            note.setNoteType(NoteType.fromString(dto.getNoteType()));
        if (dto.getWidth() != null) note.setWidth(dto.getWidth());
        if (dto.getHeight() != null) note.setHeight(dto.getHeight());
        //if (dto.getPinned() != null) note.setPinned(dto.getPinned());
    }




    public NoteResponseDto toNoteResponse(Note note) {
        String presignedUrl = null;

        if (note.getImageUrl() != null) {
            presignedUrl = s3Service.getPresignedUrl(note.getImageUrl());
        }

        return NoteResponseDto.builder()
                .id(note.getId())
                //.title(note.getTitle())
                .content(note.getContent())
                .imageUrl(presignedUrl) // use presigned URL here
                .color(note.getColor())
                .positionX(note.getPositionX())
                .positionY(note.getPositionY())
                .noteType(note.getNoteType().toApiValue())
                .width(note.getWidth())
                .height(note.getHeight())
                //.pinned(note.isPinned())
                .createdDate(note.getCreatedDate())
                .build();
    }
}

