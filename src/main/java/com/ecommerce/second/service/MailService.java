package com.ecommerce.second.service;

import java.math.BigDecimal;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

import com.ecommerce.second.Enum.OrderStatus;
import com.ecommerce.second.model.CartItem;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;

    @Async("threadExecutor")
    public void sendOrderVerification(String to, int orderId,
            BigDecimal price, List<CartItem> products) {
        SimpleMailMessage mess = new SimpleMailMessage();
        mess.setTo(to);
        mess.setSubject("Order #" + orderId + " Confirmed");
        StringBuilder body = new StringBuilder(
            "Your order has been placed!\n\nOrder ID: " + orderId +
            "\nTotal: ₹" + price + "\n\nItems ordered:\n");
        for (CartItem item : products) {
            body.append("- ").append(item.getProduct().getName()).append("\n");
        }
        mess.setText(body.toString());
        mailSender.send(mess);
    }

    @Async("threadExecutor")
    public void sendOrderStatusUpdate(String to, Long orderId, OrderStatus status) {
        SimpleMailMessage mess = new SimpleMailMessage();
        mess.setTo(to);
        mess.setSubject("Order #" + orderId + " Status Update");
        mess.setText("Your order #" + orderId + " is now: " + status.toString());
        mailSender.send(mess);
    }

    @Async("threadExecutor")
    public void sendOrderCancellation(String to, Long orderId) {
        SimpleMailMessage mess = new SimpleMailMessage();
        mess.setTo(to);
        mess.setSubject("Order #" + orderId + " Cancelled");
        mess.setText("Your order #" + orderId + " has been successfully cancelled.\n" +
            "We apologise for any inconvenience. Please feel free to order again.");
        mailSender.send(mess);
    }

    @Async("threadExecutor")
    public void sendReturnConfirmation(String to, Long orderId) {
        SimpleMailMessage mess = new SimpleMailMessage();
        mess.setTo(to);
        mess.setSubject("Return Request #" + orderId + " Received");
        mess.setText("Your return request for order #" + orderId +
            " has been received.\nWe will arrange a pickup shortly.");
        mailSender.send(mess);
    }

    @Async("threadExecutor")
    public void sendVendorApplicationReceived(String to) {
        SimpleMailMessage mess = new SimpleMailMessage();
        mess.setTo(to);
        mess.setSubject("Vendor Application Received");
        mess.setText("""
                     Your vendor application has been received.
                     We will review it and get back to you soon.""");
        mailSender.send(mess);
    }

    @Async("threadExecutor")
    public void sendVendorApproved(String to, String warehouseName) {
        SimpleMailMessage mess = new SimpleMailMessage();
        mess.setTo(to);
        mess.setSubject("Vendor Application Approved");
        mess.setText("""
                     Congratulations! Your vendor application has been approved.
                     Your assigned warehouse is: """ + warehouseName);
        mailSender.send(mess);
    }

    @Async("threadExecutor")
    public void sendVendorRejected(String to, String reason) {
        SimpleMailMessage mess = new SimpleMailMessage();
        mess.setTo(to);
        mess.setSubject("Vendor Application Update");
        mess.setText("Your vendor application was not approved.\nReason: " + reason);
        mailSender.send(mess);
    }
}