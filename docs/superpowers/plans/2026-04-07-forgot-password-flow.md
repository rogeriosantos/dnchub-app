# Forgot Password Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full forgot-password / reset-password flow — email input page, token-based email delivery, and new-password page.

**Architecture:** User submits email → backend generates a short-lived (1h) signed token, stores its SHA-256 hash in the `users` table, sends reset link via SMTP. User clicks link → `/reset-password?token=<raw>` page → backend verifies hash, updates password, clears token fields.

**Tech Stack:** FastAPI + SQLAlchemy + Alembic (backend); Next.js App Router + react-hook-form + zod + shadcn/ui + react-i18next (frontend); SMTP via existing `MessagingService`.

---

## File Map

### Backend — create
- `backend/alembic/versions/20260407_000001_add_password_reset_to_users.py` — adds `password_reset_token` + `password_reset_expires` columns to `users`
- *(modify)* `backend/app/shared/models/user.py` — add two new mapped columns
- *(modify)* `backend/app/shared/schemas/auth.py` — add `ForgotPasswordRequest`, `ForgotPasswordResponse`, `ResetPasswordRequest`, `ResetPasswordResponse`
- *(modify)* `backend/app/shared/services/messaging.py` — add `send_password_reset_email`
- *(modify)* `backend/app/shared/services/auth.py` — add `forgot_password`, `reset_password` methods
- *(modify)* `backend/app/shared/api/auth.py` — register two new endpoints

### Frontend — create
- `frontend/src/app/(auth)/forgot-password/page.tsx` — email form, shows success state after submit
- `frontend/src/app/(auth)/reset-password/page.tsx` — new password form, reads `?token` from URL
- *(modify)* `frontend/src/lib/api/auth.ts` — add `forgotPassword`, `resetPassword` API calls
- *(modify)* `frontend/src/contexts/auth-context.tsx` — add `/reset-password` to `PUBLIC_ROUTES`
- *(modify)* `frontend/src/lib/i18n/locales/en.json` — add `auth.forgotPassword.*` and `auth.resetPassword.*` keys
- *(modify)* `frontend/src/lib/i18n/locales/pt.json` — same keys in Portuguese

---

## Task 1: DB Migration — add reset token columns to users

**Files:**
- Create: `backend/alembic/versions/20260407_000001_add_password_reset_to_users.py`
- Modify: `backend/app/shared/models/user.py`

- [ ] **Step 1: Create the migration file**

```python
# backend/alembic/versions/20260407_000001_add_password_reset_to_users.py
"""add_password_reset_to_users

Revision ID: a1b2c3d4e5f6
Revises: 39ae89ae2feb
Create Date: 2026-04-07 00:00:01.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '39ae89ae2feb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column(
        'password_reset_token', sa.String(length=255), nullable=True
    ))
    op.add_column('users', sa.Column(
        'password_reset_expires', sa.DateTime(timezone=True), nullable=True
    ))


def downgrade() -> None:
    op.drop_column('users', 'password_reset_expires')
    op.drop_column('users', 'password_reset_token')
```

- [ ] **Step 2: Add columns to the User model**

In `backend/app/shared/models/user.py`, add after the `last_login` column (line 36):

```python
    password_reset_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    password_reset_expires: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
```

- [ ] **Step 3: Run migration locally to verify it applies cleanly**

```bash
cd backend
uv run alembic upgrade head
```

Expected: `INFO [alembic.runtime.migration] Running upgrade 39ae89ae2feb -> a1b2c3d4e5f6`

- [ ] **Step 4: Commit**

```bash
git add backend/alembic/versions/20260407_000001_add_password_reset_to_users.py
git add backend/app/shared/models/user.py
git commit -m "feat: add password_reset_token and password_reset_expires to users"
```

---

## Task 2: Backend — add config, schemas, and messaging

**Files:**
- Modify: `backend/app/core/config.py`
- Modify: `backend/app/shared/schemas/auth.py`
- Modify: `backend/app/shared/services/messaging.py`

- [ ] **Step 1: Add `frontend_url` to settings**

In `backend/app/core/config.py`, add after `log_level`:

```python
    # Frontend URL (for password reset links)
    frontend_url: str = "http://localhost:3000"
```

- [ ] **Step 2: Add new schemas to `auth.py`**

In `backend/app/shared/schemas/auth.py`, append after the `MessagingChannelsResponse` class:

```python
class ForgotPasswordRequest(BaseSchema):
    """Request to initiate password reset."""
    email: EmailStr


class ForgotPasswordResponse(BaseSchema):
    """Response for forgot password request (always success to prevent enumeration)."""
    message: str


class ResetPasswordRequest(BaseSchema):
    """Request to complete password reset."""
    token: str
    new_password: str = Field(..., min_length=8)


class ResetPasswordResponse(BaseSchema):
    """Response for reset password request."""
    message: str
```

- [ ] **Step 3: Add password reset email method to MessagingService**

In `backend/app/shared/services/messaging.py`, add this method before `get_available_channels`:

```python
    def send_password_reset_email(
        self,
        to_email: str,
        user_name: str,
        reset_url: str,
    ) -> bool:
        """Send password reset email to user."""
        subject = "Reset your DNC Manager password"

        body_text = f"""
Hello {user_name},

We received a request to reset your DNC Manager password.

Click the link below to set a new password (valid for 1 hour):

{reset_url}

If you did not request this, you can safely ignore this email — your password will not change.

Best regards,
DNC Manager Team
"""

        body_html = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #f97316; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .btn {{ display: inline-block; background-color: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }}
        .note {{ color: #6b7280; font-size: 13px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header"><h1>DNC Manager</h1></div>
        <div class="content">
            <h2>Hello {user_name},</h2>
            <p>We received a request to reset your password.</p>
            <p>
                <a href="{reset_url}" class="btn">Reset Password</a>
            </p>
            <p>This link is valid for <strong>1 hour</strong>.</p>
            <p class="note">If you did not request a password reset, ignore this email — your password will not change.</p>
            <p>Best regards,<br>DNC Manager Team</p>
        </div>
    </div>
</body>
</html>
"""

        return self.send_email(to_email, subject, body_text, body_html)
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/core/config.py backend/app/shared/schemas/auth.py backend/app/shared/services/messaging.py
git commit -m "feat: add password reset schemas and email template"
```

---

## Task 3: Backend — forgot_password and reset_password service methods

**Files:**
- Modify: `backend/app/shared/services/auth.py`

- [ ] **Step 1: Add imports at the top of auth.py**

The file already imports `datetime`, `timezone`. Add `hashlib`, `secrets`, `timedelta` to the existing import block:

```python
import hashlib
import random
import secrets
import string
from datetime import datetime, timedelta, timezone
```

Replace the existing `from datetime import datetime, timezone` line with the above.

- [ ] **Step 2: Add `forgot_password` method to `AuthService`**

Add after the `register` method (before `reset_employee_pin`):

```python
    def forgot_password(
        self,
        db: Session,
        email: str,
    ) -> None:
        """Initiate password reset. Silent on unknown email to prevent enumeration."""
        from app.core.config import settings
        from app.shared.services.messaging import messaging_service

        result = db.execute(
            select(User).where(
                User.email == email,
                User.is_active == True,
                User.deleted_at.is_(None),
            )
        )
        user = result.scalar_one_or_none()

        if user is None:
            return  # Silent — do not reveal whether email exists

        # Generate token: raw value goes in the email, hash is stored in DB
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

        user.password_reset_token = token_hash
        user.password_reset_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        db.add(user)
        db.commit()

        reset_url = f"{settings.frontend_url}/reset-password?token={raw_token}"
        messaging_service.send_password_reset_email(
            to_email=user.email,
            user_name=user.first_name,
            reset_url=reset_url,
        )

    def reset_password(
        self,
        db: Session,
        raw_token: str,
        new_password: str,
    ) -> None:
        """Complete password reset using the token from the email link."""
        from app.core.security import get_password_hash

        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        now = datetime.now(timezone.utc)

        result = db.execute(
            select(User).where(
                User.password_reset_token == token_hash,
                User.password_reset_expires > now,
                User.is_active == True,
                User.deleted_at.is_(None),
            )
        )
        user = result.scalar_one_or_none()

        if user is None:
            raise ValidationError("Invalid or expired reset link. Please request a new one.")

        user.password_hash = get_password_hash(new_password)
        user.password_reset_token = None
        user.password_reset_expires = None
        db.add(user)
        db.commit()
```

- [ ] **Step 3: Export new schemas in `__init__.py`**

Check `backend/app/schemas/__init__.py` and add:

```python
from app.shared.schemas.auth import (
    # ... existing imports ...
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
)
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/shared/services/auth.py backend/app/schemas/__init__.py
git commit -m "feat: add forgot_password and reset_password to AuthService"
```

---

## Task 4: Backend — register the two new endpoints

**Files:**
- Modify: `backend/app/shared/api/auth.py`

- [ ] **Step 1: Add imports at the top of auth.py**

Add `ForgotPasswordRequest`, `ForgotPasswordResponse`, `ResetPasswordRequest`, `ResetPasswordResponse` to the existing `from app.schemas import (...)` block.

- [ ] **Step 2: Add the two endpoints after the `/register` route**

```python
@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(
    request: ForgotPasswordRequest,
    db: DBDep,
) -> ForgotPasswordResponse:
    """Initiate password reset. Always returns 200 to prevent email enumeration."""
    auth_service.forgot_password(db, request.email)
    return ForgotPasswordResponse(
        message="If an account with that email exists, a reset link has been sent."
    )


@router.post("/reset-password", response_model=ResetPasswordResponse)
def reset_password(
    request: ResetPasswordRequest,
    db: DBDep,
) -> ResetPasswordResponse:
    """Complete password reset using token from email."""
    auth_service.reset_password(db, request.token, request.new_password)
    return ResetPasswordResponse(message="Password has been reset successfully.")
```

- [ ] **Step 3: Verify the API starts cleanly**

```bash
cd backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Expected: server starts, navigate to `http://localhost:8000/docs` — confirm `POST /api/v1/auth/forgot-password` and `POST /api/v1/auth/reset-password` appear.

- [ ] **Step 4: Commit**

```bash
git add backend/app/shared/api/auth.py
git commit -m "feat: add forgot-password and reset-password endpoints"
```

---

## Task 5: Frontend — i18n keys

**Files:**
- Modify: `frontend/src/lib/i18n/locales/en.json`
- Modify: `frontend/src/lib/i18n/locales/pt.json`

- [ ] **Step 1: Add keys to `en.json`**

Inside the `"auth"` object (after `"register": {...},`), add:

```json
"forgotPassword": {
  "title": "Forgot password?",
  "subtitle": "Enter your email and we'll send you a reset link.",
  "email": "Email address",
  "emailPlaceholder": "name@company.com",
  "submit": "Send reset link",
  "submitting": "Sending...",
  "backToLogin": "Back to login",
  "successTitle": "Check your email",
  "successMessage": "If an account with that email exists, we've sent a password reset link. It expires in 1 hour.",
  "errorGeneric": "Something went wrong. Please try again."
},
"resetPassword": {
  "title": "Set new password",
  "subtitle": "Enter your new password below.",
  "newPassword": "New password",
  "newPasswordPlaceholder": "At least 8 characters",
  "confirmPassword": "Confirm password",
  "confirmPasswordPlaceholder": "Repeat your new password",
  "submit": "Reset password",
  "submitting": "Resetting...",
  "successTitle": "Password reset!",
  "successMessage": "Your password has been updated. You can now sign in.",
  "goToLogin": "Go to login",
  "invalidToken": "This reset link is invalid or has expired.",
  "passwordMismatch": "Passwords do not match.",
  "errorGeneric": "Something went wrong. Please try again."
}
```

- [ ] **Step 2: Add same keys to `pt.json`**

Inside the `"auth"` object (after `"register": {...},`), add:

```json
"forgotPassword": {
  "title": "Esqueceu a palavra-passe?",
  "subtitle": "Introduza o seu email e enviaremos um link de recuperação.",
  "email": "Endereço de email",
  "emailPlaceholder": "nome@empresa.com",
  "submit": "Enviar link de recuperação",
  "submitting": "A enviar...",
  "backToLogin": "Voltar ao login",
  "successTitle": "Verifique o seu email",
  "successMessage": "Se existir uma conta com esse email, enviámos um link de recuperação. Expira em 1 hora.",
  "errorGeneric": "Ocorreu um erro. Por favor tente novamente."
},
"resetPassword": {
  "title": "Definir nova palavra-passe",
  "subtitle": "Introduza a sua nova palavra-passe abaixo.",
  "newPassword": "Nova palavra-passe",
  "newPasswordPlaceholder": "Pelo menos 8 caracteres",
  "confirmPassword": "Confirmar palavra-passe",
  "confirmPasswordPlaceholder": "Repita a nova palavra-passe",
  "submit": "Redefinir palavra-passe",
  "submitting": "A redefinir...",
  "successTitle": "Palavra-passe redefinida!",
  "successMessage": "A sua palavra-passe foi atualizada. Pode iniciar sessão agora.",
  "goToLogin": "Ir para o login",
  "invalidToken": "Este link de recuperação é inválido ou expirou.",
  "passwordMismatch": "As palavras-passe não coincidem.",
  "errorGeneric": "Ocorreu um erro. Por favor tente novamente."
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/i18n/locales/en.json frontend/src/lib/i18n/locales/pt.json
git commit -m "feat: add i18n keys for forgot-password and reset-password flows"
```

---

## Task 6: Frontend — API methods

**Files:**
- Modify: `frontend/src/lib/api/auth.ts`

- [ ] **Step 1: Read the current `auth.ts` to understand existing patterns**

- [ ] **Step 2: Add `forgotPassword` and `resetPassword` to the auth service**

Append to the `authService` object (before the closing `};`):

```typescript
async forgotPassword(email: string): Promise<void> {
  await apiClient.post("/auth/forgot-password", { email });
},

async resetPassword(token: string, newPassword: string): Promise<void> {
  await apiClient.post("/auth/reset-password", { token, new_password: newPassword });
},
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/api/auth.ts
git commit -m "feat: add forgotPassword and resetPassword API methods"
```

---

## Task 7: Frontend — add routes to PUBLIC_ROUTES

**Files:**
- Modify: `frontend/src/contexts/auth-context.tsx`

- [ ] **Step 1: Update `PUBLIC_ROUTES`**

In `frontend/src/contexts/auth-context.tsx`, update line 22:

```typescript
const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password", "/fleet/pos"];
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/contexts/auth-context.tsx
git commit -m "feat: add forgot-password and reset-password to public routes"
```

---

## Task 8: Frontend — `/forgot-password` page

**Files:**
- Create: `frontend/src/app/(auth)/forgot-password/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Truck, Mail, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { authService } from "@/lib/api";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const schema = z.object({
    email: z.string().email(t("validation.email")),
  });
  type FormData = z.infer<typeof schema>;

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await authService.forgotPassword(data.email);
      setSubmitted(true);
    } catch {
      setError(t("auth.forgotPassword.errorGeneric"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4">
            <Truck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">{t("app.name")}</h1>
          <p className="text-muted-foreground mt-1">{t("app.tagline")}</p>
        </div>

        <Card className="shadow-lg">
          {submitted ? (
            <>
              <CardHeader className="space-y-1">
                <div className="flex justify-center mb-2">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <CardTitle className="text-2xl text-center">{t("auth.forgotPassword.successTitle")}</CardTitle>
                <CardDescription className="text-center">{t("auth.forgotPassword.successMessage")}</CardDescription>
              </CardHeader>
              <CardFooter className="justify-center">
                <Button variant="outline" asChild>
                  <Link href="/login">{t("auth.forgotPassword.backToLogin")}</Link>
                </Button>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">{t("auth.forgotPassword.title")}</CardTitle>
                <CardDescription>{t("auth.forgotPassword.subtitle")}</CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("auth.forgotPassword.email")}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder={t("auth.forgotPassword.emailPlaceholder")}
                        className="pl-10"
                        autoComplete="email"
                        {...register("email")}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-3 pt-2">
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("auth.forgotPassword.submitting")}</>
                    ) : (
                      t("auth.forgotPassword.submit")
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/login">{t("auth.forgotPassword.backToLogin")}</Link>
                  </Button>
                </CardFooter>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/(auth)/forgot-password/page.tsx
git commit -m "feat: add forgot-password page"
```

---

## Task 9: Frontend — `/reset-password` page

**Files:**
- Create: `frontend/src/app/(auth)/reset-password/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Truck, Lock, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { authService } from "@/lib/api";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const schema = z.object({
    newPassword: z.string().min(8, t("validation.minLength", { count: 8 })),
    confirmPassword: z.string(),
  }).refine((d) => d.newPassword === d.confirmPassword, {
    message: t("auth.resetPassword.passwordMismatch"),
    path: ["confirmPassword"],
  });
  type FormData = z.infer<typeof schema>;

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (data: FormData) => {
    if (!token) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await authService.resetPassword(token, data.newPassword);
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("auth.resetPassword.errorGeneric");
      // Show specific invalid token message if backend returns 400
      if (message.toLowerCase().includes("invalid") || message.toLowerCase().includes("expired")) {
        setError(t("auth.resetPassword.invalidToken"));
      } else {
        setError(t("auth.resetPassword.errorGeneric"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>{t("auth.resetPassword.invalidToken")}</CardTitle>
            </CardHeader>
            <CardFooter>
              <Button asChild><Link href="/forgot-password">{t("auth.forgotPassword.title")}</Link></Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4">
            <Truck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">{t("app.name")}</h1>
          <p className="text-muted-foreground mt-1">{t("app.tagline")}</p>
        </div>

        <Card className="shadow-lg">
          {success ? (
            <>
              <CardHeader className="space-y-1">
                <div className="flex justify-center mb-2">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <CardTitle className="text-2xl text-center">{t("auth.resetPassword.successTitle")}</CardTitle>
                <CardDescription className="text-center">{t("auth.resetPassword.successMessage")}</CardDescription>
              </CardHeader>
              <CardFooter className="justify-center">
                <Button asChild><Link href="/login">{t("auth.resetPassword.goToLogin")}</Link></Button>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">{t("auth.resetPassword.title")}</CardTitle>
                <CardDescription>{t("auth.resetPassword.subtitle")}</CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">{t("auth.resetPassword.newPassword")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder={t("auth.resetPassword.newPasswordPlaceholder")}
                        className="pl-10"
                        autoComplete="new-password"
                        {...register("newPassword")}
                      />
                    </div>
                    {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t("auth.resetPassword.confirmPassword")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder={t("auth.resetPassword.confirmPasswordPlaceholder")}
                        className="pl-10"
                        autoComplete="new-password"
                        {...register("confirmPassword")}
                      />
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-3 pt-2">
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("auth.resetPassword.submitting")}</>
                    ) : (
                      t("auth.resetPassword.submit")
                    )}
                  </Button>
                </CardFooter>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/(auth)/reset-password/page.tsx
git commit -m "feat: add reset-password page"
```

---

## Task 10: Backend env var + deploy both

**Files:**
- Railway env var: `FRONTEND_URL`

- [ ] **Step 1: Set `FRONTEND_URL` in Railway**

```bash
cd backend
railway variables set FRONTEND_URL="https://dnchub.vercel.app"
```

- [ ] **Step 2: Deploy backend to Railway**

```bash
railway up --detach
```

- [ ] **Step 3: Deploy frontend to Vercel**

```bash
cd ../frontend
vercel --prod --scope team_j3mHs5Uj3wZCTIzRodYvlhP4
```

- [ ] **Step 4: Smoke test both new pages**

```bash
# Should return 200
curl -s -o /dev/null -w "%{http_code}" https://dnchub.vercel.app/forgot-password

# Backend endpoint should accept POST
curl -s -X POST https://fleet-optima-backend-production.up.railway.app/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@test.com"}'
# Expected: {"message":"If an account with that email exists, a reset link has been sent."}
```

- [ ] **Step 5: Verify `/forgot-password` renders in browser via Playwright**

Navigate to `https://dnchub.vercel.app/forgot-password` and take screenshot.  
Expected: form with email input and "Send reset link" button, no console errors.
