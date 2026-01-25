package com.synapse.synapse.note;

import com.synapse.synapse.board.Board;
import com.synapse.synapse.board.BoardRepository;
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
public class NoteService {

    private final NoteRepository noteRepository;
    private final BoardRepository boardRepository;
    private final NoteMapper noteMapper;

    @Transactional(readOnly = true)
    public List<NoteResponseDto> getNotes(String boardId, User user) {
        Board board = boardRepository.findByIdAndOwnerId(boardId, user.getId())
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.BOARD_NOT_FOUND)
                );

        return noteRepository.findAllByBoardId(board.getId())
                .stream()
                .map(noteMapper::toNoteResponse)
                .toList();
    }

    public NoteResponseDto create(
            String boardId,
            NoteRequestDto dto,
            User user
    ) {
        Board board = boardRepository.findByIdAndOwnerId(boardId, user.getId())
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.BOARD_NOT_FOUND)
                );

        Note note = noteMapper.toEntity(dto, board, user);
        return noteMapper.toNoteResponse(noteRepository.save(note));
    }

    public NoteResponseDto update(
            String boardId,
            String noteId,
            NoteRequestDto dto,
            User user
    ) {
        Board board = boardRepository.findByIdAndOwnerId(boardId, user.getId())
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.BOARD_NOT_FOUND)
                );

        Note note = noteRepository.findByIdAndBoardId(noteId, board.getId())
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.NOTE_NOT_FOUND)
                );

        noteMapper.updateEntity(note, dto);
        return noteMapper.toNoteResponse(note);
    }

    public void delete(String boardId, String noteId, User user) {
        Board board = boardRepository.findByIdAndOwnerId(boardId, user.getId())
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.BOARD_NOT_FOUND)
                );

        Note note = noteRepository.findByIdAndBoardId(noteId, board.getId())
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.NOTE_NOT_FOUND)
                );

        noteRepository.delete(note);
    }
}

