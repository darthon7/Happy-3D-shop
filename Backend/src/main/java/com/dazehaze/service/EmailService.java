package com.dazehaze.service;

import com.resend.Resend;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final Resend resend;

    @Value("${app.email.from}")
    private String emailFrom;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public void sendPasswordResetEmail(String email, String resetToken) {
        try {
            String resetLink = frontendUrl + "/reset-password?token=" + resetToken;

            String htmlContent = buildPasswordResetEmailHtml(resetLink);

            CreateEmailResponse response = resend.emails().send(CreateEmailOptions.builder()
                    .from("DazeHaze <" + emailFrom + ">")
                    .to(email)
                    .subject("Recuperación de contraseña - DazeHaze")
                    .html(htmlContent)
                    .build());

            log.info("Password reset email sent to: {}, id: {}", maskEmail(email), response.getId());
        } catch (Exception e) {
            log.error("Failed to send password reset email to: {}", maskEmail(email), e);
            throw new RuntimeException("Error al enviar el correo de recuperación", e);
        }
    }

    public void sendWelcomeEmail(String email, String firstName) {
        try {
            String htmlContent = buildWelcomeEmailHtml(firstName);

            CreateEmailResponse response = resend.emails().send(CreateEmailOptions.builder()
                    .from("DazeHaze <" + emailFrom + ">")
                    .to(email)
                    .subject("¡Bienvenido a DazeHaze!")
                    .html(htmlContent)
                    .build());

            log.info("Welcome email sent to: {}, id: {}", maskEmail(email), response.getId());
        } catch (Exception e) {
            log.error("Failed to send welcome email to: {}", maskEmail(email), e);
            throw new RuntimeException("Error al enviar el correo de bienvenida", e);
        }
    }

    public void sendOrderConfirmationEmail(String email, String orderNumber, String firstName,
            String total, String shippingAddress, String carrier) {
        try {
            String htmlContent = buildOrderConfirmationHtml(orderNumber, firstName, total, shippingAddress, carrier);

            CreateEmailResponse response = resend.emails().send(CreateEmailOptions.builder()
                    .from("DazeHaze <" + emailFrom + ">")
                    .to(email)
                    .subject("Confirmación de tu pedido #" + orderNumber)
                    .html(htmlContent)
                    .build());

            log.info("Order confirmation email sent to: {}, order: {}, id: {}", maskEmail(email), orderNumber,
                    response.getId());
        } catch (Exception e) {
            log.error("Failed to send order confirmation email to: {}, order: {}", maskEmail(email), orderNumber, e);
            throw new RuntimeException("Error al enviar el correo de confirmación", e);
        }
    }

    public void sendShippingNotificationEmail(String email, String orderNumber, String status,
            String trackingNumber, String carrier, String firstName) {
        try {
            String subject;
            String statusText;

            switch (status) {
                case "SHIPPED":
                    subject = "Tu pedido #" + orderNumber + " ha sido enviado";
                    statusText = "Enviado";
                    break;
                case "IN_TRANSIT":
                    subject = "Tu pedido #" + orderNumber + " está en tránsito";
                    statusText = "En tránsito";
                    break;
                case "DELIVERED":
                    subject = "Tu pedido #" + orderNumber + " ha sido entregado";
                    statusText = "Entregado";
                    break;
                default:
                    subject = "Actualización de tu pedido #" + orderNumber;
                    statusText = status;
            }

            String htmlContent = buildShippingNotificationHtml(orderNumber, firstName, statusText, trackingNumber,
                    carrier);

            CreateEmailResponse response = resend.emails().send(CreateEmailOptions.builder()
                    .from("DazeHaze <" + emailFrom + ">")
                    .to(email)
                    .subject(subject)
                    .html(htmlContent)
                    .build());

            log.info("Shipping notification email sent to: {}, order: {}, status: {}, id: {}",
                    maskEmail(email), orderNumber, status, response.getId());
        } catch (Exception e) {
            log.error("Failed to send shipping notification email to: {}, order: {}", maskEmail(email), orderNumber, e);
            throw new RuntimeException("Error al enviar la notificación de envío", e);
        }
    }

    private String buildPasswordResetEmailHtml(String resetLink) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');
                    </style>
                </head>
                <body style="margin: 0; padding: 0; font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; text-align: center;">
                    <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 60px 20px;">
                        <tr>
                            <td align="center">
                                <table width="100%%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 24px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08); text-align: center;">
                                    <tr>
                                        <td style="background-color: #0a0a0a; padding: 40px; text-align: center;">
                                            <img src="https://res.cloudinary.com/dpeepkwas/image/upload/v1769100257/DAZEHAZE_IS_4x_csehup.png" alt="DazeHaze" style="height: 32px; width: auto; display: inline-block; margin: 0 auto;">
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 50px 40px; text-align: center;">
                                            <h2 style="color: #111827; margin: 0 0 15px 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; text-align: center;">Recupera tu acceso.</h2>
                                            <p style="color: #4b5563; margin: 0 auto 40px auto; font-size: 16px; line-height: 1.6; text-align: center;">
                                                Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>DazeHaze</strong>.
                                            </p>
                                            <div style="text-align: center;">
                                                <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #a855f7, #ec4899); color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 25px -5px rgba(168, 85, 247, 0.4);">
                                                    Restablecer Contraseña
                                                </a>
                                            </div>
                                            <p style="color: #6b7280; margin: 40px 0 0 0; font-size: 14px; text-align: center;">
                                                Este enlace es seguro y expirará en 1 hora.
                                            </p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                                            <p style="color: #9ca3af; margin: 0; font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">
                                                © 2026 DAZEHAZE
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """
                .formatted(resetLink);
    }

    private String buildWelcomeEmailHtml(String firstName) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');
                    </style>
                </head>
                <body style="margin: 0; padding: 0; font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; text-align: center;">
                    <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 60px 20px;">
                        <tr>
                            <td align="center">
                                <table width="100%%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 24px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08); text-align: center;">
                                    <tr>
                                        <td style="background-color: #0a0a0a; padding: 40px; text-align: center;">
                                            <img src="https://res.cloudinary.com/dpeepkwas/image/upload/v1769100257/DAZEHAZE_IS_4x_csehup.png" alt="DazeHaze" style="height: 32px; width: auto; display: inline-block; margin: 0 auto;">
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 50px 40px; text-align: center;">
                                            <h2 style="color: #111827; margin: 0 0 15px 0; font-size: 32px; font-weight: 800; letter-spacing: -1px; text-align: center;">
                                                Bienvenido a <br><span style="color: #a855f7;">DazeHaze.</span>
                                            </h2>
                                            <p style="color: #4b5563; margin: 0 auto 20px auto; font-size: 16px; line-height: 1.6; text-align: center;">
                                                Hola <strong>%s</strong>, tu cuenta ha sido creada exitosamente.
                                            </p>
                                            <p style="color: #6b7280; margin: 0 auto 40px auto; font-size: 15px; line-height: 1.6; text-align: center;">
                                                Prepárate para explorar la colección más exclusiva. Diseño minimalista, máxima expresión.
                                            </p>
                                            <div style="text-align: center;">
                                                <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #a855f7, #ec4899); color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 25px -5px rgba(168, 85, 247, 0.4);">
                                                    Descubrir Catálogo
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                                            <p style="color: #9ca3af; margin: 0; font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">
                                                © 2026 DAZEHAZE
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """
                .formatted(firstName != null ? firstName : "Usuario", frontendUrl);
    }

    private String buildOrderConfirmationHtml(String orderNumber, String firstName, String total,
            String shippingAddress, String carrier) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');
                    </style>
                </head>
                <body style="margin: 0; padding: 0; font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; text-align: center;">
                    <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 10px;">
                        <tr>
                            <td align="center">
                                <table width="100%%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 24px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08); text-align: center;">
                                    <tr>
                                        <td style="background-color: #0a0a0a; padding: 40px; text-align: center; border-bottom: 3px solid #f3e8ff;">
                                            <img src="https://res.cloudinary.com/dpeepkwas/image/upload/v1769100257/DAZEHAZE_IS_4x_csehup.png" alt="DazeHaze" style="height: 28px; width: auto; display: inline-block; margin: 0 auto 30px auto;">
                                            <br>
                                            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #a855f7, #ec4899); border-radius: 50%%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 10px 25px -5px rgba(168, 85, 247, 0.4);">
                                                <span style="color: white; font-size: 28px; line-height: 1;">✓</span>
                                            </div>
                                            <h2 style="color: #ffffff; margin: 0 0 10px 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; text-align: center;">¡Pedido Confirmado!</h2>
                                            <p style="color: #e5e7eb; margin: 0; font-size: 15px; text-align: center;">Gracias por tu compra, %s.</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 40px 30px; text-align: center;">
                                            <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb; margin-bottom: 24px; text-align: center;">
                                                <tr>
                                                    <td style="padding: 20px; text-align: center;">
                                                        <p style="color: #6b7280; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">Número de pedido</p>
                                                        <p style="color: #a855f7; margin: 0; font-size: 20px; font-weight: 800;">#%s</p>
                                                    </td>
                                                </tr>
                                            </table>
                                            <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px; text-align: center;">
                                                <tr>
                                                    <td style="padding-bottom: 15px; border-bottom: 1px solid #e5e7eb; text-align: center;">
                                                        <p style="color: #6b7280; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">Dirección de envío</p>
                                                        <p style="color: #111827; margin: 0 auto; font-size: 15px; line-height: 1.5; text-align: center;">%s</p>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding-top: 15px; padding-bottom: 15px; border-bottom: 1px solid #e5e7eb; text-align: center;">
                                                        <p style="color: #6b7280; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">Paquetería / Método</p>
                                                        <p style="color: #111827; margin: 0; font-size: 15px; font-weight: 600; text-align: center;">%s</p>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding-top: 15px; text-align: center;">
                                                        <p style="color: #6b7280; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">Total pagado</p>
                                                        <p style="color: #111827; margin: 0; font-size: 24px; font-weight: 800; text-align: center;">%s</p>
                                                    </td>
                                                </tr>
                                            </table>
                                            <p style="color: #6b7280; margin: 0 auto; font-size: 14px; text-align: center; line-height: 1.6;">
                                                Te notificaremos en cuanto tu paquete inicie su viaje hacia ti.
                                            </p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                                            <p style="color: #9ca3af; margin: 0; font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">
                                                © 2026 DAZEHAZE
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """
                .formatted(firstName != null ? firstName : "Cliente", orderNumber,
                        shippingAddress != null ? shippingAddress : "No especificada",
                        carrier != null ? carrier : "Estándar", total);
    }

    private String buildShippingNotificationHtml(String orderNumber, String firstName, String status,
            String trackingNumber, String carrier) {
        String statusEmoji = "";
        String statusTitle = "";
        String statusDescription = "";
        String accentColor = "#a855f7";
        String gradientBottom = "border-bottom: 3px solid #f3e8ff;";

        switch (status) {
            case "Enviado":
                statusEmoji = "📦";
                statusTitle = "En Camino";
                statusDescription = "Tu pedido ya está en manos de la paquetería y va en camino.";
                break;
            case "En tránsito":
                statusEmoji = "🚚";
                statusTitle = "En Reparto";
                statusDescription = "Tu pedido está en reparto y a punto de llegar a su destino.";
                accentColor = "#0ea5e9";
                gradientBottom = "border-bottom: 3px solid #e0f2fe;";
                break;
            case "Entregado":
                statusEmoji = "✨";
                statusTitle = "Entregado";
                statusDescription = "Tu paquete DazeHaze ha sido entregado exitosamente. ¡A disfrutar!";
                accentColor = "#10b981";
                gradientBottom = "border-bottom: 3px solid #d1fae5;";
                break;
            default:
                statusEmoji = "📬";
                statusTitle = "Actualización";
                statusDescription = "Hay un cambio de estado en tu pedido.";
        }

        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');
                    </style>
                </head>
                <body style="margin: 0; padding: 0; font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; text-align: center;">
                    <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 10px;">
                        <tr>
                            <td align="center">
                                <table width="100%%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 24px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08); text-align: center;">
                                    <tr>
                                        <td style="background-color: #0a0a0a; padding: 40px; text-align: center; %s">
                                            <img src="https://res.cloudinary.com/dpeepkwas/image/upload/v1769100257/DAZEHAZE_IS_4x_csehup.png" alt="DazeHaze" style="height: 28px; width: auto; display: inline-block; margin: 0 auto 30px auto;">
                                            <br>
                                            <div style="width: 72px; height: 72px; background-color: #1a1a1a; border: 1px solid #333; border-radius: 50%%; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; font-size: 32px;">
                                                %s
                                            </div>
                                            <h2 style="color: #ffffff; margin: 0 0 10px 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; text-align: center;">%s</h2>
                                            <p style="color: #e5e7eb; margin: 0 auto; font-size: 15px; max-width: 80%%; text-align: center;">%s</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 40px 30px; text-align: center;">
                                            <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb; margin-bottom: 24px; text-align: center;">
                                                <tr>
                                                    <td style="padding: 20px; text-align: center;">
                                                        <p style="color: #6b7280; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">Número de pedido</p>
                                                        <p style="color: %s; margin: 0; font-size: 20px; font-weight: 800; text-align: center;">#%s</p>
                                                    </td>
                                                </tr>
                                            </table>
                                            <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px; text-align: center;">
                                                <tr>
                                                    <td style="padding-bottom: 15px; border-bottom: 1px solid #e5e7eb; text-align: center;">
                                                        <p style="color: #6b7280; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">Transportista</p>
                                                        <p style="color: #111827; margin: 0; font-size: 15px; font-weight: 600; text-align: center;">%s</p>
                                                    </td>
                                                </tr>
                    """
                .formatted(gradientBottom, statusEmoji, statusTitle, statusDescription, accentColor, orderNumber,
                        carrier != null ? carrier : "Estándar")
                + (trackingNumber != null && !trackingNumber.isEmpty()
                        ? """
                                                <tr>
                                                    <td style="padding-top: 15px; padding-bottom: 15px; text-align: center;">
                                                        <p style="color: #6b7280; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">Número de rastreo</p>
                                                        <p style="color: #111827; margin: 0 auto; font-size: 15px; font-family: monospace; letter-spacing: 3px; font-weight: 600; padding: 10px; background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; display: inline-block;">%s</p>
                                                    </td>
                                                </tr>
                                            </table>
                                            <div style="text-align: center; margin-top: 20px;">
                                                <a href="%s" style="display: inline-block; background-color: #111827; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; transition: all 0.2s;">
                                                    Rastrear en Línea
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                """
                                .formatted(trackingNumber, frontendUrl + "/perfil?tab=orders")
                        : """
                                            </table>
                                        </td>
                                    </tr>
                                """)
                + """
                                            <tr>
                                                <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                                                    <p style="color: #9ca3af; margin: 0; font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">
                                                        © 2026 DAZEHAZE
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </body>
                        </html>
                        """;
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        int atIndex = email.indexOf('@');
        if (atIndex <= 2) {
            return "***" + email.substring(atIndex);
        }
        return email.substring(0, 2) + "***" + email.substring(atIndex);
    }

    /**
     * Generic method to send a simple HTML email.
     * Used by cancellation emails and other one-off notifications.
     */
    public void sendSimpleEmail(String email, String subject, String htmlBody) {
        try {
            String wrappedHtml = """
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap');</style>
                    </head>
                    <body style="margin:0;padding:0;font-family:'Outfit',-apple-system,sans-serif;background-color:#f3f4f6;">
                        <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:60px 20px;">
                            <tr><td align="center">
                                <table width="100%%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:24px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 40px -10px rgba(0,0,0,0.08);">
                                    <tr><td style="background:#0a0a0a;padding:32px 40px;text-align:center;">
                                        <img src="https://res.cloudinary.com/dpeepkwas/image/upload/v1769100257/DAZEHAZE_IS_4x_csehup.png" alt="DazeHaze" style="height:28px;width:auto;">
                                    </td></tr>
                                    <tr><td style="padding:40px 30px;color:#374151;font-size:15px;line-height:1.7;">
                                        %s
                                    </td></tr>
                                    <tr><td style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">
                                        <p style="color:#9ca3af;margin:0;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">© 2026 DAZEHAZE</p>
                                    </td></tr>
                                </table>
                            </td></tr>
                        </table>
                    </body>
                    </html>
                    """
                    .formatted(htmlBody);

            CreateEmailResponse response = resend.emails().send(CreateEmailOptions.builder()
                    .from("DazeHaze <" + emailFrom + ">")
                    .to(email)
                    .subject(subject)
                    .html(wrappedHtml)
                    .build());

            log.info("Simple email sent to: {}, subject: {}, id: {}", maskEmail(email), subject, response.getId());
        } catch (Exception e) {
            log.error("Failed to send simple email to: {}, subject: {}", maskEmail(email), subject, e);
            throw new RuntimeException("Error al enviar el correo: " + e.getMessage(), e);
        }
    }
}
