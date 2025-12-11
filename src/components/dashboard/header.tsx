"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import React from "react";
import { Logo } from "../logo";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "../ui/button";
import { LogOut, UserCircle, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { cn } from "@/lib/utils";


export function Header() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const navItems = React.useMemo(() => {
      const base = [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/dashboard/daily-report", label: "Daily Report" },
      ];

      if (user?.role === "admin") {
        base.push({ href: "/dashboard/users", label: "Users" });
      }

      return base;
    }, [user?.role]);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 lg:px-8">
       <div className="flex items-center gap-4">
        <Logo />
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="ml-auto flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback><UserCircle /></AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-sm overflow-hidden">
              <span className="font-semibold text-foreground truncate">{user.name}</span>
              <span className="text-xs text-muted-foreground truncate">{user.email}</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                {user.role === "admin" ? "ผู้ดูแลระบบ" : "พนักงาน"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="ml-auto h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="ออกจากระบบ"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href="/login">เข้าสู่ระบบ</Link>
          </Button>
        )}
      </div>

    </header>
  );
}
