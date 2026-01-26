package com.synapse.synapse.board;

import com.synapse.synapse.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BoardSecurityService {

    private final BoardRepository boardRepository;

    @Transactional(readOnly = true)
    public boolean isBoardOwner(final String boardId) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = ((User) authentication.getPrincipal()).getId();

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("Board not found"));

        return board.getCreatedBy().equals(userId);
    }
}