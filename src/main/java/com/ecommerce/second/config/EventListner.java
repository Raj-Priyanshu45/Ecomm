package com.ecommerce.second.config;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import com.ecommerce.second.service.MailService;


@Component
public class EventListner {
    
    private final MailService mailService;
    public EventListner(MailService mailService){
        this.mailService = mailService;
    }

    @EventListener
    public void onEmailVerification(EmailVerificationEvent event){
        mailService.sendVerificationMail(event.getEmail() , event.getToken());
    }
}