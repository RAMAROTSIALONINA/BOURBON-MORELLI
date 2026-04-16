// Service de simulation d'envoi d'emails
// En production, ce serait remplacé par un vrai service d'emails (Nodemailer, SendGrid, etc.)

const emailService = {
  // Simuler l'envoi d'un email de réinitialisation
  sendPasswordResetEmail: async (to, resetLink) => {
    try {
      console.log('=== EMAIL SERVICE ===');
      console.log('Envoi d\'email de réinitialisation à:', to);
      console.log('Lien de réinitialisation:', resetLink);
      
      // Simulation d'envoi d'email
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Template d'email simulé
      const emailTemplate = {
        to: to,
        subject: 'Réinitialisation de votre mot de passe',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Réinitialisation du mot de passe</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; padding: 20px 0; }
              .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
              .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Bourbon Morelli</h1>
                <h2>Réinitialisation de votre mot de passe</h2>
              </div>
              
              <p>Bonjour,</p>
              
              <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Réinitialiser mon mot de passe</a>
              </div>
              
              <p>Ce lien expirera dans 1 heure pour des raisons de sécurité.</p>
              
              <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.</p>
              
              <div class="footer">
                <p>Cet email a été envoyé automatiquement par Bourbon Morelli</p>
                <p>© 2024 Bourbon Morelli. Tous droits réservés.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          Réinitialisation de votre mot de passe - Bourbon Morelli
          
          Bonjour,
          
          Vous avez demandé la réinitialisation de votre mot de passe.
          
          Cliquez sur ce lien pour définir un nouveau mot de passe :
          ${resetLink}
          
          Ce lien expirera dans 1 heure pour des raisons de sécurité.
          
          Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.
          
          © 2024 Bourbon Morelli. Tous droits réservés.
        `
      };
      
      console.log('=== EMAIL TEMPLATE ===');
      console.log('Sujet:', emailTemplate.subject);
      console.log('Destinataire:', emailTemplate.to);
      
      // En production, ceci serait un vrai appel à un service d'email
      // Exemple avec Nodemailer :
      /*
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'your-email@gmail.com',
          pass: 'your-app-password'
        }
      });
      
      await transporter.sendMail({
        from: 'noreply@bourbonmorelli.com',
        to: to,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text
      });
      */
      
      console.log('=== EMAIL SENT SUCCESSFULLY ===');
      
      return {
        success: true,
        message: 'Email envoyé avec succès',
        emailId: 'email-' + Date.now(),
        preview: {
          to: emailTemplate.to,
          subject: emailTemplate.subject,
          html: emailTemplate.html.substring(0, 200) + '...'
        }
      };
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email',
        error: error.message
      };
    }
  },

  // Simuler l'envoi d'un email de confirmation d'inscription
  sendWelcomeEmail: async (to, userName) => {
    try {
      console.log('=== WELCOME EMAIL ===');
      console.log('Envoi d\'email de bienvenue à:', to);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      console.log('=== WELCOME EMAIL SENT ===');
      
      return {
        success: true,
        message: 'Email de bienvenue envoyé',
        emailId: 'welcome-' + Date.now()
      };
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email',
        error: error.message
      };
    }
  },

  // Simuler l'envoi d'un email de confirmation de commande
  sendOrderConfirmationEmail: async (to, orderDetails) => {
    try {
      console.log('=== ORDER CONFIRMATION EMAIL ===');
      console.log('Envoi de confirmation de commande à:', to);
      
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      console.log('=== ORDER EMAIL SENT ===');
      
      return {
        success: true,
        message: 'Email de confirmation de commande envoyé',
        emailId: 'order-' + Date.now()
      };
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de commande:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email',
        error: error.message
      };
    }
  }
};

export default emailService;
