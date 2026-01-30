package com.synapse.synapse.email;

import jakarta.mail.*;
import java.util.Properties;

//public class GmailTest {
//    public static void main(String[] args) throws Exception {
//        Properties props = new Properties();
//        props.put("mail.smtp.auth", "true");
//        props.put("mail.smtp.starttls.enable", "true");
//        props.put("mail.smtp.host", "smtp.gmail.com");
//        props.put("mail.smtp.port", "587");
//
//        Session session = Session.getInstance(props, new Authenticator() {
//            protected PasswordAuthentication getPasswordAuthentication() {
//                return new PasswordAuthentication(
//                        "meddhiarejeb22@gmail.com",
//                        "hmkd mgsv rhib oqkz"
//                );
//            }
//        });
//
//        Transport transport = session.getTransport("smtp");
//        transport.connect();
//        System.out.println("Connected successfully!");
//        transport.close();
//    }
//}
