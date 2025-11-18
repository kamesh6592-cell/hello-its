import { Button } from "../ui/button";
import { SocialAuthenticationProvider } from "app-types/authentication";
import { GoogleIcon } from "ui/google-icon";
import { GithubIcon } from "ui/github-icon";
import { MicrosoftIcon } from "ui/microsoft-icon";
import { cn } from "lib/utils";

export default function SocialProviders({
  socialAuthenticationProviders,
  onSocialProviderClick,
  className,
}: {
  socialAuthenticationProviders: SocialAuthenticationProvider[];
  onSocialProviderClick: (provider: SocialAuthenticationProvider) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 w-full", className)}>
      {socialAuthenticationProviders.includes("google") && (
        <Button
          onClick={() => onSocialProviderClick("google")}
          className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl backdrop-blur-sm h-12 text-base font-medium transition-all duration-200"
          data-testid="google-signup-button"
        >
          <GoogleIcon className="size-5 mr-2 fill-white" />
          Google
        </Button>
      )}
      {socialAuthenticationProviders.includes("github") && (
        <Button
          onClick={() => onSocialProviderClick("github")}
          className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl backdrop-blur-sm h-12 text-base font-medium transition-all duration-200"
          data-testid="github-signup-button"
        >
          <GithubIcon className="size-5 mr-2 fill-white" />
          GitHub
        </Button>
      )}
      {socialAuthenticationProviders.includes("microsoft") && (
        <Button
          onClick={() => onSocialProviderClick("microsoft")}
          className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl backdrop-blur-sm h-12 text-base font-medium transition-all duration-200"
          data-testid="microsoft-signup-button"
        >
          <MicrosoftIcon className="size-5 mr-2 fill-white" />
          Microsoft
        </Button>
      )}
    </div>
  );
}
