package com.ecommerce.second.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailService {
    
    private final JavaMailSender mailSender;
    
    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }
    
    public void sendVerificationMail(String toEmail, String token) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(toEmail);
        msg.setSubject("Verify Your Email Address");
        msg.setText(
            """
            Welcome! Please verify your email address.
            
            Your 6-digit verification code is: """ + token + "\n\n" +
            "This code will expire in 30 minutes.\n\n" +
            "If you didn't create an account, please ignore this email."
        );
        
        mailSender.send(msg);
    }
}