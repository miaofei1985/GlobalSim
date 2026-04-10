import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const verificationTemplates = {
  'zh-CN': {
    subject: '【GlobalSim】您的验证码',
    greeting: '尊敬的 GlobalSim 用户，',
    body: '感谢您注册 GlobalSim，请使用以下验证码完成邮箱验证：',
    codeLabel: '验证码',
    expiry: '此验证码将在 10 分钟后失效。',
    footer: '如果这不是您的操作，请忽略此邮件。'
  },
  en: {
    subject: '[GlobalSim] Your verification code',
    greeting: 'Dear GlobalSim user,',
    body: 'Thank you for registering with GlobalSim. Please use the verification code below to verify your email:',
    codeLabel: 'Verification code',
    expiry: 'This code will expire in 10 minutes.',
    footer: 'If this was not you, please ignore this email.'
  },
  hi: {
    subject: '[GlobalSim] आपका सत्यापन कोड',
    greeting: 'प्रिय GlobalSim उपयोगकर्ता,',
    body: 'GlobalSim में पंजीकरण करने के लिए धन्यवाद। कृपया अपना ईमेल सत्यापित करने के लिए नीचे दिया गया कोड उपयोग करें:',
    codeLabel: 'सत्यापन कोड',
    expiry: 'यह कोड 10 मिनट में समाप्त हो जाएगा।',
    footer: 'यदि यह आपने नहीं किया है, तो इस ईमेल को अनदेखा करें।'
  },
  es: {
    subject: '[GlobalSim] Su código de verificación',
    greeting: 'Estimado usuario de GlobalSim,',
    body: 'Gracias por registrarse en GlobalSim. Utilice el siguiente código para verificar su correo electrónico:',
    codeLabel: 'Código de verificación',
    expiry: 'Este código caducará en 10 minutos.',
    footer: 'Si no fue usted, ignore este correo.'
  },
  ar: {
    subject: '[GlobalSim] رمز التحقق الخاص بك',
    greeting: 'عزيزي مستخدم GlobalSim،',
    body: 'شكرًا لتسجيلك في GlobalSim. يرجى استخدام الرمز التالي للتحقق من بريدك الإلكتروني:',
    codeLabel: 'رمز التحقق',
    expiry: 'ستنتهي صلاحية هذا الرمز خلال 10 دقائق.',
    footer: 'إذا لم يكن هذا منك، فيرجى تجاهل هذه الرسالة.'
  },
  bn: {
    subject: '[GlobalSim] আপনার যাচাইকরণ কোড',
    greeting: 'প্রিয় GlobalSim ব্যবহারকারী,',
    body: 'GlobalSim-এ নিবন্ধন করার জন্য ধন্যবাদ। আপনার ইমেল যাচাই করতে নিচের কোডটি ব্যবহার করুন:',
    codeLabel: 'যাচাইকরণ কোড',
    expiry: 'এই কোডটি 10 মিনিটের মধ্যে মেয়াদোত্তীর্ণ হবে।',
    footer: 'এটি আপনি না হলে এই ইমেলটি উপেক্ষা করুন।'
  },
  'pt-BR': {
    subject: '[GlobalSim] Seu código de verificação',
    greeting: 'Prezado usuário GlobalSim,',
    body: 'Obrigado por se cadastrar no GlobalSim. Use o código abaixo para verificar seu e-mail:',
    codeLabel: 'Código de verificação',
    expiry: 'Este código expirará em 10 minutos.',
    footer: 'Se não foi você, ignore este e-mail.'
  },
  ru: {
    subject: '[GlobalSim] Ваш код подтверждения',
    greeting: 'Уважаемый пользователь GlobalSim,',
    body: 'Спасибо за регистрацию в GlobalSim. Используйте код ниже, чтобы подтвердить свою почту:',
    codeLabel: 'Код подтверждения',
    expiry: 'Срок действия кода истечет через 10 минут.',
    footer: 'Если это были не вы, просто проигнорируйте письмо.'
  },
  ja: {
    subject: '[GlobalSim] 認証コード',
    greeting: 'GlobalSim ユーザー様',
    body: 'GlobalSim へのご登録ありがとうございます。メール認証のため、以下のコードをご利用ください。',
    codeLabel: '認証コード',
    expiry: 'このコードは 10 分後に期限切れになります。',
    footer: 'お心当たりがない場合は、このメールを無視してください。'
  },
  fr: {
    subject: '[GlobalSim] Votre code de vérification',
    greeting: 'Cher utilisateur GlobalSim,',
    body: 'Merci pour votre inscription à GlobalSim. Utilisez le code ci-dessous pour vérifier votre e-mail :',
    codeLabel: 'Code de vérification',
    expiry: 'Ce code expirera dans 10 minutes.',
    footer: "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail."
  }
};

const createTransporter = () => {
  if (process.env.RESEND_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: Number(process.env.RESEND_SMTP_PORT || 587),
      secure: false,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY
      }
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const buildHtmlContent = (template, code, locale) => `
  <!DOCTYPE html>
  <html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #111827; background: #f3f4f6; margin: 0; padding: 24px; }
        .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08); }
        .logo { font-size: 24px; font-weight: 700; color: #2563eb; margin-bottom: 16px; }
        .code-box { margin: 24px 0; border: 2px dashed #2563eb; border-radius: 12px; padding: 20px; text-align: center; background: #eff6ff; }
        .code-label { font-size: 13px; color: #4b5563; margin-bottom: 8px; }
        .code { font-size: 34px; letter-spacing: 8px; font-weight: 700; color: #1d4ed8; }
        .footer { margin-top: 24px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">GlobalSim</div>
        <p>${template.greeting}</p>
        <p>${template.body}</p>
        <div class="code-box">
          <div class="code-label">${template.codeLabel}</div>
          <div class="code">${code}</div>
        </div>
        <p>${template.expiry}</p>
        <p class="footer">${template.footer}</p>
      </div>
    </body>
  </html>
`;

export const sendVerificationEmail = async (email, code, locale = 'zh-CN') => {
  const template = verificationTemplates[locale] || verificationTemplates.en;
  const provider = process.env.RESEND_API_KEY ? 'resend-api' : 'smtp';
  const fromAddress =
    process.env.RESEND_FROM ||
    process.env.EMAIL_FROM ||
    'GlobalSim <onboarding@resend.dev>';
  const html = buildHtmlContent(template, code, locale);

  try {
    if (process.env.RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [email],
          subject: template.subject,
          html
        })
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Resend API error ${response.status}: ${body}`);
      }
    } else {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: fromAddress,
        to: email,
        subject: template.subject,
        html
      });
    }

    console.log(`[email] Verification email sent via ${provider} to ${email} (${locale})`);
    return true;
  } catch (error) {
    console.error(`[email] Failed to send verification email via ${provider}:`, error);
    throw error;
  }
};

export default { sendVerificationEmail };
