package com.synapse.synapse.board;

import com.synapse.synapse.board.request.BoardRequestDto;
import com.synapse.synapse.board.request.BoardResponseDto;
import com.synapse.synapse.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/boards")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    @GetMapping
    public List<BoardResponseDto> getBoards(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return boardService.getMyBoards(user);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BoardResponseDto create(
            @RequestBody @Valid BoardRequestDto dto,
            Authentication authentication
    ) {
        User user = (User) authentication.getPrincipal();
        return boardService.create(dto, user);
    }

    @GetMapping("/{id}")
    public BoardResponseDto getById(
            @PathVariable String id,
            Authentication authentication
    ) {
        User user = (User) authentication.getPrincipal();
        return boardService.getById(id, user);
    }

    @PutMapping("/{id}")
    public BoardResponseDto update(
            @PathVariable String id,
            @RequestBody @Valid BoardRequestDto dto,
            Authentication authentication
    ) {
        User user = (User) authentication.getPrincipal();
        return boardService.update(id, dto, user);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable String id,
            Authentication authentication
    ) {
        User user = (User) authentication.getPrincipal();
        boardService.delete(id, user);
    }
}


