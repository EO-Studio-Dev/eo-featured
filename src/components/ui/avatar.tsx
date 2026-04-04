"use client";

import Image from "next/image";
import { useState } from "react";
import { getInitials, getAvatarColor, cn } from "@/lib/utils";

interface AvatarProps {
  src: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-10 w-10 text-sm",
  md: "h-16 w-16 text-lg",
  lg: "h-24 w-24 text-2xl",
};

const imageSizeMap = {
  sm: 40,
  md: 64,
  lg: 96,
};

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full font-semibold text-white",
          sizeMap[size],
          getAvatarColor(name),
          className
        )}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={name}
      width={imageSizeMap[size]}
      height={imageSizeMap[size]}
      className={cn("rounded-full object-cover", sizeMap[size], className)}
      onError={() => setError(true)}
    />
  );
}
