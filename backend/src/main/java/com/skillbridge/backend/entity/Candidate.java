package com.skillbridge.backend.entity;
import jakarta.persistence.*;

@Entity
@Table(name = "candidates")
public class Candidate extends BaseEntity {

    @Id
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    private String name;

    @Column(columnDefinition = "text")
    private String description;

    private String address;

    private String cvUrl;

    @Column(columnDefinition = "json")
    private String parsedContentJson;

    @Column(columnDefinition = "json")
    private String vectorEmbedding;

    private Boolean isOpenToWork;

    @Convert(converter = JsonConverter.class)
    @Column(columnDefinition = "json")
    private Object experience;

    @Convert(converter = JsonConverter.class)
    @Column(columnDefinition = "json")
    private Object degree;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCvUrl() {
        return cvUrl;
    }

    public void setCvUrl(String cvUrl) {
        this.cvUrl = cvUrl;
    }

    public String getParsedContentJson() {
        return parsedContentJson;
    }

    public void setParsedContentJson(String parsedContentJson) {
        this.parsedContentJson = parsedContentJson;
    }

    public String getVectorEmbedding() {
        return vectorEmbedding;
    }

    public void setVectorEmbedding(String vectorEmbedding) {
        this.vectorEmbedding = vectorEmbedding;
    }

    public Boolean getOpenToWork() {
        return isOpenToWork;
    }

    public void setOpenToWork(Boolean openToWork) {
        this.isOpenToWork = openToWork;
    }

    public Object getExperience() {
        return experience;
    }

    public void setExperience(Object experience) {
        this.experience = experience;
    }

    public Object getDegree() {
        return degree;
    }

    public void setDegree(Object degree) {
        this.degree = degree;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }
}