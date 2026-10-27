import { Toaster as SonnerToaster } from "sonner";

// Sonner handles showing, stacking and dismissing toasts; `unstyled` drops its
// own look so each toast renders as a daisyUI alert instead.
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
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
