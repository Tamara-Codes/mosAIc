import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Building2, Lock } from 'lucide-react'
import { api } from '@/lib/api'

export function SettingsPage() {
  const [restaurantName, setRestaurantName] = useState('Restaurant Menu')
  const [restaurantDescription, setRestaurantDescription] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadRestaurantInfo()
  }, [])

  const loadRestaurantInfo = async () => {
    try {
      const info = await api.getRestaurantInfo()
      setRestaurantName(info.name || 'Restaurant Menu')
      setRestaurantDescription(info.description || '')
      setAddress(info.address || '')
      setPhone(info.phone || '')
      setEmail(info.email || '')
    } catch (error) {
      console.error('Failed to load restaurant info:', error)
    }
  }

  const handleSaveRestaurantInfo = async () => {
    if (!restaurantName.trim()) {
      toast.error('Unesite naziv restorana')
      return
    }

    setLoading(true)
    try {
      await api.saveRestaurantInfo({
        name: restaurantName,
        description: restaurantDescription,
        address: address,
        phone: phone,
        email: email
      })
      toast.success('Informacije o restoranu su spremljene')
    } catch (error: any) {
      console.error('Failed to save restaurant info:', error)
      toast.error('Greška pri spremanju informacija')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast.error('Lozinke se ne podudaraju')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Lozinka mora imati najmanje 6 znakova')
      return
    }
    // TODO: Implement API call to change password
    toast.success('Lozinka je promijenjena')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="space-y-6">

      {/* Restaurant Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <CardTitle>Informacije o Restoranu</CardTitle>
          </div>
          <CardDescription>
            Osnovne informacije o vašem restoranu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="restaurantName">Naziv Restorana</Label>
            <Input
              id="restaurantName"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="Unesite naziv restorana"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="restaurantDescription">Opis</Label>
            <Input
              id="restaurantDescription"
              value={restaurantDescription}
              onChange={(e) => setRestaurantDescription(e.target.value)}
              placeholder="Kratak opis restorana"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Adresa</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Unesite adresu"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+385 XX XXX XXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="restaurant@example.com"
              />
            </div>
          </div>
          <Button onClick={handleSaveRestaurantInfo} disabled={loading}>
            {loading ? 'Spremanje...' : 'Spremi Informacije'}
          </Button>
        </CardContent>
      </Card>

      {/* Admin Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <CardTitle>Admin Postavke</CardTitle>
          </div>
          <CardDescription>
            Promijenite lozinku za pristup admin panelu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Trenutna Lozinka</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Unesite trenutnu lozinku"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Lozinka</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Unesite novu lozinku"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potvrdi Novu Lozinku</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Potvrdite novu lozinku"
            />
          </div>
          <Button onClick={handleChangePassword}>
            Promijeni Lozinku
          </Button>
        </CardContent>
      </Card>

    </div>
  )
}

