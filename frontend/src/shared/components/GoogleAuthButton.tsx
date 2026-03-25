import { useEffect, useRef, useState } from "react";
import {
  loadGoogleIdentityScript,
  type GoogleCredentialResponse,
} from "../../features/auth/googleIdentity";

interface GoogleAuthButtonProps {
  onSuccess: (credential: string) => void | Promise<void>;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
let initializedGoogleClientId: string | null = null;

const GoogleAuthButton = ({ onSuccess }: GoogleAuthButtonProps) => {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const [error, setError] = useState<string | null>(null);
  const configurationError = GOOGLE_CLIENT_ID
    ? null
    : "Missing VITE_GOOGLE_CLIENT_ID in your environment.";

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    if (configurationError) {
      return;
    }

    let cancelled = false;

    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !buttonRef.current || !window.google?.accounts.id) {
          return;
        }

        if (initializedGoogleClientId !== GOOGLE_CLIENT_ID) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response: GoogleCredentialResponse) => {
              if (!response.credential) {
                setError("Google sign-in did not return a credential.");
                return;
              }

              setError(null);
              void onSuccessRef.current(response.credential);
            },
            auto_select: false,
            ux_mode: "popup",
            use_fedcm_for_prompt: true,
          });
          initializedGoogleClientId = GOOGLE_CLIENT_ID;
        }

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: 320,
        });
      })
      .catch((scriptError) => {
        if (!cancelled) {
          setError(
            scriptError instanceof Error
              ? scriptError.message
              : "Failed to load Google sign-in."
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [configurationError]);

  return (
    <div className="space-y-3">
      <div ref={buttonRef} className="flex justify-center" />
      {(configurationError || error) && (
        <p className="text-sm text-red-600 text-center">
          {configurationError || error}
        </p>
      )}
    </div>
  );
};

export default GoogleAuthButton;
