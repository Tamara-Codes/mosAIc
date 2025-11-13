import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Languages, Plus, Edit2, Trash2, Loader2, Sparkles, CheckCircle2, AlertCircle, Flag } from 'lucide-react'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'

interface Translation {
  id: number
  menu_item_id: number
  language_code: string
  language_name: string
  name: string
  description: string
  is_ai_generated: boolean
}

interface MenuItem {
  id: number
  name_hr: string
  description_hr: string
  translations: Translation[]
}

interface Language {
  code: string
  name: string
}

export function TranslationsPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [languages, setLanguages] = useState<Language[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [selectedTranslation, setSelectedTranslation] = useState<Translation | null>(null)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showBatchDialog, setShowBatchDialog] = useState(false)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [showFlags, setShowFlags] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [itemsRes, langsRes] = await Promise.all([
        fetch('http://localhost:8000/api/menu-items-with-translations'),
        fetch('http://localhost:8000/api/supported-languages')
      ])
      
      const itemsData = await itemsRes.json()
      const langsData = await langsRes.json()
      
      setMenuItems(itemsData)
      setLanguages(langsData.languages)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error("Neuspješno učitavanje podataka")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateTranslations = async () => {
    if (!selectedItem || selectedLanguages.length === 0) {
      toast.error("Molimo odaberite barem jedan jezik")
      return
    }

    try {
      setGenerating(true)
      const response = await fetch(`http://localhost:8000/api/translations/generate/${selectedItem.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedLanguages)
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(`Generirano ${data.translations.length} prijevoda`)
        fetchData()
        setShowGenerateDialog(false)
        setSelectedLanguages([])
      } else {
        toast.error(data.errors.join(', '))
      }
    } catch (error) {
      console.error('Error generating translations:', error)
      toast.error("Neuspješno generiranje prijevoda")
    } finally {
      setGenerating(false)
    }
  }

  const handleBatchGenerate = async () => {
    if (selectedLanguages.length === 0) {
      toast.error("Molimo odaberite barem jedan jezik")
      return
    }

    try {
      setGenerating(true)
      const response = await fetch('http://localhost:8000/api/translations/batch-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedLanguages)
      })

      const data = await response.json()
      
      toast.success(`Generirano ${data.total_generated} prijevoda${data.total_errors > 0 ? `, ${data.total_errors} greška` : ''}`)
      fetchData()
      setShowBatchDialog(false)
      setSelectedLanguages([])
    } catch (error) {
      console.error('Error batch generating translations:', error)
      toast.error("Neuspješno generiranje prijevoda")
    } finally {
      setGenerating(false)
    }
  }

  const handleEditTranslation = async () => {
    if (!selectedTranslation) return

    try {
      const response = await fetch(`http://localhost:8000/api/translations/${selectedTranslation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName,
          description: editDescription
        })
      })

      if (response.ok) {
        toast.success("Prijevod je ažuriran")
        fetchData()
        setShowEditDialog(false)
      }
    } catch (error) {
      console.error('Error updating translation:', error)
      toast.error("Neuspješno ažuriranje prijevoda")
    }
  }

  const handleDeleteTranslation = async (translationId: number) => {
    if (!confirm('Jeste li sigurni da želite obrisati ovaj prijevod?')) return

    try {
      const response = await fetch(`http://localhost:8000/api/translations/${translationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success("Prijevod je obrisan")
        fetchData()
      }
    } catch (error) {
      console.error('Error deleting translation:', error)
      toast.error("Neuspješno brisanje prijevoda")
    }
  }

  const openGenerateDialog = (item: MenuItem) => {
    setSelectedItem(item)
    // Pre-select languages that don't have translations yet
    const existingLangs = item.translations.map(t => t.language_code)
    const availableLangs = languages.filter(l => !existingLangs.includes(l.code)).map(l => l.code)
    setSelectedLanguages(availableLangs)
    setShowGenerateDialog(true)
  }

  const openEditDialog = (translation: Translation) => {
    setSelectedTranslation(translation)
    setEditName(translation.name)
    setEditDescription(translation.description)
    setShowEditDialog(true)
  }

  const openBatchDialog = () => {
    setSelectedLanguages([])
    setShowBatchDialog(true)
  }

  const getLanguageFlag = (code: string) => {
    const countryCode = code === 'en' ? 'gb' : code === 'cs' ? 'cz' : code === 'sl' ? 'si' : code
    return `https://flagcdn.com/w40/${countryCode}.png`
  }

  const getTranslationProgress = (item: MenuItem) => {
    const total = languages.length
    const completed = item.translations.length
    return { completed, total, percentage: Math.round((completed / total) * 100) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            AI Prijevodi
          </h1>
          <p className="text-lg text-muted-foreground">
            Automatski generirajte prijevode za sve jezike
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowFlags(!showFlags)}
            className="gap-2"
          >
            <Flag className="h-5 w-5" />
            {showFlags ? 'Prikaži oznake' : 'Prikaži zastave'}
          </Button>
          <Button onClick={openBatchDialog} size="lg" className="gap-2 shadow-lg">
            <Sparkles className="h-5 w-5" />
            Generiraj sve prijevode
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ukupno stavki
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{menuItems.length}</div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dostupni jezici
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{languages.length}</div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ukupno prijevoda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {menuItems.reduce((sum, item) => sum + item.translations.length, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu Items Grid */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Stavke menija</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {menuItems.map((item) => {
            const progress = getTranslationProgress(item)
            return (
              <Card key={item.id} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {item.name_hr}
                      </CardTitle>
                      {item.description_hr && (
                        <CardDescription className="line-clamp-2 mt-2">
                          {item.description_hr}
                        </CardDescription>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openGenerateDialog(item)}
                      className="shrink-0"
                      title="Dodaj prijevod"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Prijevodi</span>
                      <span className="font-medium">
                        {progress.completed}/{progress.total}
                      </span>
                    </div>
                    <Progress value={progress.percentage} className="h-2" />
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Language Display */}
                  <div className="space-y-3">
                    {item.translations.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {item.translations.map((trans) => (
                          <div
                            key={trans.id}
                            className="relative group/flag"
                            title={trans.language_name}
                          >
                            {showFlags ? (
                              <div className="relative rounded-full overflow-hidden border-2 border-green-500 shadow-sm w-10 h-10 bg-white">
                                <img
                                  src={getLanguageFlag(trans.language_code)}
                                  alt={trans.language_code}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <Badge variant="secondary" className="text-sm font-semibold px-3 py-1">
                                {trans.language_code.toUpperCase()}
                              </Badge>
                            )}
                            <div className="absolute -top-1 -right-1 opacity-0 group-hover/flag:opacity-100 transition-opacity flex gap-1 z-10">
                              <button
                                onClick={() => openEditDialog(trans)}
                                className="bg-white rounded-full p-1 shadow-md hover:bg-blue-50 border"
                                title="Uredi"
                              >
                                <Edit2 className="h-3 w-3 text-blue-600" />
                              </button>
                              <button
                                onClick={() => handleDeleteTranslation(trans.id)}
                                className="bg-white rounded-full p-1 shadow-md hover:bg-red-50 border"
                                title="Obriši"
                              >
                                <Trash2 className="h-3 w-3 text-red-600" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-4 text-muted-foreground">
                        <Languages className="h-5 w-5 mr-2" />
                        <span className="text-sm">Nema prijevoda</span>
                      </div>
                    )}

                    {/* Status Badge */}
                    {progress.percentage === 100 ? (
                      <Badge className="w-full justify-center gap-1 bg-green-500 hover:bg-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                        Svi prijevodi gotovi
                      </Badge>
                    ) : progress.completed === 0 ? (
                      <Badge variant="destructive" className="w-full justify-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Nema prijevoda
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="w-full justify-center">
                        {progress.completed} od {progress.total} prijevoda
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {menuItems.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Languages className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                Nema stavki menija
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Generate Translation Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-primary" />
              Generiraj prijevode
            </DialogTitle>
            <DialogDescription className="text-base">
              {selectedItem && (
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <span className="font-semibold">{selectedItem.name_hr}</span>
                  {selectedItem.description_hr && (
                    <p className="text-sm mt-1">{selectedItem.description_hr}</p>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Odaberite jezike za prijevod</Label>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {languages.map((lang) => {
                  const hasTranslation = selectedItem?.translations.some(
                    t => t.language_code === lang.code
                  )
                  const isChecked = selectedLanguages.includes(lang.code)
                  return (
                    <div
                      key={lang.code}
                      className={`
                        relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer
                        ${isChecked ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}
                        ${hasTranslation ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      onClick={() => {
                        if (!hasTranslation) {
                          if (isChecked) {
                            setSelectedLanguages(selectedLanguages.filter(l => l !== lang.code))
                          } else {
                            setSelectedLanguages([...selectedLanguages, lang.code])
                          }
                        }
                      }}
                    >
                      <Checkbox
                        id={`lang-${lang.code}`}
                        checked={isChecked}
                        disabled={hasTranslation}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedLanguages([...selectedLanguages, lang.code])
                          } else {
                            setSelectedLanguages(selectedLanguages.filter(l => l !== lang.code))
                          }
                        }}
                      />
                      <img
                        src={getLanguageFlag(lang.code)}
                        alt={lang.code}
                        className="w-8 h-6 object-cover rounded border"
                      />
                      <label
                        htmlFor={`lang-${lang.code}`}
                        className="flex-1 text-sm font-medium cursor-pointer"
                      >
                        {lang.name}
                      </label>
                      {hasTranslation && (
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Postoji
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)} size="lg">
              Odustani
            </Button>
            <Button 
              onClick={handleGenerateTranslations} 
              disabled={generating || selectedLanguages.length === 0}
              className="gap-2"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generiranje...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generiraj {selectedLanguages.length > 0 && `(${selectedLanguages.length})`}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Translation Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <Edit2 className="h-6 w-6 text-primary" />
              Uredi prijevod
            </DialogTitle>
            <DialogDescription className="text-base">
              {selectedTranslation && (
                <div className="flex items-center gap-3 mt-2 p-3 bg-muted rounded-lg">
                  <img
                    src={getLanguageFlag(selectedTranslation.language_code)}
                    alt={selectedTranslation.language_code}
                    className="w-10 h-7 object-cover rounded border-2"
                  />
                  <div>
                    <span className="font-semibold">{selectedTranslation.language_name}</span>
                    <span className="text-muted-foreground ml-2">
                      ({selectedTranslation.language_code.toUpperCase()})
                    </span>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-base font-semibold">
                Naziv
              </Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-base"
                placeholder="Unesite naziv..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-base font-semibold">
                Opis
              </Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={5}
                className="text-base resize-none"
                placeholder="Unesite opis..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} size="lg">
              Odustani
            </Button>
            <Button onClick={handleEditTranslation} size="lg" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Spremi promjene
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Generate Dialog */}
      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-primary" />
              Generiraj sve prijevode
            </DialogTitle>
            <DialogDescription className="text-base">
              Generirajte AI prijevode za sve stavke menija odjednom
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-900 font-semibold mb-1">
                    Važna napomena
                  </p>
                  <p className="text-sm text-amber-800">
                    Ova operacija može potrajati nekoliko minuta i koštati API pozive.
                    Već postojeći prijevodi neće biti zamijenjeni.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold">Odaberite jezike za prijevod</Label>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {languages.map((lang) => {
                  const isChecked = selectedLanguages.includes(lang.code)
                  return (
                    <div
                      key={lang.code}
                      className={`
                        relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer
                        ${isChecked ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}
                      `}
                      onClick={() => {
                        if (isChecked) {
                          setSelectedLanguages(selectedLanguages.filter(l => l !== lang.code))
                        } else {
                          setSelectedLanguages([...selectedLanguages, lang.code])
                        }
                      }}
                    >
                      <Checkbox
                        id={`batch-lang-${lang.code}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedLanguages([...selectedLanguages, lang.code])
                          } else {
                            setSelectedLanguages(selectedLanguages.filter(l => l !== lang.code))
                          }
                        }}
                      />
                      <img
                        src={getLanguageFlag(lang.code)}
                        alt={lang.code}
                        className="w-8 h-6 object-cover rounded border"
                      />
                      <label
                        htmlFor={`batch-lang-${lang.code}`}
                        className="flex-1 text-sm font-medium cursor-pointer"
                      >
                        {lang.name}
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowBatchDialog(false)} size="lg">
              Odustani
            </Button>
            <Button 
              onClick={handleBatchGenerate} 
              disabled={generating || selectedLanguages.length === 0}
              className="gap-2"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generiranje...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generiraj sve {selectedLanguages.length > 0 && `(${selectedLanguages.length})`}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

