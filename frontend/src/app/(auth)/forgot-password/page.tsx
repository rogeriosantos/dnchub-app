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
