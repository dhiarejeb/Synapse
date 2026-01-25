package com.synapse.synapse.board;

import com.synapse.synapse.board.request.BoardRequestDto;
import com.synapse.synapse.board.request.BoardResponseDto;
import com.synapse.synapse.exception.BusinessException;
import com.synapse.synapse.exception.ErrorCode;
import com.synapse.synapse.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class BoardService {

    private final BoardRepository boardRepository;
    private final BoardMapper boardMapper;

    @Transactional(readOnly = true)
    public List<BoardResponseDto> getMyBoards(User user) {
        return boardRepository.findAllByOwnerId(user.getId())
                .stream()
                .map(boardMapper::toDto)
                .toList();
    }

    public BoardResponseDto create(BoardRequestDto dto, User user) {
        Board board = boardMapper.toEntity(dto, user);
        return boardMapper.toDto(boardRepository.save(board));
    }

    @Transactional(readOnly = true)
    public BoardResponseDto getById(String id, User user) {
        Board board = boardRepository.findByIdAndOwnerId(id, user.getId())
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.BOARD_NOT_FOUND)
                );
        return boardMapper.toDto(board);
    }

    public BoardResponseDto update(String id, BoardRequestDto dto, User user) {
        Board board = boardRepository.findByIdAndOwnerId(id, user.getId())
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.BOARD_NOT_FOUND)
                );

        boardMapper.updateEntity(board, dto);
        return boardMapper.toDto(board);
    }

    public void delete(String id, User user) {
        Board board = boardRepository.findByIdAndOwnerId(id, user.getId())
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.BOARD_NOT_FOUND)
                );

        board.setArchived(true); // soft delete
    }
}

