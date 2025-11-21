"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useObjectState } from "@/hooks/use-object-state";

import { Loader, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { safe } from "ts-safe";
import { authClient } from "auth/client";
import { toast } from "sonner";
import { GithubIcon } from "ui/github-icon";
import { GoogleIcon } from "ui/google-icon";
import { useTranslations } from "next-intl";
import { MicrosoftIcon } from "ui/microsoft-icon";
import { SocialAuthenticationProvider } from "app-types/authentication";

export default function SignIn({
  emailAndPasswordEnabled,
  signUpEnabled,
  socialAuthenticationProviders,
  isFirstUser,
}: {
  emailAndPasswordEnabled: boolean;
  signUpEnabled: boolean;
  socialAuthenticationProviders: SocialAuthenticationProvider[];
  isFirstUser: boolean;
}) {
  const t = useTranslations("Auth.SignIn");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useObjectState({
    email: "",
    password: "",
  });

  const emailAndPasswordSignIn = () => {
    setLoading(true);
    safe(() =>
      authClient.signIn.email(
        {
          email: formData.email,
          password: formData.password,
          callbackURL: "/",
        },
        {
          onError(ctx) {
            toast.error(ctx.error.message || ctx.error.statusText);
          },
        },
      ),
    )
      .watch(() => setLoading(false))
      .unwrap();
  };

  const handleSocialSignIn = (provider: SocialAuthenticationProvider) => {
    authClient.signIn.social({ provider }).catch((e) => {
      toast.error(e.error);
    });
  };
  return (
    <div className="w-[450px] max-w-[450px] transition-all duration-700 ease-out">
      <div className="relative">
        {/* Glass morphism card */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent rounded-3xl" />
        </div>

        {/* Content */}
        <div className="relative p-8 flex flex-col space-y-6">
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
          
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-white">Welcome Back</h1>
            <p className="text-white/70">Sign in to your account</p>
          </div>

          {emailAndPasswordEnabled && !isFirstUser && (
            <form onSubmit={(e) => { e.preventDefault(); emailAndPasswordSignIn(); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/90">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                  <Input
                    id="email"
                    autoFocus
                    disabled={loading}
                    value={formData.email}
                    onChange={(e) => setFormData({ email: e.target.value })}
                    type="email"
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/90">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                  <Input
                    id="password"
                    disabled={loading}
                    value={formData.password}
                    placeholder="Enter your password"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        emailAndPasswordSignIn();
                      }
                    }}
                    onChange={(e) => setFormData({ password: e.target.value })}
                    type={showPassword ? "text" : "password"}
                    className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/70"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40 h-11 rounded-xl font-medium transition-all duration-200 backdrop-blur-sm"
                data-testid="signin-submit-button"
              >
                {loading ? (
                  <Loader className="size-4 animate-spin ml-1" />
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          )}
          
          {socialAuthenticationProviders.length > 0 && (
            <>
              {emailAndPasswordEnabled && (
                <div className="flex items-center my-4">
                  <div className="flex-1 h-px bg-white/20"></div>
                  <span className="px-4 text-sm text-white/60">
                    {t("orContinueWith")}
                  </span>
                  <div className="flex-1 h-px bg-white/20"></div>
                </div>
              )}
              <div className="flex flex-col gap-2 w-full">
                {socialAuthenticationProviders.includes("google") && (
                  <Button
                    onClick={() => handleSocialSignIn("google")}
                    className="flex-1 w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 h-11 rounded-xl font-medium transition-all duration-200 backdrop-blur-sm"
                  >
                    <GoogleIcon className="size-4 fill-white mr-2" />
                    Google
                  </Button>
                )}
                {socialAuthenticationProviders.includes("github") && (
                  <Button
                    onClick={() => handleSocialSignIn("github")}
                    className="flex-1 w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 h-11 rounded-xl font-medium transition-all duration-200 backdrop-blur-sm"
                  >
                    <GithubIcon className="size-4 fill-white mr-2" />
                    GitHub
                  </Button>
                )}
                {socialAuthenticationProviders.includes("microsoft") && (
                  <Button
                    onClick={() => handleSocialSignIn("microsoft")}
                    className="flex-1 w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 h-11 rounded-xl font-medium transition-all duration-200 backdrop-blur-sm"
                  >
                    <MicrosoftIcon className="size-4 fill-white mr-2" />
                    Microsoft
                  </Button>
                )}
              </div>
            </>
          )}
          
          {signUpEnabled && (
            <div className="text-center mt-4">
              <span className="text-white/70 text-sm">
                {t("noAccount")}{" "}
              </span>
              <Link href="/sign-up" className="text-white hover:text-white/90 text-sm font-medium transition-colors">
                {t("signUp")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
