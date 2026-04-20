# Template de e-mail (Reset de Senha)

Use este modelo no Firebase Console para personalizar o e-mail de redefinicao de senha da PetCorner.

## 1) Configurar URL de acao customizada

No Firebase Console:

1. `Authentication` -> `Templates`.
2. Edite o template de **Password reset**.
3. Clique em **Customize action URL**.
4. Informe a URL da tela customizada da app:

```text
https://SEU_DOMINIO/app-react/reset-password
```

Em ambiente local:

```text
http://localhost:3001/app-react/reset-password
```

## 2) Assunto sugerido

```text
Redefina sua senha no %APP_NAME%
```

## 3) Corpo HTML sugerido

```html
<table width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; background:#fdf6f2; padding:24px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius:16px; border:1px solid #f2d6c0; padding:24px;">
        <tr>
          <td style="font-size:24px; font-weight:700; color:#1a2f3a; padding-bottom:8px;">
            PetCorner
          </td>
        </tr>
        <tr>
          <td style="font-size:16px; color:#3d4b54; line-height:1.6; padding-bottom:20px;">
            Recebemos uma solicitacao para redefinir sua senha.
            Se foi voce, clique no botao abaixo para criar uma nova senha.
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-bottom:20px;">
            <a href="%LINK%" style="display:inline-block; background:linear-gradient(135deg,#fb8b24 0%,#e36414 100%); color:#ffffff; text-decoration:none; padding:12px 20px; border-radius:12px; font-weight:700;">
              Redefinir senha
            </a>
          </td>
        </tr>
        <tr>
          <td style="font-size:13px; color:#6a747b; line-height:1.5;">
            Se voce nao solicitou esta alteracao, ignore este e-mail.
            Este link expira automaticamente por seguranca.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

## 4) Observacoes

- O link de acao usa `%LINK%` (placeholder do Firebase).
- A tela customizada implementada na app processa `mode`, `oobCode`, `apiKey`, `continueUrl` e `lang`.
- Quando o reset conclui, o usuario recebe o atalho para voltar ao login.
