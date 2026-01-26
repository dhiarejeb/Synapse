package com.synapse.synapse.note;

import com.synapse.synapse.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/boards/{boardId}/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    @GetMapping
    public List<NoteResponseDto> getNotes(
            @PathVariable String boardId,
            Authentication authentication
    ) {
        User user = (User) authentication.getPrincipal();
        return noteService.getNotes(boardId, user);
    }
    @GetMapping("/{noteId}")
    @PreAuthorize("@noteSecurityService.isNoteOwner(#noteId)")
    public NoteResponseDto getNoteById(
            @PathVariable String boardId,
            @PathVariable String noteId,
            Authentication authentication
    ) {
        User user = (User) authentication.getPrincipal();
        return noteService.getNoteById(boardId, noteId, user);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public NoteResponseDto create(
            @PathVariable String boardId,
            @RequestBody @Valid NoteRequestDto dto,
            Authentication authentication
    ) {
        User user = (User) authentication.getPrincipal();
        return noteService.create(boardId, dto, user);
    }

    @PutMapping("/{noteId}")
    @PreAuthorize("@noteSecurityService.isNoteOwner(#id)")
    public NoteResponseDto update(
            @PathVariable String boardId,
            @PathVariable String noteId,
            @RequestBody @Valid NoteRequestDto dto,
            Authentication authentication
    ) {
        User user = (User) authentication.getPrincipal();
        return noteService.update(boardId, noteId, dto, user);
    }

    @PatchMapping("/{noteId}")
    @PreAuthorize("@noteSecurityService.isNoteOwner(#id)")
    public NoteResponseDto patch(
            @PathVariable String boardId,
            @PathVariable String noteId,
            @RequestBody NoteRequestDto dto,
            Authentication authentication
    ) {
        User user = (User) authentication.getPrincipal();
        return noteService.patch(boardId, noteId, dto, user);
    }


    @DeleteMapping("/{noteId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("@noteSecurityService.isNoteOwner(#id)")
    public void delete(
            @PathVariable String boardId,
            @PathVariable String noteId,
            Authentication authentication
    ) {
        User user = (User) authentication.getPrincipal();
        noteService.delete(boardId, noteId, user);
    }
}

