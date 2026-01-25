package com.synapse.synapse.link;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LinkRepository extends JpaRepository<Link, String> {

    List<Link> findByBoardId(String boardId);

    boolean existsByBoardIdAndId(String boardId, String linkId);
}

