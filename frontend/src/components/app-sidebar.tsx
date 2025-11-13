import * as React from "react"
import {
  UtensilsIcon,
  QrCodeIcon,
  SettingsIcon,
  LogOut,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  currentView?: string
  onViewChange?: (view: 'menu-items' | 'qr' | 'settings') => void
  onLogout?: () => void
}

// Restaurant logo component
function RestaurantLogo() {
  return (
    <div className="flex items-center justify-center h-24">
      <img 
        src="https://www.bracera-malinska.com/wp-content/uploads/2025/06/Banner-B.svg" 
        alt="Restoran Logo"
        className="h-full w-auto max-w-[200px] object-contain"
        onError={(e) => {
          console.error('Failed to load logo:', e);
        }}
      />
    </div>
  )
}

const data = {
  navMain: [
    {
      title: "Jelovnik",
      url: "#",
      icon: UtensilsIcon,
      action: "menu-items",
    },
  ],
  navSettings: [
    {
      title: "QR Kod",
      url: "#",
      icon: QrCodeIcon,
      action: "qr",
    },
    {
      title: "Postavke",
      url: "#",
      icon: SettingsIcon,
      action: "settings",
    },
  ],
}

export function AppSidebar({ currentView, onViewChange, onLogout, ...props }: AppSidebarProps) {
  const handleNavClick = (action: string) => {
    if (onViewChange) {
      onViewChange(action as any)
    }
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <RestaurantLogo />
      </SidebarHeader>
      <SidebarContent className="px-3 py-4">
        <NavMain 
          items={data.navMain.map(item => ({
            ...item,
            onClick: () => handleNavClick(item.action),
          }))}
          currentView={currentView}
        />
        <div className="mt-8">
          <NavMain 
            items={data.navSettings.map(item => ({
              ...item,
              onClick: () => handleNavClick(item.action),
            }))}
            currentView={currentView}
          />
        </div>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4 space-y-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onLogout}
          className="w-full justify-start"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Odjava
        </Button>
        <div className="text-xs text-muted-foreground">
          © 2025 MosaAIc
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
