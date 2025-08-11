import * as React from "react";

import { cn } from "@/lib/utils";

type CardProps = React.ComponentProps<"div"> & {
  variant?: "default" | "glass";
};

function Card({ className, variant = "default", ...props }: CardProps) {
  const base =
    "relative text-card-foreground flex flex-col gap-6 rounded-xl border py-6";
  const styles =
    variant === "glass"
      ? "bg-white/5 border-white/10 backdrop-blur supports-[backdrop-filter]:bg-white/7.5 shadow-[0_10px_30px_-10px_rgba(0,0,0,.35)] before:absolute before:inset-0 before:-z-10 before:rounded-xl before:bg-gradient-to-br before:from-white/10 before:to-transparent"
      : "bg-card shadow-sm";

  return (
    <div data-slot="card" className={cn(base, styles, className)} {...props} />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
