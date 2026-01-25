package com.synapse.synapse.board;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BoardRepository extends JpaRepository<Board, String> {

    List<Board> findAllByOwnerId(String ownerId);

    Optional<Board> findByIdAndOwnerId(String id, String ownerId);
}
