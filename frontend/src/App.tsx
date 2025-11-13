import { useState } from 'react'
import { Menu } from './components/Menu'
import { AdminDashboard } from './components/AdminDashboard'
import { QRCodePage } from './components/QRCodePage'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'

type Language = 'hr' | 'en' | 'de' | 'it' | 'fr' | 'es' | 'sl' | 'cs' | 'pl' | 'hu'

function App() {
  const [view, setView] = useState<'menu' | 'admin' | 'login' | 'qr'>('menu')
  const [language, setLanguage] = useState<Language>('hr')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    const success = await api.login(password)
    if (success) {
      setView('admin')
      setPassword('')
      setLoginError('')
    } else {
      setLoginError('Netočna lozinka!')
    }
  }

  if (view === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Prijava</CardTitle>
            <CardDescription>Unesite lozinku za pristup admin panelu</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Lozinka</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {loginError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}
              </div>
              <Button type="submit" className="w-full">Prijavi se</Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setView('menu')}
              >
                Natrag na meni
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (view === 'admin') {
    return (
      <AdminDashboard onViewChange={setView} />
    )
  }

  if (view === 'qr') {
    return (
      <>
        <div className="fixed top-4 right-4 z-50">
          <Button variant="outline" onClick={() => setView('admin')}>
            Natrag na Dashboard
          </Button>
        </div>
        <QRCodePage />
      </>
    )
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <Button variant="outline" onClick={() => setView('login')}>
          Admin
        </Button>
      </div>
      <div className="min-h-screen bg-background text-foreground">
        <Menu language={language} onLanguageChange={setLanguage} />
      </div>
    </>
  )
}

export default App
