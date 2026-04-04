package com.skillbridge.backend.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillbridge.backend.dto.RoadmapDTO;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.List;

@Converter
public class RoadmapConverter implements AttributeConverter<List<RoadmapDTO>, String> {
    private static final ObjectMapper objectMapper = new ObjectMapper()
            .findAndRegisterModules();

    @Override
    public String convertToDatabaseColumn(List<RoadmapDTO> attribute) {
        if (attribute == null) return null;
        try {
            return objectMapper.writeValueAsString(attribute);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    @Override
    public List<RoadmapDTO> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) return null;
        try {
            return objectMapper.readValue(dbData, new TypeReference<List<RoadmapDTO>>() {
            });
        } catch (JsonProcessingException e) {
            return null;
        }
    }
}