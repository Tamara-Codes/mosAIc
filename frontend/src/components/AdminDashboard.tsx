import { useState } from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { MenuItemsPage } from './MenuItemsPage'
import { SettingsPage } from './SettingsPage'
import { QRCodePage } from './QRCodePage'

interface AdminDashboardProps {
  onViewChange: (view: 'menu' | 'admin' | 'login' | 'qr') => void
}

export function AdminDashboard({ onViewChange }: AdminDashboardProps) {
  const [currentView, setCurrentView] = useState<'menu-items' | 'qr' | 'settings'>('menu-items')

  const handleViewChange = (view: 'menu-items' | 'qr' | 'settings') => {
    setCurrentView(view)
  }

  const renderContent = () => {
    switch (currentView) {
      case 'menu-items':
        return <MenuItemsPage />
      case 'qr':
        return <QRCodePage />
      case 'settings':
        return <SettingsPage />
      default:
        return <MenuItemsPage />
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar 
        currentView={currentView} 
        onViewChange={handleViewChange}
        onLogout={() => onViewChange('menu')}
      />
      <SidebarInset>
        <SiteHeader currentView={currentView} />
        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
          {renderContent()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
