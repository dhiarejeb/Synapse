package com.synapse.synapse.link;

import com.synapse.synapse.board.Board;
import com.synapse.synapse.board.BoardRepository;
import com.synapse.synapse.exception.BusinessException;
import com.synapse.synapse.exception.ErrorCode;
import com.synapse.synapse.note.Note;
import com.synapse.synapse.note.NoteRepository;
import com.synapse.synapse.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class LinkServiceImpl implements LinkService {

    private final LinkRepository linkRepository;
    private final BoardRepository boardRepository;
    private final NoteRepository noteRepository;
    private final LinkMapper linkMapper;

    @Override
    @Transactional(readOnly = true)
    public List<LinkResponse> getBoardLinks(String boardId, Authentication authentication) {

        Board board = loadUserBoard(boardId, authentication);

        return linkRepository.findByBoardId(board.getId())
                .stream()
                .map(linkMapper::toResponse)
                .toList();
    }

    @Override
    public LinkResponse createLink(
            String boardId,
            CreateLinkRequest request,
            Authentication authentication
    ) {

        Board board = loadUserBoard(boardId, authentication);

        Note fromNote = loadBoardNote(board, request.getFromNoteId());
        Note toNote = loadBoardNote(board, request.getToNoteId());

        if (fromNote.getId().equals(toNote.getId())) {
            throw new IllegalArgumentException("A link cannot point to the same note");
        }

        Link link = Link.builder()
                .board(board)
                .fromNote(fromNote)
                .toNote(toNote)
                .build();

        return linkMapper.toResponse(linkRepository.save(link));
    }

    @Override
    public void deleteLink(String boardId, String linkId, Authentication authentication) {

        Board board = loadUserBoard(boardId, authentication);

        if (!linkRepository.existsByBoardIdAndId(board.getId(), linkId)) {
            throw new BusinessException(ErrorCode.LINK_NOT_FOUND);
        }

        linkRepository.deleteById(linkId);
    }

    // ===== Helpers =====

    private Board loadUserBoard(String boardId, Authentication authentication) {
        User user = (User) authentication.getPrincipal();

        return boardRepository.findByIdAndOwnerId(boardId, user.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_NOT_FOUND));
    }

    private Note loadBoardNote(Board board, String noteId) {
        return noteRepository.findByIdAndBoardId(noteId, board.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));
    }

    @Override
    public LinkResponse patchLink(
            String boardId,
            String linkId,
            UpdateLinkRequest request,
            Authentication authentication
    ) {
        Board board = loadUserBoard(boardId, authentication);

        Link link = linkRepository.findByIdAndBoardId(linkId, board.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.LINK_NOT_FOUND));

        // Only update if provided
        if (request.getFromNoteId() != null) {
            Note fromNote = loadBoardNote(board, request.getFromNoteId());
            link.setFromNote(fromNote);
        }

        if (request.getToNoteId() != null) {
            Note toNote = loadBoardNote(board, request.getToNoteId());
            link.setToNote(toNote);
        }

        if (link.getFromNote().getId().equals(link.getToNote().getId())) {
            throw new IllegalArgumentException("A link cannot point to the same note");
        }

        return linkMapper.toResponse(linkRepository.save(link));
    }

    @Transactional()
    public LinkResponse getLinkById(String boardId, String linkId, User user) {

        // check board ownership
        Board board = boardRepository.findByIdAndOwnerId(boardId, user.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_NOT_FOUND));

        // check link belongs to board
        Link link = linkRepository.findByIdAndBoardId(linkId, boardId)
                .orElseThrow(() -> new BusinessException(ErrorCode.LINK_NOT_FOUND));

        return linkMapper.toResponse(link);
    }



}

