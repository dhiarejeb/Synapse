package com.synapse.synapse.board;

import com.synapse.synapse.board.request.BoardRequestDto;
import com.synapse.synapse.board.request.BoardResponseDto;
import com.synapse.synapse.exception.BusinessException;
import com.synapse.synapse.exception.ErrorCode;
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
@DisplayName("BoardService Unit Tests")
class BoardServiceTest {

    // =========================
    // Mocked dependencies
    // =========================

    @Mock
    private BoardRepository boardRepository;

    @Mock
    private BoardMapper boardMapper;

    // =========================
    // Service under test
    // =========================

    @InjectMocks
    private BoardService boardService;

    // =========================
    // Test data
    // =========================

    private User testUser;
    private Board testBoard;
    private BoardRequestDto boardRequestDto;
    private BoardResponseDto boardResponseDto;

    @BeforeEach
    void setUp() {

        // Simulated authenticated user
        this.testUser = User.builder()
                .id("user-123")
                .email("user@test.com")
                .build();

        // Existing board entity (as if loaded from DB)
        this.testBoard = Board.builder()
                .id("board-123")
                .name("My Board")
                .description("Board description")
                .color("#FFFFFF")
                .archived(false)
                .owner(testUser)
                .build();

        // Request DTO coming from controller
        this.boardRequestDto = BoardRequestDto.builder()
                .name("New Board")
                .description("New description")
                .color("#000000")
                .build();

        // Expected response DTO
        this.boardResponseDto = BoardResponseDto.builder()
                .id("board-123")
                .name("My Board")
                .description("Board description")
                .color("#FFFFFF")
                .archived(false)
                .createdDate(LocalDateTime.now())
                .build();
    }

    // ======================================================
    // Get My Boards Tests
    // ======================================================

    @Nested
    @DisplayName("Get My Boards Tests")
    class GetMyBoardsTests {

        @Test
        @DisplayName("Should return list of boards owned by user")
        void shouldReturnBoardsOwnedByUser() {
            // Given
            when(boardRepository.findAllByOwnerId(testUser.getId()))
                    .thenReturn(List.of(testBoard));
            when(boardMapper.toDto(testBoard))
                    .thenReturn(boardResponseDto);

            // When
            List<BoardResponseDto> result = boardService.getMyBoards(testUser);

            // Then
            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals(boardResponseDto, result.get(0));

            verify(boardRepository).findAllByOwnerId(testUser.getId());
            verify(boardMapper).toDto(testBoard);
        }

        @Test
        @DisplayName("Should return empty list when user has no boards")
        void shouldReturnEmptyList() {
            // Given
            when(boardRepository.findAllByOwnerId(testUser.getId()))
                    .thenReturn(List.of());

            // When
            List<BoardResponseDto> result = boardService.getMyBoards(testUser);

            // Then
            assertNotNull(result);
            assertTrue(result.isEmpty());

            verify(boardRepository).findAllByOwnerId(testUser.getId());
            verifyNoInteractions(boardMapper);
        }
    }

    // ======================================================
    // Create Board Tests
    // ======================================================

    @Nested
    @DisplayName("Create Board Tests")
    class CreateBoardTests {

        @Test
        @DisplayName("Should create board successfully")
        void shouldCreateBoardSuccessfully() {
            // Given
            when(boardMapper.toEntity(boardRequestDto, testUser))
                    .thenReturn(testBoard);
            when(boardRepository.save(testBoard))
                    .thenReturn(testBoard);
            when(boardMapper.toDto(testBoard))
                    .thenReturn(boardResponseDto);

            // When
            BoardResponseDto result = boardService.create(boardRequestDto, testUser);

            // Then
            assertNotNull(result);
            assertEquals(boardResponseDto, result);

            verify(boardMapper).toEntity(boardRequestDto, testUser);
            verify(boardRepository).save(testBoard);
            verify(boardMapper).toDto(testBoard);
        }
    }

    // ======================================================
    // Get Board By Id Tests
    // ======================================================

    @Nested
    @DisplayName("Get Board By Id Tests")
    class GetBoardByIdTests {

        @Test
        @DisplayName("Should return board when found and owned by user")
        void shouldReturnBoardWhenFound() {
            // Given
            when(boardRepository.findByIdAndOwnerId("board-123", testUser.getId()))
                    .thenReturn(Optional.of(testBoard));
            when(boardMapper.toDto(testBoard))
                    .thenReturn(boardResponseDto);

            // When
            BoardResponseDto result = boardService.getById("board-123", testUser);

            // Then
            assertNotNull(result);
            assertEquals(boardResponseDto, result);

            verify(boardRepository).findByIdAndOwnerId("board-123", testUser.getId());
            verify(boardMapper).toDto(testBoard);
        }

        @Test
        @DisplayName("Should throw BusinessException when board not found")
        void shouldThrowWhenBoardNotFound() {
            // Given
            when(boardRepository.findByIdAndOwnerId("board-123", testUser.getId()))
                    .thenReturn(Optional.empty());

            // When & Then
            BusinessException exception = assertThrows(
                    BusinessException.class,
                    () -> boardService.getById("board-123", testUser)
            );

            assertEquals(ErrorCode.BOARD_NOT_FOUND, exception.getErrorCode());

            verify(boardRepository).findByIdAndOwnerId("board-123", testUser.getId());
            verifyNoInteractions(boardMapper);
        }
    }

    // ======================================================
    // Update Board Tests
    // ======================================================

    @Nested
    @DisplayName("Update Board Tests")
    class UpdateBoardTests {

        @Test
        @DisplayName("Should update board successfully")
        void shouldUpdateBoardSuccessfully() {
            // Given
            when(boardRepository.findByIdAndOwnerId("board-123", testUser.getId()))
                    .thenReturn(Optional.of(testBoard));
            when(boardMapper.toDto(testBoard))
                    .thenReturn(boardResponseDto);

            // When
            BoardResponseDto result = boardService.update("board-123", boardRequestDto, testUser);

            // Then
            assertNotNull(result);

            // updateEntity modifies the existing entity (no save needed)
            verify(boardMapper).updateEntity(testBoard, boardRequestDto);
            verify(boardMapper).toDto(testBoard);
            verify(boardRepository).findByIdAndOwnerId("board-123", testUser.getId());
        }
    }

    // ======================================================
    // Patch Board Tests
    // ======================================================

    @Nested
    @DisplayName("Patch Board Tests")
    class PatchBoardTests {

        @Test
        @DisplayName("Should patch board partially")
        void shouldPatchBoard() {
            // Given
            BoardRequestDto patchDto = BoardRequestDto.builder()
                    .name("Updated Name")
                    .build();

            when(boardRepository.findByIdAndOwnerId("board-123", testUser.getId()))
                    .thenReturn(Optional.of(testBoard));
            when(boardMapper.toDto(testBoard))
                    .thenReturn(boardResponseDto);

            // When
            BoardResponseDto result = boardService.patch("board-123", patchDto, testUser);

            // Then
            assertNotNull(result);

            verify(boardMapper).patchEntity(testBoard, patchDto);
            verify(boardMapper).toDto(testBoard);
        }
    }

    // ======================================================
    // Delete Board Tests
    // ======================================================

    @Nested
    @DisplayName("Delete Board Tests")
    class DeleteBoardTests {

        @Test
        @DisplayName("Should soft delete board")
        void shouldSoftDeleteBoard() {
            // Given
            when(boardRepository.findByIdAndOwnerId("board-123", testUser.getId()))
                    .thenReturn(Optional.of(testBoard));

            // When
            boardService.delete("board-123", testUser);

            // Then
            assertTrue(testBoard.isArchived());

            verify(boardRepository).findByIdAndOwnerId("board-123", testUser.getId());
            verifyNoMoreInteractions(boardRepository);
        }
    }
}


