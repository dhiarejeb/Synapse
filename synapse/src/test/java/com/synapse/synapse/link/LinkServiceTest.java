package com.synapse.synapse.link;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;

import com.synapse.synapse.board.Board;
import com.synapse.synapse.board.BoardRepository;
import com.synapse.synapse.exception.BusinessException;
import com.synapse.synapse.note.Note;
import com.synapse.synapse.note.NoteRepository;
import com.synapse.synapse.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

@ExtendWith(MockitoExtension.class)
class LinkServiceTest {

    @InjectMocks
    private LinkServiceImpl linkService;

    @Mock
    private LinkRepository linkRepository;
    @Mock
    private BoardRepository boardRepository;
    @Mock
    private NoteRepository noteRepository;
    @Mock
    private LinkMapper linkMapper;
    @Mock
    private Authentication authentication;
    @Mock
    private User user;

    private Board board;
    private Note fromNote;
    private Note toNote;
    private Link link;

    @BeforeEach
    void setUp() {
        when(user.getId()).thenReturn("user-1");

        board = Board.builder()
                .id("board-1")
                .owner(user)
                .build();

        fromNote = Note.builder()
                .id("note-1")
                .board(board)
                .build();

        toNote = Note.builder()
                .id("note-2")
                .board(board)
                .build();

        link = Link.builder()
                .id("link-1")
                .board(board)
                .fromNote(fromNote)
                .toNote(toNote)
                .build();
    }

    // ================= getBoardLinks =================

    @Test
    void getBoardLinks_success() {
        when(authentication.getPrincipal()).thenReturn(user);

        when(boardRepository.findByIdAndOwnerId("board-1", "user-1"))
                .thenReturn(Optional.of(board));

        when(linkRepository.findByBoardId("board-1"))
                .thenReturn(List.of(link));

        when(linkMapper.toResponse(link))
                .thenReturn(LinkResponse.builder().id("link-1").build());

        List<LinkResponse> result =
                linkService.getBoardLinks("board-1", authentication);

        assertEquals(1, result.size());
    }

    // ================= createLink =================

    @Test
    void createLink_success() {
        when(authentication.getPrincipal()).thenReturn(user);

        CreateLinkRequest request = new CreateLinkRequest();
        request.setFromNoteId("note-1");
        request.setToNoteId("note-2");

        when(boardRepository.findByIdAndOwnerId("board-1", "user-1"))
                .thenReturn(Optional.of(board));

        when(noteRepository.findByIdAndBoardId("note-1", "board-1"))
                .thenReturn(Optional.of(fromNote));

        when(noteRepository.findByIdAndBoardId("note-2", "board-1"))
                .thenReturn(Optional.of(toNote));

        when(linkRepository.save(any(Link.class)))
                .thenReturn(link);

        when(linkMapper.toResponse(any(Link.class)))
                .thenReturn(LinkResponse.builder().id("link-1").build());

        LinkResponse result =
                linkService.createLink("board-1", request, authentication);

        assertNotNull(result);
    }

    @Test
    void createLink_sameNote_throwsException() {
        when(authentication.getPrincipal()).thenReturn(user);

        CreateLinkRequest request = new CreateLinkRequest();
        request.setFromNoteId("note-1");
        request.setToNoteId("note-1");

        when(boardRepository.findByIdAndOwnerId("board-1", "user-1"))
                .thenReturn(Optional.of(board));

        when(noteRepository.findByIdAndBoardId("note-1", "board-1"))
                .thenReturn(Optional.of(fromNote));

        assertThrows(IllegalArgumentException.class, () ->
                linkService.createLink("board-1", request, authentication)
        );
    }

    // ================= patchLink =================

    @Test
    void patchLink_success() {
        when(authentication.getPrincipal()).thenReturn(user);

        UpdateLinkRequest request = new UpdateLinkRequest();
        request.setToNoteId("note-2");

        when(boardRepository.findByIdAndOwnerId("board-1", "user-1"))
                .thenReturn(Optional.of(board));

        when(linkRepository.findByIdAndBoardId("link-1", "board-1"))
                .thenReturn(Optional.of(link));

        when(noteRepository.findByIdAndBoardId("note-2", "board-1"))
                .thenReturn(Optional.of(toNote));

        when(linkMapper.toResponse(link))
                .thenReturn(LinkResponse.builder().id("link-1").build());
        when(linkRepository.save(link)).thenReturn(link);

        LinkResponse result =
                linkService.patchLink("board-1", "link-1", request, authentication);

        assertEquals("link-1", result.getId());
    }

    // ================= deleteLink =================

    @Test
    void deleteLink_success() {
        when(authentication.getPrincipal()).thenReturn(user);

        when(boardRepository.findByIdAndOwnerId("board-1", "user-1"))
                .thenReturn(Optional.of(board));

        when(linkRepository.existsByBoardIdAndId("board-1", "link-1"))
                .thenReturn(true);

        linkService.deleteLink("board-1", "link-1", authentication);

        verify(linkRepository).deleteById("link-1");
    }

    @Test
    void deleteLink_notFound() {
        when(authentication.getPrincipal()).thenReturn(user);

        when(boardRepository.findByIdAndOwnerId("board-1", "user-1"))
                .thenReturn(Optional.of(board));

        when(linkRepository.existsByBoardIdAndId("board-1", "link-1"))
                .thenReturn(false);

        assertThrows(BusinessException.class, () ->
                linkService.deleteLink("board-1", "link-1", authentication)
        );
    }

    // ================= getLinkById =================
    // (no Authentication here → NO principal stub needed)

    @Test
    void getLinkById_success() {
        when(boardRepository.findByIdAndOwnerId("board-1", "user-1"))
                .thenReturn(Optional.of(board));

        when(linkRepository.findByIdAndBoardId("link-1", "board-1"))
                .thenReturn(Optional.of(link));

        when(linkMapper.toResponse(link))
                .thenReturn(LinkResponse.builder().id("link-1").build());

        LinkResponse result =
                linkService.getLinkById("board-1", "link-1", user);

        assertEquals("link-1", result.getId());
    }
}


