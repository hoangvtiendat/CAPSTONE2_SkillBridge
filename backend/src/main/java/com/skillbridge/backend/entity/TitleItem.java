package com.skillbridge.backend.entity;

import jakarta.persistence.Entity;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TitleItem {
    private String title;
    private String description;
}
