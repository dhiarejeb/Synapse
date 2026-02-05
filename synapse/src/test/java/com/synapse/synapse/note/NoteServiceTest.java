package com.synapse.synapse.note;

import com.synapse.synapse.board.Board;
import com.synapse.synapse.board.BoardRepository;
import com.synapse.synapse.exception.BusinessException;
import com.synapse.synapse.exception.ErrorCode;
import com.synapse.synapse.link.LinkRepository;
import com.synapse.synapse.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NoteService Unit Tests")
class NoteServiceTest {

    // =========================
    // Mocked dependencies
    // =========================

    @Mock
    private NoteRepository noteRepository;

    @Mock
    private BoardRepository boardRepository;

    @Mock
    private NoteMapper noteMapper;

    // =========================
    // Service under test
    // =========================

    @InjectMocks
    private NoteService noteService;

    // =========================
    // Test data
    // =========================

    private User testUser;
    private Board testBoard;
    private Note testNote;
    private NoteRequestDto noteRequestDto;
    private NoteResponseDto noteResponseDto;
    private LinkRepository  linkRepository;

    @BeforeEach
    void setUp() {

        // Simulated authenticated user
        this.testUser = User.builder()
                .id("user-123")
                .email("user@test.com")
                .firstName("John")
                .lastName("Doe")
                .build();

        // Board owned by the user
        this.testBoard = Board.builder()
                .id("board-123")
                .name("My Board")
                .owner(testUser)

                .build();

        // Existing note entity
        this.testNote = Note.builder()
                .id("note-123")

                .content("Note content")
                .color("#FFFFFF")

                .board(testBoard)
                .author(testUser)
                .build();

        // Request DTO (used for create/update)
        this.noteRequestDto = NoteRequestDto.builder()

                .content("New content")
                .color("#000000")

                .build();

        // Expected response DTO
        this.noteResponseDto = NoteResponseDto.builder()
                .id("note-123")

                .content("Note content")
                .color("#FFFFFF")

                .createdDate(LocalDateTime.now())
                .build();
    }

    // ======================================================
    // Get Notes Tests
    // ======================================================

    @Nested
    @DisplayName("Get Notes Tests")
    class GetNotesTests {

        @Test
        @DisplayName("Should return notes for board owned by user")
        void shouldReturnNotesForBoard() {
            // Given
            // Board ownership check
            when(boardRepository.findByIdAndOwnerId("board-123", testUser.getId()))
                    .thenReturn(Optional.of(testBoard));

            // Notes belonging to the board
            when(noteRepository.findAllByBoardId(testBoard.getId()))
                    .thenReturn(List.of(testNote));

            when(noteMapper.toNoteResponse(testNote))
                    .thenReturn(noteResponseDto);

            // When
            List<NoteResponseDto> result = noteService.getNotes("board-123", testUser);

            // Then
            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals(noteResponseDto, result.get(0));

            verify(boardRepository).findByIdAndOwnerId("board-123", testUser.getId());
            verify(noteRepository).findAllByBoardId(testBoard.getId());
            verify(noteMapper).toNoteResponse(testNote);
        }

        @Test
        @DisplayName("Should throw BOARD_NOT_FOUND when board does not exist")
        void shouldThrowWhenBoardNotFound() {
            // Given
            when(boardRepository.findByIdAndOwnerId("board-123", testUser.getId()))
                    .thenReturn(Optional.empty());

            // When & Then
            BusinessException exception = assertThrows(
                    BusinessException.class,
                    () -> noteService.getNotes("board-123", testUser)
            );

            assertEquals(ErrorCode.BOARD_NOT_FOUND, exception.getErrorCode());

            verify(boardRepository).findByIdAndOwnerId("board-123", testUser.getId());
            verifyNoInteractions(noteRepository);
            verifyNoInteractions(noteMapper);
        }
    }

    // ======================================================
    // Get Note By Id Tests
    // ======================================================

    @Nested
    @DisplayName("Get Note By Id Tests")
    class GetNoteByIdTests {

        @Test
        @DisplayName("Should return note when board and note exist and owned by user")
        void shouldReturnNote() {
            // Given
            when(boardRepository.findByIdAndOwnerId("board-123", testUser.getId()))
                    .thenReturn(Optional.of(testBoard));

            when(noteRepository.findByIdAndBoardIdAndAuthorId(
                    "note-123", "board-123", testUser.getId()))
                    .thenReturn(Optional.of(testNote));

            when(noteMapper.toNoteResponse(testNote))
                    .thenReturn(noteResponseDto);

            // When
            NoteResponseDto result =
                    noteService.getNoteById("board-123", "note-123", testUser);

            // Then
            assertNotNull(result);
            assertEquals(noteResponseDto, result);

            verify(boardRepository).findByIdAndOwnerId("board-123", testUser.getId());
            verify(noteRepository).findByIdAndBoardIdAndAuthorId(
                    "note-123", "board-123", testUser.getId());
            verify(noteMapper).toNoteResponse(testNote);
        }

        @Test
        @DisplayName("Should throw NOTE_NOT_FOUND when note does not exist")
        void shouldThrowWhenNoteNotFound() {
            // Given
            when(boardRepository.findByIdAndOwnerId("board-123", testUser.getId()))
                    .thenReturn(Optional.of(testBoard));

            when(noteRepository.findByIdAndBoardIdAndAuthorId(
                    "note-123", "board-123", testUser.getId()))
                    .thenReturn(Optional.empty());

            // When & Then
            BusinessException exception = assertThrows(
                    BusinessException.class,
                    () -> noteService.getNoteById("board-123", "note-123", testUser)
            );

            assertEquals(ErrorCode.NOTE_NOT_FOUND, exception.getErrorCode());

            verify(noteRepository).findByIdAndBoardIdAndAuthorId(
                    "note-123", "board-123", testUser.getId());
            verifyNoInteractions(noteMapper);
        }
    }

    // ======================================================
    // Create Note Tests
    // ======================================================

    @Nested
    @DisplayName("Create Note Tests")
    class CreateNoteTests {

        @Test
        @DisplayName("Should create note successfully")
        void shouldCreateNoteSuccessfully() {
            // Given
            when(boardRepository.findByIdAndOwnerId("board-123", testUser.getId()))
                    .thenReturn(Optional.of(testBoard));

            when(noteMapper.toEntity(noteRequestDto, testBoard, testUser))
                    .thenReturn(testNote);

            when(noteRepository.save(testNote))
                    .thenReturn(testNote);

            when(noteMapper.toNoteResponse(testNote))
                    .thenReturn(noteResponseDto);

            // When
            NoteResponseDto result =
                    noteService.create("board-123", noteRequestDto, testUser);

            // Then
            assertNotNull(result);
            assertEquals(noteResponseDto, result);

            verify(noteMapper).toEntity(noteRequestDto, testBoard, testUser);
            verify(noteRepository).save(testNote);
            verify(noteMapper).toNoteResponse(testNote);
        }
    }

    // ======================================================
    // Update Note Tests
    // ======================================================

    @Nested
    @DisplayName("Update Note Tests")
    class UpdateNoteTests {

        @Test
        @DisplayName("Should update note successfully")
        void shouldUpdateNoteSuccessfully() {
            // Given
            when(boardRepository.findByIdAndOwnerId("board-123", testUser.getId()))
                    .thenReturn(Optional.of(testBoard));

            when(noteRepository.findByIdAndBoardId("note-123", testBoard.getId()))
                    .thenReturn(Optional.of(testNote));

            when(noteMapper.toNoteResponse(testNote))
                    .thenReturn(noteResponseDto);

            // When
            NoteResponseDto result =
                    noteService.update("board-123", "note-123", noteRequestDto, testUser);

            // Then
            assertNotNull(result);

            // updateEntity mutates the existing note (no save required)
            verify(noteMapper).updateEntity(testNote, noteRequestDto);
            verify(noteMapper).toNoteResponse(testNote);
        }
    }

    // ======================================================
    // Patch Note Tests
    // ======================================================

    @Nested
    @DisplayName("Patch Note Tests")
    class PatchNoteTests {

        @Test
        @DisplayName("Should patch note partially")
        void shouldPatchNote() {
            // Given
            NoteRequestDto patchDto = NoteRequestDto.builder()

                    .build();

            when(boardRepository.findByIdAndOwnerId("board-123", testUser.getId()))
                    .thenReturn(Optional.of(testBoard));

            when(noteRepository.findByIdAndBoardId("note-123", testBoard.getId()))
                    .thenReturn(Optional.of(testNote));

            when(noteMapper.toNoteResponse(testNote))
                    .thenReturn(noteResponseDto);

            // When
            NoteResponseDto result =
                    noteService.patch("board-123", "note-123", patchDto, testUser);

            // Then
            assertNotNull(result);

            verify(noteMapper).patchEntity(testNote, patchDto);
            verify(noteMapper).toNoteResponse(testNote);
        }
    }

    // ======================================================
    // Delete Note Tests
    // ======================================================

    /*@Nested
    @DisplayName("Delete Note Tests")
    class DeleteNoteTests {

        @Test
        @DisplayName("Should delete note successfully")
        void shouldDeleteNote() {
            // Given
            when(boardRepository.findByIdAndOwnerId("board-123", testUser.getId()))
                    .thenReturn(Optional.of(testBoard));

            when(noteRepository.findByIdAndBoardId("note-123", testBoard.getId()))
                    .thenReturn(Optional.of(testNote));

            // When
            noteService.delete("board-123", "note-123", testUser);

            // Then
            verify(noteRepository).delete(testNote);
        }
    }*/
}

