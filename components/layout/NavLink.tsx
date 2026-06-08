'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NavLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  activeClassName?: string;
  pendingClassName?: string;
  end?: boolean;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, activeClassName, pendingClassName, to, end, ...props }, ref) => {
    const pathname = usePathname();

    // Determina se o link está ativo baseado no caminho atual
    const isActive = end 
      ? pathname === to 
      : pathname.startsWith(to);

    return (
      <Link
        ref={ref}
        href={to}
        className={cn(className, isActive && activeClassName)}
        {...props}
      />
    );
  }
);

NavLink.displayName = "NavLink";

export { NavLink };
