import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Email templates for 10 languages
const emailTemplates = {
  'zh-CN': {
    subject: '【GlobalSim】您的验证码',
    greeting: '尊敬的 GlobalSim 用户，',
    body: '感谢您注册 GlobalSim 寰宇模拟盘！请使用以下验证码完成邮箱验证：',
    codeLabel: '验证码',
    expiry: '此验证码将在 10 分钟后失效。',
    footer: '如果您未请求注册，请忽略此邮件。',
  },
  'en': {
    subject: '[GlobalSim] Your Verification Code',
    greeting: 'Dear GlobalSim User,',
    body: 'Thank you for registering with GlobalSim! Please use the following verification code to complete your email verification:',
    codeLabel: 'Verification Code',
    expiry: 'This code will expire in 10 minutes.',
    footer: 'If you did not request this registration, please ignore this email.',
  },
  'hi': {
    subject: '[GlobalSim] आपका सत्यापन कोड',
    greeting: 'प्रिय GlobalSim उपयोगकर्ता,',
    body: 'GlobalSim में पंजीकरण करने के लिए धन्यवाद! कृपया अपने ईमेल सत्यापन को पूरा करने के लिए निम्नलिखित सत्यापन कोड का उपयोग करें:',
    codeLabel: 'सत्यापन कोड',
    expiry: 'यह कोड 10 मिनट में समाप्त हो जाएगा।',
    footer: 'यदि आपने इस पंजीकरण का अनुरोध नहीं किया है, तो कृपया इस ईमेल को नजरअंदाज करें।',
  },
  'es': {
    subject: '[GlobalSim] Su código de verificación',
    greeting: 'Estimado usuario de GlobalSim,',
    body: '¡Gracias por registrarse en GlobalSim! Por favor, utilice el siguiente código de verificación para completar la verificación de su correo electrónico:',
    codeLabel: 'Código de verificación',
    expiry: 'Este código caducará en 10 minutos.',
    footer: 'Si no solicitó este registro, ignore este correo electrónico.',
  },
  'ar': {
    subject: '[GlobalSim] رمز التحقق الخاص بك',
    greeting: 'عزيزي مستخدم GlobalSim،',
    body: 'شكرًا لتسجيلك في GlobalSim! يرجى استخدام رمز التحقق التالي لإكمال التحقق من بريدك الإلكتروني:',
    codeLabel: 'رمز التحقق',
    expiry: 'ستنتهي صلاحية هذا الرمز خلال 10 دقائق.',
    footer: 'إذا لم تطلب هذا التسجيل، يرجى تجاهل هذا البريد الإلكتروني.',
  },
  'bn': {
    subject: '[GlobalSim] আপনার যাচাইকরণ কোড',
    greeting: 'প্রিয় GlobalSim ব্যবহারকারী,',
    body: 'GlobalSim-এ নিবন্ধন করার জন্য আপনাকে ধন্যবাদ! আপনার ইমেল যাচাইকরণ সম্পন্ন করতে নিম্নলিখিত যাচাইকরণ কোডটি ব্যবহার করুন:',
    codeLabel: 'যাচাইকরণ কোড',
    expiry: 'এই কোডটি 10 মিনিটের মধ্যে মেয়াদোত্তীর্ণ হবে।',
    footer: 'আপনি যদি এই নিবন্ধনের অনুরোধ না করে থাকেন, তবে এই ইমেলটি উপেক্ষা করুন।',
  },
  'pt-BR': {
    subject: '[GlobalSim] Seu código de verificação',
    greeting: 'Prezado usuário GlobalSim,',
    body: 'Obrigado por se registrar no GlobalSim! Use o seguinte código de verificação para concluir a verificação do seu e-mail:',
    codeLabel: 'Código de verificação',
    expiry: 'Este código expirará em 10 minutos.',
    footer: 'Se você não solicitou este registro, ignore este e-mail.',
  },
  'ru': {
    subject: '[GlobalSim] Ваш код подтверждения',
    greeting: 'Уважаемый пользователь GlobalSim,',
    body: 'Спасибо за регистрацию в GlobalSim! Пожалуйста, используйте следующий код подтверждения для завершения проверки вашей электронной почты:',
    codeLabel: 'Код подтверждения',
    expiry: 'Этот код действителен в течение 10 минут.',
    footer: 'Если вы не запрашивали эту регистрацию, проигнорируйте это письмо.',
  },
  'ja': {
    subject: '[GlobalSim] 認証コード',
    greeting: 'GlobalSim ユーザー様',
    body: 'GlobalSim にご登録いただきありがとうございます！以下の認証コードを使用して、メール認証を完了してください：',
    codeLabel: '認証コード',
    expiry: 'このコードは 10 分後に有効期限が切れます。',
    footer: 'この登録をリクエストしていない場合は、このメールを無視してください。',
  },
  'fr': {
    subject: '[GlobalSim] Votre code de vérification',
    greeting: 'Cher utilisateur GlobalSim,',
    body: 'Merci de vous être inscrit sur GlobalSim ! Veuillez utiliser le code de vérification suivant pour terminer la vérification de votre e-mail :',
    codeLabel: 'Code de vérification',
    expiry: 'Ce code expirera dans 10 minutes.',
    footer: 'Si vous n\'avez pas demandé cette inscription, veuillez ignorer cet e-mail.',
  },
};

export const sendVerificationEmail = async (email, code, locale = 'zh-CN') => {
  const template = emailTemplates[locale] || emailTemplates['en'];
  
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="${locale}" dir="${['ar'].includes(locale) ? 'rtl' : 'ltr'}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background: #f9f9f9; border-radius: 8px; padding: 30px; text-align: center; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 20px; }
        .code-box { background: #fff; border: 2px dashed #2563eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🌍 GlobalSim</div>
        <p>${template.greeting}</p>
        <p>${template.body}</p>
        <div class="code-box">
          <div>${template.codeLabel}</div>
          <div class="code">${code}</div>
        </div>
        <p><small>${template.expiry}</small></p>
        <p class="footer">${template.footer}</p>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'GlobalSim <noreply@globalsim.com>',
      to: email,
      subject: template.subject,
      html: htmlContent,
    });
    console.log(`✅ Verification email sent to ${email} (${locale})`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    throw error;
  }
};

export default { sendVerificationEmail };
