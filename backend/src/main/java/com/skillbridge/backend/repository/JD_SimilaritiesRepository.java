package com.skillbridge.backend.repository;
import com.skillbridge.backend.entity.JD_Similarities;
import com.skillbridge.backend.entity.Job;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JD_SimilaritiesRepository extends JpaRepository<JD_Similarities, String> {
    @Query("SELECT j.source_jd_id FROM JD_Similarities j WHERE j.target_jd_id.id = :sourceId")
    Optional<Job> findTargetJobBySourceId(@Param("sourceId") String sourceId);

    @Query("SELECT j FROM JD_Similarities j")
    List<JD_Similarities> listTargetJobs();

    @Query("SELECT CASE WHEN COUNT(j) > 0 THEN true ELSE false END FROM JD_Similarities j WHERE j.target_jd_id.id = :targetID")
    boolean existsByTarget_jd_id(@Param("targetID") String targetID);

    @Modifying
    @Transactional
    @Query("DELETE FROM JD_Similarities j WHERE j.target_jd_id.id = :sourceId")
    int deleteTargetJobBySourceId(@Param("sourceId") String sourceId);


}
