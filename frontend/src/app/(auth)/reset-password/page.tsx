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
    newPassword: z.string().min(8, t("validation.minLength", { min: 8 })),
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
              <Button asChild>
                <Link href="/forgot-password">{t("auth.forgotPassword.title")}</Link>
              </Button>
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
                <Button asChild>
                  <Link href="/login">{t("auth.resetPassword.goToLogin")}</Link>
                </Button>
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
