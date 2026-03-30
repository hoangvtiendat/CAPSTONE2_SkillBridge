package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.ChatDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatDocumentRepository extends JpaRepository<ChatDocument, Long> {
}
