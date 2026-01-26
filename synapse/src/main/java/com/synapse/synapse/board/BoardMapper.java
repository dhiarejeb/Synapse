package com.synapse.synapse.board;

import com.synapse.synapse.board.request.BoardRequestDto;
import com.synapse.synapse.board.request.BoardResponseDto;
import com.synapse.synapse.user.User;
import org.springframework.stereotype.Component;

@Component
public class BoardMapper {

    public Board toEntity(BoardRequestDto dto, User owner) {
        return Board.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .color(dto.getColor())
                .owner(owner)
                .archived(false)
                .build();
    }

    public void updateEntity(Board board, BoardRequestDto dto) {
        board.setName(dto.getName());
        board.setDescription(dto.getDescription());
        board.setColor(dto.getColor());
    }

    public void patchEntity(Board board, BoardRequestDto dto) {

        if (dto.getName() != null) {
            board.setName(dto.getName());
        }

        if (dto.getDescription() != null) {
            board.setDescription(dto.getDescription());
        }

        if (dto.getColor() != null) {
            board.setColor(dto.getColor());
        }
    }


    public BoardResponseDto toDto(Board board) {
        return BoardResponseDto.builder()
                .id(board.getId())
                .name(board.getName())
                .description(board.getDescription())
                .color(board.getColor())
                .archived(board.isArchived())
                .createdDate(board.getCreatedDate())
                .build();
    }
}
