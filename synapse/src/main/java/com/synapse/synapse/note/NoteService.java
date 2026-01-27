package com.synapse.synapse.note;

import com.synapse.synapse.board.Board;
import com.synapse.synapse.board.BoardRepository;
import com.synapse.synapse.exception.BusinessException;
import com.synapse.synapse.exception.ErrorCode;
import com.synapse.synapse.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class NoteService {

    private final NoteRepository noteRepository;
    private final BoardRepository boardRepository;
    private final NoteMapper noteMapper;
    private final S3Service s3Service;

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

    @Transactional(readOnly = true)
    public NoteResponseDto getNoteById(String boardId, String noteId, User user) {

        // check board ownership
        Board board = boardRepository.findByIdAndOwnerId(boardId, user.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_NOT_FOUND));

        // check note belongs to board and user
        Note note = noteRepository.findByIdAndBoardIdAndAuthorId(noteId, boardId, user.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        return noteMapper.toNoteResponse(note);
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

    public NoteResponseDto patch(
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

        noteMapper.patchEntity(note, dto);
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
        // delete image from S3 first
        s3Service.deleteFile(note.getImageUrl());

        noteRepository.delete(note);
    }

    public NoteResponseDto uploadImage(
            String boardId,
            String noteId,
            MultipartFile file,
            User user
    ) {
        //  Ownership check
        Board board = boardRepository.findByIdAndOwnerId(boardId, user.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_NOT_FOUND));

        //  Note belongs to board + author
        Note note = noteRepository.findByIdAndBoardIdAndAuthorId(
                        noteId,
                        board.getId(),
                        user.getId()
                )
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        try {
            // 🔥 delete old image if exists
            s3Service.deleteFile(note.getImageUrl());
            //  Upload to S3
            String imageUrl = s3Service.uploadFile(file, note.getId());

            //  Persist URL
            note.setImageUrl(imageUrl);

            //  Transactional → auto flush
            return noteMapper.toNoteResponse(note);

        } catch (IOException e) {
            throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED);
        }
    }

    public void deleteImage(
            String boardId,
            String noteId,
            User user
    ) {
        Board board = boardRepository.findByIdAndOwnerId(boardId, user.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_NOT_FOUND));

        Note note = noteRepository.findByIdAndBoardIdAndAuthorId(
                        noteId,
                        board.getId(),
                        user.getId()
                )
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        // 🔥 delete image from S3
        s3Service.deleteFile(note.getImageUrl());

        // 🧼 detach image from note
        note.setImageUrl(null);
    }

}

