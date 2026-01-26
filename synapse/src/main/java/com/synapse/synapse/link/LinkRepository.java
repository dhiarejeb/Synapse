package com.synapse.synapse.link;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LinkRepository extends JpaRepository<Link, String> {

    List<Link> findByBoardId(String boardId);

    boolean existsByBoardIdAndId(String boardId, String linkId);

    Optional<Link> findByIdAndBoardId(String id, String boardId);
}

