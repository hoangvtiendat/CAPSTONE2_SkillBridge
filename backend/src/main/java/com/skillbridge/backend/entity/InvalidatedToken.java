package com.skillbridge.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.*;

import java.util.Date;

@Entity
@Getter
@Setter
public class InvalidatedToken {
    @Id
    private String id;
    private Date expiryTime;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Date getExpiryTime() {
        return expiryTime;
    }

    public void setExpiryTime(Date expiryTime) {
        this.expiryTime = expiryTime;
    }

    public InvalidatedToken(){
    }
    public InvalidatedToken(Date expiryTime){
        this.expiryTime = expiryTime;
    }
    public InvalidatedToken(String id, Date expiryTime){
        this.id = id;
        this.expiryTime = expiryTime;
    }
}
