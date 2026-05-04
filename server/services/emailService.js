const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const sendResetPasswordEmail = async (toEmail, firstName, resetLink) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn('⚠️  Email non configuré (EMAIL_USER/EMAIL_PASS manquants). Lien de réinitialisation :', resetLink);
    return { sent: false, reason: 'not_configured' };
  }

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- En-tête -->
          <tr>
            <td style="background:#1a1a1a;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#c9a96e;font-size:24px;letter-spacing:3px;font-weight:400;">
                BOURBON MORELLI
              </h1>
              <p style="margin:6px 0 0;color:#888;font-size:12px;letter-spacing:2px;text-transform:uppercase;">
                Maison de Luxe
              </p>
            </td>
          </tr>

          <!-- Corps -->
          <tr>
            <td style="padding:48px 40px;">
              <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:22px;font-weight:400;">
                Réinitialisation de votre mot de passe
              </h2>
              <p style="margin:0 0 12px;color:#555;font-size:15px;line-height:1.7;">
                Bonjour <strong>${firstName}</strong>,
              </p>
              <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.7;">
                Vous avez demandé la réinitialisation de votre mot de passe pour votre compte
                <strong>BOURBON MORELLI</strong>. Cliquez sur le bouton ci-dessous pour définir
                un nouveau mot de passe.
              </p>

              <!-- Bouton -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background:#c9a96e;border-radius:4px;">
                    <a href="${resetLink}"
                       style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:14px;
                              text-decoration:none;letter-spacing:1px;font-family:Georgia,serif;">
                      Réinitialiser mon mot de passe
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;color:#888;font-size:13px;line-height:1.6;">
                Ce lien est valable pendant <strong>1 heure</strong>.
              </p>
              <p style="margin:0 0 8px;color:#888;font-size:13px;line-height:1.6;">
                Si vous n'avez pas fait cette demande, ignorez cet email — votre mot de passe
                restera inchangé.
              </p>

              <!-- Lien texte en cas de bouton non cliquable -->
              <p style="margin:24px 0 0;color:#aaa;font-size:12px;line-height:1.6;word-break:break-all;">
                Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>
                <a href="${resetLink}" style="color:#c9a96e;">${resetLink}</a>
              </p>
            </td>
          </tr>

          <!-- Pied de page -->
          <tr>
            <td style="background:#f9f9f9;padding:24px 40px;border-top:1px solid #eee;text-align:center;">
              <p style="margin:0;color:#aaa;font-size:12px;">
                © ${new Date().getFullYear()} BOURBON MORELLI — Tous droits réservés
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"BOURBON MORELLI" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Réinitialisation de votre mot de passe — BOURBON MORELLI',
    html
  });

  return { sent: true };
};

// ─── Email de confirmation de commande ───────────────────────────────────────
const sendOrderConfirmationEmail = async (toEmail, { firstName, orderId, items = [], subtotal, shippingCost, total, shippingAddress, paymentMethod }) => {
  const transporter = createTransporter();

  const formatEur = (amount) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(parseFloat(amount) || 0);

  const methodLabel = paymentMethod === 'paypal' ? 'PayPal'
    : paymentMethod === 'mobile' || paymentMethod === 'mobile_money' ? 'Mobile Money'
    : 'Carte bancaire (Stripe)';

  const itemsHtml = items.map(it => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#333;font-size:14px;">
        ${it.name}${it.selectedSize ? ` — Taille ${it.selectedSize}` : ''}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:center;color:#555;font-size:14px;">
        ${it.quantity}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:right;color:#333;font-size:14px;">
        ${formatEur(it.price * it.quantity)}
      </td>
    </tr>`).join('');

  const addressHtml = shippingAddress
    ? `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}<br/>
       ${shippingAddress.streetAddress || ''}<br/>
       ${shippingAddress.postalCode || ''} ${shippingAddress.city || ''}<br/>
       ${shippingAddress.country || ''}`
    : 'Adresse enregistrée avec la commande';

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

      <!-- En-tête -->
      <tr>
        <td style="background:#1a1a1a;padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#c9a96e;font-size:24px;letter-spacing:3px;font-weight:400;">BOURBON MORELLI</h1>
          <p style="margin:6px 0 0;color:#888;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Maison de Luxe</p>
        </td>
      </tr>

      <!-- Titre confirmation -->
      <tr>
        <td style="background:#f9f5ef;padding:32px 40px;text-align:center;border-bottom:3px solid #c9a96e;">
          <p style="margin:0 0 8px;font-size:32px;">✅</p>
          <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:22px;font-weight:400;letter-spacing:1px;">Commande confirmée !</h2>
          <p style="margin:0;color:#777;font-size:14px;">Merci pour votre confiance, ${firstName || 'cher client'}.</p>
        </td>
      </tr>

      <!-- Corps -->
      <tr>
        <td style="padding:40px 40px 24px;">

          <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.7;">
            Votre commande <strong style="color:#1a1a1a;">N° ${orderId}</strong> a été validée avec succès.
            Vous trouverez ci-dessous le récapitulatif de votre achat.
          </p>

          <!-- Articles -->
          <h3 style="margin:0 0 12px;color:#1a1a1a;font-size:16px;font-weight:600;border-bottom:2px solid #c9a96e;padding-bottom:8px;">
            Articles commandés
          </h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <th style="text-align:left;color:#888;font-size:12px;letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;">Produit</th>
              <th style="text-align:center;color:#888;font-size:12px;letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;">Qté</th>
              <th style="text-align:right;color:#888;font-size:12px;letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;">Prix</th>
            </tr>
            ${itemsHtml || '<tr><td colspan="3" style="color:#999;font-size:13px;padding:12px 0;">Détails disponibles dans votre espace client</td></tr>'}
          </table>

          <!-- Totaux -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;background:#f9f9f9;border-radius:6px;padding:16px;" cellpadding="12">
            <tr>
              <td style="padding:6px 16px;color:#555;font-size:14px;">Sous-total</td>
              <td style="padding:6px 16px;text-align:right;color:#333;font-size:14px;">${formatEur(subtotal)}</td>
            </tr>
            <tr>
              <td style="padding:6px 16px;color:#555;font-size:14px;">Livraison</td>
              <td style="padding:6px 16px;text-align:right;color:#333;font-size:14px;">${!shippingCost || shippingCost === 0 ? 'Gratuite' : formatEur(shippingCost)}</td>
            </tr>
            <tr style="border-top:1px solid #e0e0e0;">
              <td style="padding:10px 16px;color:#1a1a1a;font-size:16px;font-weight:bold;">Total</td>
              <td style="padding:10px 16px;text-align:right;color:#c9a96e;font-size:18px;font-weight:bold;">${formatEur(total)}</td>
            </tr>
          </table>

          <!-- Infos livraison & paiement -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
            <tr>
              <td width="50%" style="vertical-align:top;padding-right:16px;">
                <h3 style="margin:0 0 10px;color:#1a1a1a;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">
                  📦 Livraison
                </h3>
                <p style="margin:0;color:#555;font-size:13px;line-height:1.7;">${addressHtml}</p>
              </td>
              <td width="50%" style="vertical-align:top;padding-left:16px;border-left:1px solid #eee;">
                <h3 style="margin:0 0 10px;color:#1a1a1a;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">
                  💳 Paiement
                </h3>
                <p style="margin:0;color:#555;font-size:13px;">${methodLabel}</p>
                <p style="margin:4px 0 0;color:#2e7d32;font-size:13px;font-weight:600;">✓ Payé avec succès</p>
              </td>
            </tr>
          </table>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 8px;">
            <tr>
              <td style="background:#c9a96e;border-radius:4px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/account/orders"
                   style="display:inline-block;padding:14px 36px;color:#fff;font-size:14px;
                          text-decoration:none;letter-spacing:1px;font-family:Georgia,serif;">
                  Voir mes commandes
                </a>
              </td>
            </tr>
          </table>
          <p style="text-align:center;margin:12px 0 0;color:#aaa;font-size:12px;">
            Des questions ? <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/contact" style="color:#c9a96e;">Contactez notre service client</a>
          </p>

        </td>
      </tr>

      <!-- Pied de page -->
      <tr>
        <td style="background:#f9f9f9;padding:24px 40px;border-top:1px solid #eee;text-align:center;">
          <p style="margin:0;color:#aaa;font-size:12px;">
            © ${new Date().getFullYear()} BOURBON MORELLI — Tous droits réservés
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

  if (!transporter) {
    console.log(`📧 [EMAIL non configuré] Confirmation commande #${orderId} → ${toEmail}`);
    return { sent: false, reason: 'not_configured' };
  }

  try {
    await transporter.sendMail({
      from: `"BOURBON MORELLI" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `✅ Commande confirmée N° ${orderId} — BOURBON MORELLI`,
      html
    });
    console.log(`📧 Email confirmation commande #${orderId} envoyé à ${toEmail}`);
    return { sent: true };
  } catch (err) {
    console.error(`📧 Erreur envoi email commande #${orderId}:`, err.message);
    return { sent: false, reason: err.message };
  }
};

// ─── Envoi email de confirmation à partir de l'ID commande ──────────────────
// Récupère toutes les données depuis la DB puis envoie l'email
const sendOrderConfirmationById = async (orderId) => {
  try {
    const { query } = require('../config/database');

    const orders = await query(`
      SELECT o.id, o.email, o.subtotal, o.shipping_amount, o.total_amount, o.notes
      FROM orders o WHERE o.id = ?
    `, [orderId]);

    if (!orders.length) return { sent: false, reason: 'order_not_found' };
    const order = orders[0];

    const items = await query(`
      SELECT oi.product_name AS name, oi.quantity, oi.unit_price AS price,
             oi.product_sku AS selectedSize
      FROM order_items oi WHERE oi.order_id = ?
    `, [orderId]);

    const payments = await query(`
      SELECT payment_method FROM payments WHERE order_id = ? LIMIT 1
    `, [orderId]);
    const paymentMethod = payments[0]?.payment_method || 'credit_card';

    let firstName = '';
    let shippingAddress = {};
    try {
      const notes = JSON.parse(order.notes || '{}');
      const fullName = notes.customer_name || '';
      firstName = fullName.split(' ')[0] || '';
      shippingAddress = {
        firstName:     firstName,
        lastName:      fullName.split(' ').slice(1).join(' '),
        streetAddress: notes.shipping_address || '',
        city:          notes.shipping_city || '',
        postalCode:    notes.shipping_postal_code || '',
        country:       notes.shipping_country || ''
      };
    } catch (e) { /* notes non parsable */ }

    return sendOrderConfirmationEmail(order.email, {
      firstName,
      orderId,
      items: items.map(it => ({
        name:         it.name,
        quantity:     it.quantity,
        price:        parseFloat(it.price) || 0,
        selectedSize: it.selectedSize || null
      })),
      subtotal:     parseFloat(order.subtotal)       || 0,
      shippingCost: parseFloat(order.shipping_amount) || 0,
      total:        parseFloat(order.total_amount)    || 0,
      shippingAddress,
      paymentMethod
    });
  } catch (err) {
    console.error(`[Email] Erreur sendOrderConfirmationById(${orderId}):`, err.message);
    return { sent: false, reason: err.message };
  }
};

// ─── Email de changement de statut commande ──────────────────────────────────
const ORDER_STATUS_CONFIG = {
  processing:  { label: 'En traitement',     icon: '⚙️',  color: '#1565c0', text: 'Votre commande est en cours de préparation dans notre atelier.' },
  shipped:     { label: 'Expédiée',           icon: '🚚',  color: '#2e7d32', text: 'Votre commande a été expédiée et est en route vers vous.' },
  delivered:   { label: 'Livrée',             icon: '✅',  color: '#2e7d32', text: 'Votre commande a été livrée avec succès. Merci pour votre confiance !' },
  cancelled:   { label: 'Annulée',            icon: '❌',  color: '#c62828', text: 'Votre commande a été annulée. Contactez-nous si vous avez des questions.' },
  confirmed:   { label: 'Confirmée',          icon: '✅',  color: '#2e7d32', text: 'Votre commande a été confirmée et sera bientôt traitée.' },
  pending:     { label: 'En attente',         icon: '⏳',  color: '#e65100', text: 'Votre commande est en attente de traitement.' }
};

const sendOrderStatusEmail = async (toEmail, { firstName, orderId, status, trackingNumber, customMessage }) => {
  const transporter = createTransporter();
  const cfg = ORDER_STATUS_CONFIG[status] || { label: status, icon: '📦', color: '#555', text: '' };

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <tr>
        <td style="background:#1a1a1a;padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#c9a96e;font-size:24px;letter-spacing:3px;font-weight:400;">BOURBON MORELLI</h1>
          <p style="margin:6px 0 0;color:#888;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Maison de Luxe</p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9f5ef;padding:28px 40px;text-align:center;border-bottom:3px solid ${cfg.color};">
          <p style="margin:0 0 6px;font-size:28px;">${cfg.icon}</p>
          <h2 style="margin:0;color:#1a1a1a;font-size:20px;font-weight:400;">Commande ${cfg.label}</h2>
        </td>
      </tr>
      <tr>
        <td style="padding:36px 40px;">
          <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.7;">
            Bonjour <strong>${firstName || 'cher client'}</strong>,
          </p>
          <p style="margin:0 0 20px;color:#555;font-size:15px;line-height:1.7;">
            ${cfg.text}
          </p>
          <div style="background:#f9f9f9;border-left:4px solid ${cfg.color};border-radius:4px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0;color:#333;font-size:14px;">
              <strong>N° de commande :</strong> ${orderId}<br/>
              <strong>Statut :</strong> <span style="color:${cfg.color};font-weight:bold;">${cfg.label}</span>
              ${trackingNumber ? `<br/><strong>Numéro de suivi :</strong> ${trackingNumber}` : ''}
            </p>
          </div>
          ${customMessage ? `
          <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0 0 8px;color:#555;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Message de notre équipe</p>
            <p style="margin:0;color:#333;font-size:14px;line-height:1.7;">${customMessage.replace(/\n/g, '<br/>')}</p>
          </div>` : ''}
          <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr>
              <td style="background:#c9a96e;border-radius:4px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/account/orders"
                   style="display:inline-block;padding:12px 32px;color:#fff;font-size:14px;text-decoration:none;letter-spacing:1px;">
                  Voir ma commande
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="background:#f9f9f9;padding:20px 40px;border-top:1px solid #eee;text-align:center;">
          <p style="margin:0;color:#aaa;font-size:12px;">
            © ${new Date().getFullYear()} BOURBON MORELLI — <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/contact" style="color:#c9a96e;">Nous contacter</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  if (!transporter) {
    console.log(`📧 [EMAIL non configuré] Statut commande #${orderId} (${status}) → ${toEmail}`);
    return { sent: false, reason: 'not_configured' };
  }
  try {
    await transporter.sendMail({
      from: `"BOURBON MORELLI" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `${cfg.icon} Commande N° ${orderId} — ${cfg.label} — BOURBON MORELLI`,
      html
    });
    console.log(`📧 Email statut "${status}" commande #${orderId} → ${toEmail}`);
    return { sent: true };
  } catch (err) {
    console.error(`📧 Erreur email statut:`, err.message);
    return { sent: false, reason: err.message };
  }
};

// ─── Email de statut à partir de l'ID commande ───────────────────────────────
const sendOrderStatusEmailById = async (orderId, status, options = {}) => {
  try {
    const { query } = require('../config/database');
    const rows = await query('SELECT email, notes FROM orders WHERE id = ? LIMIT 1', [orderId]);
    if (!rows.length) return { sent: false, reason: 'order_not_found' };
    const order = rows[0];
    let firstName = '';
    try {
      const notes = JSON.parse(order.notes || '{}');
      firstName = (notes.customer_name || '').split(' ')[0] || '';
    } catch (e) {}
    return sendOrderStatusEmail(order.email, { firstName, orderId, status, ...options });
  } catch (err) {
    console.error(`[Email] sendOrderStatusEmailById(${orderId}):`, err.message);
    return { sent: false, reason: err.message };
  }
};

// ─── Réponse à un message de contact ─────────────────────────────────────────
const sendContactReplyEmail = async (toEmail, { recipientName, originalSubject, originalMessage, replyText }) => {
  const transporter = createTransporter();

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <tr>
        <td style="background:#1a1a1a;padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#c9a96e;font-size:24px;letter-spacing:3px;font-weight:400;">BOURBON MORELLI</h1>
          <p style="margin:6px 0 0;color:#888;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Maison de Luxe</p>
        </td>
      </tr>
      <tr>
        <td style="padding:40px 40px 32px;">
          <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:20px;font-weight:400;">Réponse à votre message</h2>
          <p style="margin:0 0 12px;color:#555;font-size:15px;line-height:1.7;">
            Bonjour <strong>${recipientName || 'cher client'}</strong>,
          </p>
          <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.7;">
            Merci de nous avoir contactés. Voici notre réponse à votre message :
          </p>

          <!-- Réponse de l'équipe -->
          <div style="background:#f9f5ef;border-left:4px solid #c9a96e;border-radius:4px;padding:20px 24px;margin-bottom:28px;">
            <p style="margin:0 0 6px;color:#c9a96e;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:bold;">Notre réponse</p>
            <p style="margin:0;color:#333;font-size:15px;line-height:1.8;">${replyText.replace(/\n/g, '<br/>')}</p>
          </div>

          <!-- Message original -->
          <div style="background:#f5f5f5;border-radius:4px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0 0 8px;color:#999;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Votre message original — ${originalSubject || ''}</p>
            <p style="margin:0;color:#777;font-size:13px;line-height:1.6;">${(originalMessage || '').replace(/\n/g, '<br/>')}</p>
          </div>

          <p style="margin:0;color:#888;font-size:13px;line-height:1.6;">
            Pour toute question complémentaire, n'hésitez pas à nous recontacter via
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/contact" style="color:#c9a96e;">notre formulaire de contact</a>.
          </p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9f9f9;padding:20px 40px;border-top:1px solid #eee;text-align:center;">
          <p style="margin:0;color:#aaa;font-size:12px;">© ${new Date().getFullYear()} BOURBON MORELLI — Tous droits réservés</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  if (!transporter) {
    console.log(`📧 [EMAIL non configuré] Réponse contact → ${toEmail}`);
    return { sent: false, reason: 'not_configured' };
  }
  try {
    await transporter.sendMail({
      from: `"BOURBON MORELLI" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `RE : ${originalSubject || 'Votre message'} — BOURBON MORELLI`,
      html
    });
    return { sent: true };
  } catch (err) {
    console.error('📧 Erreur réponse contact:', err.message);
    return { sent: false, reason: err.message };
  }
};

module.exports = {
  sendResetPasswordEmail,
  sendOrderConfirmationEmail,
  sendOrderConfirmationById,
  sendOrderStatusEmail,
  sendOrderStatusEmailById,
  sendContactReplyEmail
};
