"use client";

import { Drawer as SheetPrimitive } from "@base-ui/react/drawer";
import * as React from "react";

import { cn } from "@/lib/utils";

function Sheet(props: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root {...props} />;
}

const SheetClose = SheetPrimitive.Close;
const SheetDescription = SheetPrimitive.Description;
const SheetTitle = SheetPrimitive.Title;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Backdrop>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Backdrop>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Backdrop
    className={cn(
      "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-opacity duration-200 data-[closed]:opacity-0 data-[open]:opacity-100",
      className,
    )}
    ref={ref}
    {...props}
  />
));
SheetOverlay.displayName = "SheetOverlay";

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Popup> {
  side?: "right";
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Popup>,
  SheetContentProps
>(({ children, className, side = "right", ...props }, ref) => (
  <SheetPrimitive.Portal>
    <SheetOverlay />
    <SheetPrimitive.Viewport className="fixed inset-0 z-50 pointer-events-none">
      <SheetPrimitive.Popup
        className={cn(
          "pointer-events-auto fixed z-50 flex h-dvh w-full max-w-[min(100vw,44rem)] flex-col border-border bg-background text-foreground shadow-2xl transition-transform duration-200 ease-out data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full",
          side === "right" && "inset-y-0 right-0 border-l",
          className,
        )}
        ref={ref}
        {...props}
      >
        <SheetPrimitive.Content className="flex min-h-0 flex-1 flex-col">
          {children}
        </SheetPrimitive.Content>
      </SheetPrimitive.Popup>
    </SheetPrimitive.Viewport>
  </SheetPrimitive.Portal>
));
SheetContent.displayName = "SheetContent";

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetOverlay,
  SheetTitle,
};
