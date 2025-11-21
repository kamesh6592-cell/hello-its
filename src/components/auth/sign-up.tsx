"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { SocialAuthenticationProvider } from "app-types/authentication";
import SocialProviders from "./social-providers";
import { Mail } from "lucide-react";
import { authClient } from "auth/client";
import { toast } from "sonner";
import { startTransition } from "react";

export default function SignUpPage({
  emailAndPasswordEnabled,
  socialAuthenticationProviders,
  isFirstUser,
}: {
  emailAndPasswordEnabled: boolean;
  socialAuthenticationProviders: SocialAuthenticationProvider[];
  isFirstUser: boolean;
}) {
  const t = useTranslations();
  const handleSocialSignIn = (provider: SocialAuthenticationProvider) => {
    startTransition(async () => {
      try {
        await authClient.signIn.social({ provider });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Unknown error");
      }
    });
  };
  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Glassmorphism container */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20" />
      
      {/* Content */}
      <div className="relative p-8 space-y-6">
        {/* Logo */}
        <div className="flex justify-center mb-2">
          <img
            src="/aj-logo.jpg"
            alt="AJ Mailer"
            width={120}
            height={120}
            className="object-cover rounded-full"
          />
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold text-white">
            {isFirstUser ? t("Auth.SignUp.titleAdmin") : t("Auth.SignUp.title")}
          </h1>
          <p className="text-white/70 text-sm">
            {isFirstUser
              ? t("Auth.SignUp.signUpDescriptionAdmin")
              : t("Auth.SignUp.signUpDescription")}
          </p>
        </div>

        {/* Email Button */}
        {emailAndPasswordEnabled && (
          <Link
            href="/sign-up/email"
            data-testid="email-signup-button"
            className="block"
          >
            <Button
              className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl backdrop-blur-sm h-12 text-base font-medium transition-all duration-200"
            >
              <Mail className="size-5 mr-2" />
              {t("Auth.SignUp.email")}
            </Button>
          </Link>
        )}

        {/* Social Providers */}
        {socialAuthenticationProviders.length > 0 && (
          <>
            {emailAndPasswordEnabled && (
              <div className="flex items-center my-6">
                <div className="flex-1 h-px bg-white/20"></div>
                <span className="px-4 text-sm text-white/60">
                  {t("Auth.SignIn.orContinueWith")}
                </span>
                <div className="flex-1 h-px bg-white/20"></div>
              </div>
            )}
            <SocialProviders
              socialAuthenticationProviders={socialAuthenticationProviders}
              onSocialProviderClick={handleSocialSignIn}
            />
          </>
        )}

        {/* Sign In Link */}
        <div className="text-center pt-4">
          <p className="text-white/70 text-sm">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-white hover:text-white/90 font-medium underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
