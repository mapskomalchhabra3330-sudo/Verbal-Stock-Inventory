"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Warehouse, Settings, CircleUser } from "lucide-react"

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Logo } from "@/components/logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function DashboardSidebar() {
  const pathname = usePathname()

  const menuItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/dashboard/inventory",
      label: "Inventory",
      icon: Warehouse,
    },
  ]

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
    >
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Logo className="size-7 text-sidebar-primary" />
          <span className="text-lg font-semibold text-sidebar-primary">VerbalStock</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarImage src="https://picsum.photos/seed/user/100/100" alt="User" />
            <AvatarFallback>
              <CircleUser />
            </AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="truncate text-sm font-medium">Shop Owner</p>
            <p className="truncate text-xs text-sidebar-foreground/70">
              owner@verbalstock.com
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
