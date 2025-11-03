"use client"

import { useEffect, useState, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Mic, CircleUser, Settings, LogOut } from "lucide-react"

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
import { VoiceCommandDialog } from "./voice-command-dialog"
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
  const [isVoiceDialogOpen, setIsVoiceDialogOpen] = useState(false)
  const [hasSpeechRecognition, setHasSpeechRecognition] = useState(false)

  useEffect(() => {
    setHasSpeechRecognition(typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window));
  }, []);

  const handleVoiceAction = useCallback((action: VoiceCommandResponse['action'], data: any) => {
    if (action === 'OPEN_ADD_ITEM_DIALOG') {
      setIsVoiceDialogOpen(false);
      let url = '/dashboard/inventory?openAddDialog=true';
      if (data?.itemName) {
        url += `&itemName=${encodeURIComponent(data.itemName)}`;
      }
      router.push(url);
    }
  }, [router]);


  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      {isMobile && <SidebarTrigger />}
      <div className="relative flex-1">
        <h1 className="text-lg font-semibold md:text-2xl">
          {getTitleFromPathname(pathname)}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        {hasSpeechRecognition && (
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => setIsVoiceDialogOpen(true)}
          >
            <Mic className="size-5" />
            <span className="sr-only">Use Voice Command</span>
          </Button>
        )}
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
      {hasSpeechRecognition && <VoiceCommandDialog open={isVoiceDialogOpen} onOpenChange={setIsVoiceDialogOpen} onAction={handleVoiceAction} />}
    </header>
  )
}
