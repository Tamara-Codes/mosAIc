import { useState, useEffect } from 'react'
import { api, type Analytics } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Utensils, Tag, CheckCircle, XCircle } from 'lucide-react'

export function DashboardOverview() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const data = await api.getAnalytics()
      setAnalytics(data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load analytics:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Učitavanje...</div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-destructive">Greška pri učitavanju podataka</div>
      </div>
    )
  }

  const allergenLabels: Record<string, string> = {
    vegetarian: 'Vegetarijansko',
    vegan: 'Vegansko',
    gluten: 'Gluten',
    dairy: 'Mliječni proizvodi',
    nuts: 'Orašasti plodovi',
    fish: 'Riba',
    shellfish: 'Školjke',
    eggs: 'Jaja',
    spicy: 'Ljuto',
  }

  return (
    <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ukupno Stavki</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_items}</div>
            <p className="text-xs text-muted-foreground">
              Stavki u meniju
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dostupno</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.available_items}</div>
            <p className="text-xs text-muted-foreground">
              Dostupnih danas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nedostupno</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.unavailable_items}</div>
            <p className="text-xs text-muted-foreground">
              Trenutno nedostupno
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kategorije</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_categories}</div>
            <p className="text-xs text-muted-foreground">
              Različitih kategorija
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Categories Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Raspodjela po Kategorijama</CardTitle>
          <CardDescription>
            Broj stavki u svakoj kategoriji
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(analytics.categories).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <span className="font-medium">{category}</span>
                <span className="text-sm text-muted-foreground">{count} stavki</span>
              </div>
            ))}
            {Object.keys(analytics.categories).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nema kategorija
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Allergen Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Alergeni i Posebne Opcije</CardTitle>
          <CardDescription>
            Pregled alergena i posebnih opcija u meniju
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(analytics.allergen_counts).map(([key, count]) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                <span className="text-sm font-medium">{allergenLabels[key]}</span>
                <span className="text-sm font-bold">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

