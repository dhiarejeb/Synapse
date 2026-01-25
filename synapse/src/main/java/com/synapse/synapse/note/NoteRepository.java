package com.synapse.synapse.note;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NoteRepository extends JpaRepository<Note, String> {

    List<Note> findAllByBoardId(String boardId);

    Optional<Note> findByIdAndBoardId(String id, String boardId);
}

