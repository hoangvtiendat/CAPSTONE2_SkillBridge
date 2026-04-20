package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.provinces;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface provincesRepository extends JpaRepository<provinces, String > {
    @Query("""
        SELECT p FROM provinces p
    """)
    List<provinces> findAllProvincesCustom();

}
