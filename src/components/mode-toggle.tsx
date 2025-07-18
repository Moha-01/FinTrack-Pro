
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuPortal } from "@/components/ui/dropdown-menu"
import { useSettings } from "@/hooks/use-settings"

export function ModeToggle() {
  const { setTheme } = useTheme()
  const { t } = useSettings()

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Sun className="h-4 w-4 mr-2 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 mr-2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span>{t('settings.toggleTheme')}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuItem onClick={() => setTheme("light")}>
            {t('settings.light')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            {t('settings.dark')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            {t('settings.system')}
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  )
}
