package com.synapse.synapse.note;

import com.synapse.synapse.exception.BusinessException;
import com.synapse.synapse.exception.ErrorCode;
import com.synapse.synapse.user.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.SchemaProperty;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
    @PreAuthorize("@noteSecurityService.isNoteOwner(#noteId)")
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
    @PreAuthorize("@noteSecurityService.isNoteOwner(#noteId)")
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
    @PreAuthorize("@noteSecurityService.isNoteOwner(#noteId)")
    public void delete(
            @PathVariable String boardId,
            @PathVariable String noteId,
            Authentication authentication
    ) {
        User user = (User) authentication.getPrincipal();
        noteService.delete(boardId, noteId, user);
    }

    @PostMapping(
            value = "/{noteId}/image",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize("@noteSecurityService.isNoteOwner(#noteId)")
    @Operation(summary = "Upload image for a note")
    @ResponseStatus(HttpStatus.OK)
    public NoteResponseDto uploadImage(
            @PathVariable String boardId,
            @PathVariable String noteId,
            @RequestParam("file") MultipartFile file,
//            @Parameter(description = "Image file", required = true)
//            @RequestPart("file") MultipartFile file,
            Authentication authentication
    ) {
        if (file.isEmpty()) {
            throw new BusinessException(ErrorCode.FILE_EMPTY);
        }

        if (file.getContentType() == null || !file.getContentType().startsWith("image/")) {
            throw new BusinessException(ErrorCode.INVALID_FILE_TYPE);
        }
        User user = (User) authentication.getPrincipal();
        return noteService.uploadImage(boardId, noteId, file, user);
    }

    @DeleteMapping("/{noteId}/image")
    @PreAuthorize("@noteSecurityService.isNoteOwner(#noteId)")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteImage(
            @PathVariable String boardId,
            @PathVariable String noteId,
            Authentication authentication
    ) {
        User user = (User) authentication.getPrincipal();
        noteService.deleteImage(boardId, noteId, user);
    }



}

