import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  currentView,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    onClick?: () => void
    action?: string
  }[]
  currentView?: string
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu className="space-y-1">
          {items.map((item) => {
            const isActive = currentView === item.action
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  tooltip={item.title}
                  onClick={item.onClick}
                  asChild={!item.onClick}
                  isActive={isActive}
                  className={cn(
                    "group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                    "hover:bg-gray-50/50 hover:text-foreground",
                    isActive 
                      ? "bg-gray-50/80 text-primary font-semibold" 
                      : "text-sidebar-foreground"
                  )}
                >
                  {item.onClick ? (
                    <>
                      {item.icon && (
                        <item.icon className={cn(
                          "h-5 w-5 shrink-0 transition-colors",
                          isActive ? "text-primary" : "text-sidebar-foreground group-hover:text-foreground"
                        )} />
                      )}
                      <span className="flex-1">{item.title}</span>
                      {isActive && (
                        <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                      )}
                    </>
                  ) : (
                    <a href={item.url} className="flex w-full items-center gap-3">
                      {item.icon && (
                        <item.icon className={cn(
                          "h-5 w-5 shrink-0 transition-colors",
                          isActive ? "text-primary" : "text-sidebar-foreground group-hover:text-foreground"
                        )} />
                      )}
                      <span className="flex-1">{item.title}</span>
                      {isActive && (
                        <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                      )}
                    </a>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
