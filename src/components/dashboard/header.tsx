"use client"

import { useEffect, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { CircleUser, Settings, LogOut } from "lucide-react"

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { VoiceCommandResponse } from "@/lib/types"

function getTitleFromPathname(pathname: string): string {
  if (pathname.includes("/inventory")) return "Inventory"
  if (pathname.includes("/dashboard")) return "Dashboard"
  return "VerbalStock"
}

export function DashboardHeader() {
  const { isMobile } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()
  
  const handleVoiceAction = useCallback((event: Event) => {
    const response = (event as CustomEvent).detail as VoiceCommandResponse;
    const { action, data } = response;
    
    const params = new URLSearchParams();
    let targetPath = '/dashboard/inventory';

    switch (action) {
      case 'OPEN_ADD_ITEM_DIALOG':
        params.set('openAddDialog', 'true');
        if (data?.itemName) params.set('itemName', data.itemName);
        if (data?.quantity !== undefined) params.set('quantity', data.quantity.toString());
        if (data?.price !== undefined) params.set('price', data.price.toString());
        if (data?.reorderLevel !== undefined) params.set('reorderLevel', data.reorderLevel.toString());
        break;
      case 'OPEN_EDIT_DIALOG':
        if (!data?.itemName) return;
        params.set('editItem', data.itemName);
        break;
      case 'OPEN_VIEW_DIALOG':
        if (!data?.itemName) return;
        params.set('viewItem', data.itemName);
        break;
      case 'OPEN_DELETE_DIALOG':
        if (!data?.itemName) return;
        params.set('deleteItem', data.itemName);
        break;
      default:
       return;
    }
    
    if (pathname !== targetPath) {
      router.push(`${targetPath}?${params.toString()}`);
    } else {
      // If we are already on the page, just update the params
      router.replace(`${targetPath}?${params.toString()}`, { scroll: false });
    }

  }, [router, pathname]);

  useEffect(() => {
    window.addEventListener('voiceaction', handleVoiceAction);
    return () => {
      window.removeEventListener('voiceaction', handleVoiceAction);
    }
  }, [handleVoiceAction]);


  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      {isMobile && <SidebarTrigger />}
      <div className="relative flex-1">
        <h1 className="text-lg font-semibold md:text-2xl">
          {getTitleFromPathname(pathname)}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
              <Avatar className="size-9">
                <AvatarImage src="https://picsum.photos/seed/user/100/100" alt="User" />
                <AvatarFallback>
                  <CircleUser />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 size-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2 size-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
