import Image from "next/image";

import { cn } from "@/lib/utils";

interface UserIdentity {
  email?: string | null;
  name?: string | null;
}

interface UserAvatarProps extends UserIdentity {
  className?: string;
  image?: string | null;
}

export function getUserInitials({ email, name }: UserIdentity) {
  const source = name?.trim() || email?.split("@")[0] || "User";
  const initials = source
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "U";
}

export function UserAvatar({
  className,
  email,
  image,
  name,
}: UserAvatarProps) {
  const label = name || email || "User";

  if (image) {
    return (
      <span
        className={cn(
          "flex size-10 shrink-0 overflow-hidden rounded-full bg-muted",
          className,
        )}
      >
        <Image
          alt={label}
          className="size-full object-cover"
          height={40}
          referrerPolicy="no-referrer"
          src={image}
          unoptimized
          width={40}
        />
      </span>
    );
  }

  return (
    <span
      aria-label={label}
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground",
        className,
      )}
    >
      {getUserInitials({ email, name })}
    </span>
  );
}
