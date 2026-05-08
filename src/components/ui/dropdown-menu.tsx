"use client";

import { Menu } from "@base-ui/react/menu";
import * as React from "react";

import { cn } from "@/lib/utils";

function DropdownMenu(props: React.ComponentProps<typeof Menu.Root>) {
  return <Menu.Root {...props} />;
}

const DropdownMenuTrigger = Menu.Trigger;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof Menu.Popup>,
  React.ComponentPropsWithoutRef<typeof Menu.Popup>
>(({ className, ...props }, ref) => (
  <Menu.Portal>
    <Menu.Positioner sideOffset={4}>
      <Menu.Popup
        className={cn(
          "z-[70] min-w-[8rem] overflow-hidden rounded-lg border border-border bg-background p-1 text-foreground shadow-xl outline-none transition-all duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
          className,
        )}
        ref={ref}
        {...props}
      />
    </Menu.Positioner>
  </Menu.Portal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof Menu.Item>,
  React.ComponentPropsWithoutRef<typeof Menu.Item> & {
    destructive?: boolean;
  }
>(({ className, destructive, ...props }, ref) => (
  <Menu.Item
    className={cn(
      "flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none transition-colors select-none data-[highlighted]:bg-muted",
      destructive && "text-destructive data-[highlighted]:text-destructive",
      className,
    )}
    ref={ref}
    {...props}
  />
));
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    ref={ref}
    role="separator"
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
};
