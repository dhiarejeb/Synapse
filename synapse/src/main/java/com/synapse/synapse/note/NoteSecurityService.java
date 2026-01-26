package com.synapse.synapse.note;

import com.synapse.synapse.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NoteSecurityService {

    private final NoteRepository noteRepository;

    @Transactional(readOnly = true)
    public boolean isNoteOwner(final String noteId) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = ((User) authentication.getPrincipal()).getId();

        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        return note.getCreatedBy().equals(userId);
    }
}

