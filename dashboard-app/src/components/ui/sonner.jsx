import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "@/lib/theme";

/**
 * Toast host wired to the theme provider. Sonner renders its own portal,
 * so this can sit anywhere in the tree.
 */
export function Toaster(props) {
  const { theme } = useTheme();
  return (
    <SonnerToaster
      theme={theme}
      position="bottom-right"
      offset={72}
      gap={8}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-lg !border !border-border !bg-popover !text-popover-foreground !shadow-xl !text-[0.8125rem]",
          description: "!text-muted-foreground",
          actionButton: "!bg-primary !text-primary-foreground",
          cancelButton: "!bg-muted !text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}
