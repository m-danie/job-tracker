import { Toaster as SonnerToaster } from "sonner";

// Sonner handles showing, stacking and dismissing toasts; `unstyled` drops its
// own look so each toast renders as a daisyUI alert instead.
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      // Stack above the theme toggle in the same corner
      offset={{ bottom: 72, right: 16 }}
      mobileOffset={{ bottom: 72 }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "alert w-full shadow-lg",
          success: "alert-success",
          error: "alert-error",
          info: "alert-info",
          warning: "alert-warning",
        },
      }}
    />
  );
}
