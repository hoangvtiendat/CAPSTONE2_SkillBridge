package com.skillbridge.backend.service;

public interface MailService {
    void sendToEmail(String toEmail, String subject, String content);
}