package com.synapse.synapse.link;

import com.synapse.synapse.note.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LinkRepository extends JpaRepository<Link, String> {

    List<Link> findByBoardId(String boardId);

    boolean existsByBoardIdAndId(String boardId, String linkId);

    Optional<Link> findByIdAndBoardId(String id, String boardId);

    @Modifying
    @Query("DELETE FROM Link l WHERE l.fromNote = :note OR l.toNote = :note")
    void deleteByFromNoteOrToNote(@Param("note") Note note1, @Param("note") Note note2);
}

