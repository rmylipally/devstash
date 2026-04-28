"use client";

import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";
import * as React from "react";

import { cn } from "@/lib/utils";

function AlertDialog(
  props: React.ComponentProps<typeof AlertDialogPrimitive.Root>,
) {
  return <AlertDialogPrimitive.Root {...props} />;
}

const AlertDialogClose = AlertDialogPrimitive.Close;
const AlertDialogDescription = AlertDialogPrimitive.Description;
const AlertDialogTitle = AlertDialogPrimitive.Title;

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Popup>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Popup>
>(({ children, className, ...props }, ref) => (
  <AlertDialogPrimitive.Portal>
    <AlertDialogPrimitive.Backdrop className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm transition-opacity duration-200 data-[closed]:opacity-0 data-[open]:opacity-100" />
    <AlertDialogPrimitive.Viewport className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <AlertDialogPrimitive.Popup
        className={cn(
          "w-full max-w-md rounded-lg border border-border bg-background p-6 text-foreground shadow-2xl outline-none transition-all duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Popup>
    </AlertDialogPrimitive.Viewport>
  </AlertDialogPrimitive.Portal>
));
AlertDialogContent.displayName = "AlertDialogContent";

export {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
};
