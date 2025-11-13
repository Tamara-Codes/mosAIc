import { useState, useEffect } from 'react'
import { api, type MenuItem, type Category } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Globe, AlertCircle } from 'lucide-react'

type Language = 'hr' | 'en' | 'de' | 'it' | 'fr' | 'es' | 'sl' | 'cs' | 'pl' | 'hu'

interface MenuProps {
  language: Language
  onLanguageChange: (lang: Language) => void
}

export function Menu({ language, onLanguageChange }: MenuProps) {
  const [items, setItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [supportedLanguages, setSupportedLanguages] = useState<{code: string, name: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    try {
      const [itemsData, categoriesData, languagesData] = await Promise.all([
        api.getMenuItemsWithTranslations(),
        api.getCategoriesWithTranslations(),
        fetch('http://localhost:8000/api/supported-languages').then(r => r.json())
      ])
      setItems(itemsData.filter(item => item.is_available))
      setCategories(categoriesData)
      setSupportedLanguages(languagesData.languages || [])
      setLoading(false)
      setError(null)
    } catch (error: any) {
      console.error('Failed to load menu:', error)
      setError('Greška pri učitavanju menija. Provjerite je li backend server pokrenut na http://localhost:8000')
      setLoading(false)
    }
  }

  const getTranslatedCategoryName = (category: Category): string => {
    // If Croatian, return Croatian name
    if (language === 'hr') {
      return category.name
    }

    // Try to find translation for the selected language
    const translation = category.translations?.find(t => t.language_code === language)
    if (translation) {
      return translation.name
    }

    // Fallback to Croatian if no translation exists
    return category.name
  }

  const getTranslatedText = (item: MenuItem, field: 'name' | 'description'): string => {
    // If Croatian, return Croatian text
    if (language === 'hr') {
      return field === 'name' ? item.name_hr : (item.description_hr || '')
    }

    // Try to find translation for the selected language
    const translation = item.translations?.find(t => t.language_code === language)
    if (translation) {
      return field === 'name' ? translation.name : (translation.description || '')
    }

    // Fallback to Croatian if no translation exists
    return field === 'name' ? item.name_hr : (item.description_hr || '')
  }

  const uncategorized = items.filter(item => !item.category || item.category === '')

  const getLabel = (hr: string, en: string, de: string, it: string, fr: string) => {
    switch (language) {
      case 'hr': return hr
      case 'en': return en
      case 'de': return de
      case 'it': return it
      case 'fr': return fr
      default: return hr
    }
  }

  const getAllergenBadges = (item: MenuItem) => {
    const badges: Array<{ label: string; emoji: string; className: string }> = []
    if (item.is_vegetarian) badges.push({ 
      label: getLabel('Vegetarijansko', 'Vegetarian', 'Vegetarisch', 'Vegetariano', 'Végétarien'), 
      emoji: '🌱', 
      className: 'bg-green-50 text-green-700 border-green-300' 
    })
    if (item.is_vegan) badges.push({ 
      label: getLabel('Vegansko', 'Vegan', 'Vegan', 'Vegano', 'Végétalien'), 
      emoji: '🌿', 
      className: 'bg-green-100 text-green-800 border-green-400' 
    })
    if (item.is_spicy) badges.push({ 
      label: getLabel('Ljuto', 'Spicy', 'Scharf', 'Piccante', 'Épicé'), 
      emoji: '🌶️', 
      className: 'bg-red-50 text-red-700 border-red-300' 
    })
    if (item.contains_gluten) badges.push({ 
      label: getLabel('Gluten', 'Gluten', 'Gluten', 'Glutine', 'Gluten'), 
      emoji: '🌾', 
      className: 'bg-amber-50 text-amber-700 border-amber-300' 
    })
    if (item.contains_dairy) badges.push({ 
      label: getLabel('Mliječni', 'Dairy', 'Milchprodukte', 'Latticini', 'Produits laitiers'), 
      emoji: '🥛', 
      className: 'bg-blue-50 text-blue-700 border-blue-300' 
    })
    if (item.contains_nuts) badges.push({ 
      label: getLabel('Orašasti', 'Nuts', 'Nüsse', 'Frutta secca', 'Fruits à coque'), 
      emoji: '🥜', 
      className: 'bg-orange-50 text-orange-700 border-orange-300' 
    })
    if (item.contains_fish) badges.push({ 
      label: getLabel('Riba', 'Fish', 'Fisch', 'Pesce', 'Poisson'), 
      emoji: '🐟', 
      className: 'bg-cyan-50 text-cyan-700 border-cyan-300' 
    })
    if (item.contains_shellfish) badges.push({ 
      label: getLabel('Školjke', 'Shellfish', 'Schalentiere', 'Crostacei', 'Crustacés'), 
      emoji: '🦐', 
      className: 'bg-purple-50 text-purple-700 border-purple-300' 
    })
    if (item.contains_eggs) badges.push({ 
      label: getLabel('Jaja', 'Eggs', 'Eier', 'Uova', 'Œufs'), 
      emoji: '🥚', 
      className: 'bg-yellow-50 text-yellow-700 border-yellow-300' 
    })
    return badges
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            <Skeleton className="h-12 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="w-full h-48" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#e8e0d5' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Greška</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <header className="mb-12 pb-8 border-b border-white">
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex items-center justify-between">
              <h1 className="text-5xl font-bold tracking-tight text-amber-900">
                {language === 'hr' ? 'Jelovnik' : language === 'en' ? 'Menu' : language === 'de' ? 'Menü' : language === 'it' ? 'Menu' : language === 'fr' ? 'Menu' : language === 'es' ? 'Menú' : language === 'sl' ? 'Meni' : language === 'cs' ? 'Menu' : language === 'pl' ? 'Menu' : 'Jelovnik'}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap gap-1 bg-white/70 border border-amber-200 rounded-lg p-1 backdrop-blur">
                <Button
                  variant={language === 'hr' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onLanguageChange('hr')}
                  className="p-1 h-auto"
                  title="Hrvatski"
                >
                  <img src="https://flagcdn.com/w40/hr.png" alt="HR" className="w-8 h-6 object-cover rounded" />
                </Button>
                <Button
                  variant={language === 'en' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onLanguageChange('en')}
                  className="p-1 h-auto"
                  title="English"
                >
                  <img src="https://flagcdn.com/w40/gb.png" alt="EN" className="w-8 h-6 object-cover rounded" />
                </Button>
                <Button
                  variant={language === 'de' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onLanguageChange('de')}
                  className="p-1 h-auto"
                  title="Deutsch"
                >
                  <img src="https://flagcdn.com/w40/de.png" alt="DE" className="w-8 h-6 object-cover rounded" />
                </Button>
                <Button
                  variant={language === 'it' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onLanguageChange('it')}
                  className="p-1 h-auto"
                  title="Italiano"
                >
                  <img src="https://flagcdn.com/w40/it.png" alt="IT" className="w-8 h-6 object-cover rounded" />
                </Button>
                <Button
                  variant={language === 'fr' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onLanguageChange('fr')}
                  className="p-1 h-auto"
                  title="Français"
                >
                  <img src="https://flagcdn.com/w40/fr.png" alt="FR" className="w-8 h-6 object-cover rounded" />
                </Button>
                <Button
                  variant={language === 'es' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onLanguageChange('es')}
                  className="p-1 h-auto"
                  title="Español"
                >
                  <img src="https://flagcdn.com/w40/es.png" alt="ES" className="w-8 h-6 object-cover rounded" />
                </Button>
                <Button
                  variant={language === 'sl' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onLanguageChange('sl')}
                  className="p-1 h-auto"
                  title="Slovenščina"
                >
                  <img src="https://flagcdn.com/w40/si.png" alt="SL" className="w-8 h-6 object-cover rounded" />
                </Button>
                <Button
                  variant={language === 'cs' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onLanguageChange('cs')}
                  className="p-1 h-auto"
                  title="Čeština"
                >
                  <img src="https://flagcdn.com/w40/cz.png" alt="CS" className="w-8 h-6 object-cover rounded" />
                </Button>
                <Button
                  variant={language === 'pl' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onLanguageChange('pl')}
                  className="p-1 h-auto"
                  title="Polski"
                >
                  <img src="https://flagcdn.com/w40/pl.png" alt="PL" className="w-8 h-6 object-cover rounded" />
                </Button>
                <Button
                  variant={language === 'hu' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onLanguageChange('hu')}
                  className="p-1 h-auto"
                  title="Magyar"
                >
                  <img src="https://flagcdn.com/w40/hu.png" alt="HU" className="w-8 h-6 object-cover rounded" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Menu Content */}
        <div className="space-y-16">
          {categories.map((category, idx) => (
            <section key={category.id} className="space-y-6">
              <div className="flex items-start gap-4 mb-8">
                <div className="text-7xl font-black text-white leading-none">
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <h2 className="text-3xl font-bold text-amber-900 border-b border-white pb-4 flex-1 pt-2">
                  {getTranslatedCategoryName(category)}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items
                  .filter(item => item.category === category.name)
                  .map((item) => {
                    const allergenBadges = getAllergenBadges(item)
                    return (
                      <Card key={item.id} className="overflow-hidden hover:shadow-xl transition-all bg-white border-amber-200 hover:border-amber-300">
                        {item.image_path ? (
                          <img
                            src={`http://localhost:8000${item.image_path}`}
                            alt={getTranslatedText(item, 'name')}
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <div className="w-full h-48 bg-muted flex items-center justify-center">
                            <Globe className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}
                        <CardHeader>
                          <CardTitle className="text-lg text-amber-900">
                            {getTranslatedText(item, 'name')}
                          </CardTitle>
                          {getTranslatedText(item, 'description') && (
                            <CardDescription className="text-amber-700">
                              {getTranslatedText(item, 'description')}
                            </CardDescription>
                          )}
                          {allergenBadges.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-amber-100">
                              <div className="flex flex-wrap gap-1.5">
                                {allergenBadges.map((badge, idx) => (
                                  <Badge 
                                    key={idx} 
                                    variant="outline" 
                                    className={`text-xs ${badge.className}`}
                                  >
                                    {badge.emoji} {badge.label}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between pt-2 border-t border-amber-100">
                            <span className="text-xl font-semibold text-amber-900">
                              {item.price.toFixed(2)} €
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
              </div>
            </section>
          ))}

          {uncategorized.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-3xl font-bold text-amber-900 border-b border-amber-200 pb-4">
                {language === 'hr' ? 'Ostalo' : 'Other'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {uncategorized.map((item) => {
                  const allergenBadges = getAllergenBadges(item)
                  return (
                    <Card key={item.id} className="overflow-hidden hover:shadow-xl transition-all bg-white border-amber-200 hover:border-amber-300">
                      {item.image_path ? (
                        <img
                          src={`http://localhost:8000${item.image_path}`}
                          alt={getTranslatedText(item, 'name')}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-muted flex items-center justify-center">
                          <Globe className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="text-lg text-amber-900">
                          {getTranslatedText(item, 'name')}
                        </CardTitle>
                        {getTranslatedText(item, 'description') && (
                          <CardDescription className="text-amber-700">
                            {getTranslatedText(item, 'description')}
                          </CardDescription>
                        )}
                        {allergenBadges.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-amber-100">
                            <div className="flex flex-wrap gap-1.5">
                              {allergenBadges.map((badge, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant="outline" 
                                  className={`text-xs ${badge.className}`}
                                >
                                  {badge.emoji} {badge.label}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between pt-2 border-t border-amber-100">
                          <span className="text-xl font-semibold text-amber-900">
                            {item.price.toFixed(2)} €
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </section>
          )}

          {items.length === 0 && !error && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground text-lg">
                  {language === 'hr'
                    ? 'Trenutno nema dostupnih stavki u meniju.'
                    : 'No menu items available at the moment.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

