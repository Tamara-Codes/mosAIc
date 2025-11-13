import { useState, useEffect } from 'react'
import { api, type MenuItem } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ConfirmDialog } from './ConfirmDialog'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Search, Languages, Sparkles, Loader2, CheckCircle2, Flag, GripVertical, Move } from 'lucide-react'
import { MenuItemForm } from './MenuItemForm'

interface Translation {
  id: number
  menu_item_id: number
  language_code: string
  language_name: string
  name: string
  description: string
  is_ai_generated: boolean
}

interface MenuItemWithTranslations extends MenuItem {
  translations: Translation[]
}

interface Language {
  code: string
  name: string
}

export function MenuItemsPage() {
  const [items, setItems] = useState<MenuItemWithTranslations[]>([])
  const [allCategories, setAllCategories] = useState<{id: number, name: string}[]>([])
  const [languages, setLanguages] = useState<Language[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('sve')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)
  const [showFlags, setShowFlags] = useState(true)
  
  // Translation state
  const [showTranslateDialog, setShowTranslateDialog] = useState(false)
  const [showEditTranslationDialog, setShowEditTranslationDialog] = useState(false)
  const [selectedItemForTranslation, setSelectedItemForTranslation] = useState<MenuItemWithTranslations | null>(null)
  const [selectedTranslation, setSelectedTranslation] = useState<Translation | null>(null)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [editTranslationName, setEditTranslationName] = useState('')
  const [editTranslationDescription, setEditTranslationDescription] = useState('')
  
  // Category management state
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categoryToDelete, setCategoryToDelete] = useState<{id: number, name: string} | null>(null)
  const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] = useState(false)
  const [showTranslateCategoryDialog, setShowTranslateCategoryDialog] = useState(false)
  const [selectedCategoryForTranslation, setSelectedCategoryForTranslation] = useState<{id: number, name: string, translations?: any[]} | null>(null)

  // Language management state
  const [showLanguageManagementDialog, setShowLanguageManagementDialog] = useState(false)
  const [availableLanguages] = useState([
    { code: 'en', name: 'English' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Spanish' },
    { code: 'sl', name: 'Slovenian' },
    { code: 'cs', name: 'Czech' },
    { code: 'pl', name: 'Polish' },
    { code: 'hu', name: 'Hungarian' },
  ])

  // Category reordering state
  const [isMoveMode, setIsMoveMode] = useState(false)
  const [draggedCategory, setDraggedCategory] = useState<number | null>(null)
  const [isReordering, setIsReordering] = useState(false)

  useEffect(() => {
    loadItems()
  }, [])

  // Category drag and drop handlers
  const handleDragStart = (e: React.DragEvent, categoryId: number) => {
    if (!isMoveMode) return
    e.dataTransfer!.effectAllowed = 'move'
    setDraggedCategory(categoryId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (!isMoveMode) return
    e.preventDefault()
    e.dataTransfer!.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetCategoryId: number) => {
    if (!isMoveMode) return
    e.preventDefault()
    
    if (draggedCategory === null || draggedCategory === targetCategoryId) {
      setDraggedCategory(null)
      return
    }

    const draggedIdx = allCategories.findIndex(c => c.id === draggedCategory)
    const targetIdx = allCategories.findIndex(c => c.id === targetCategoryId)

    if (draggedIdx === -1 || targetIdx === -1) {
      setDraggedCategory(null)
      return
    }

    // Create new array with swapped items
    const newCategories = [...allCategories]
    const temp = newCategories[draggedIdx]
    newCategories[draggedIdx] = newCategories[targetIdx]
    newCategories[targetIdx] = temp

    setAllCategories(newCategories)
    setDraggedCategory(null)
    setIsReordering(true)

    try {
      await api.reorderCategories(newCategories)
      toast.success('Redoslijed kategorija je promijenjen')
    } catch (error) {
      console.error('Error reordering categories:', error)
      toast.error('Greška pri promjeni redoslijeda')
      // Reload to get correct order
      loadItems()
    } finally {
      setIsReordering(false)
    }
  }

  const loadItems = async () => {
    try {
      setLoading(true)
      const [itemsData, langsData, categoriesData] = await Promise.all([
        fetch('http://localhost:8000/api/menu-items-with-translations').then(r => r.json()),
        fetch('http://localhost:8000/api/supported-languages').then(r => r.json()),
        fetch('http://localhost:8000/api/categories').then(r => r.json())
      ])
      setItems(itemsData)
      setLanguages(langsData.languages)
      setAllCategories(categoriesData.categories_with_ids || [])
      setLoading(false)
    } catch (error) {
      console.error('Failed to load items:', error)
      toast.error('Greška pri učitavanju stavki')
      setLoading(false)
    }
  }

  const handleDeleteClick = (id: number) => {
    setItemToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!itemToDelete) return
    try {
      await api.deleteMenuItem(itemToDelete)
      toast.success('Stavka je obrisana')
      loadItems()
      setDeleteConfirmOpen(false)
      setItemToDelete(null)
    } catch (error) {
      toast.error('Greška pri brisanju stavke')
      setDeleteConfirmOpen(false)
      setItemToDelete(null)
    }
  }

  const handleFormSubmit = () => {
    setIsFormOpen(false)
    setEditingItem(null)
    toast.success(editingItem ? 'Stavka je ažurirana' : 'Stavka je dodana')
    loadItems()
  }

  // Translation handlers
  const getLanguageFlag = (code: string) => {
    const countryCode = code === 'en' ? 'gb' : code === 'cs' ? 'cz' : code === 'sl' ? 'si' : code
    return `https://flagcdn.com/w40/${countryCode}.png`
  }

  const getTranslationProgress = (item: MenuItemWithTranslations) => {
    const total = languages.length
    const completed = item.translations?.length || 0
    return { completed, total, percentage: Math.round((completed / total) * 100) }
  }

  const openTranslateDialog = (item: MenuItemWithTranslations) => {
    setSelectedItemForTranslation(item)
    const existingLangs = item.translations?.map(t => t.language_code) || []
    const availableLangs = languages.filter(l => !existingLangs.includes(l.code)).map(l => l.code)
    setSelectedLanguages(availableLangs)
    setShowTranslateDialog(true)
  }

  const openEditTranslationDialog = (translation: Translation) => {
    setSelectedTranslation(translation)
    setEditTranslationName(translation.name)
    setEditTranslationDescription(translation.description)
    setShowEditTranslationDialog(true)
  }

  const handleGenerateTranslations = async () => {
    if (!selectedItemForTranslation || selectedLanguages.length === 0) {
      toast.error("Molimo odaberite barem jedan jezik")
      return
    }

    try {
      setGenerating(true)
      const response = await fetch(`http://localhost:8000/api/translations/generate/${selectedItemForTranslation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedLanguages)
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(`Generirano ${data.translations.length} prijevoda`)
        loadItems()
        setShowTranslateDialog(false)
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

  const handleEditTranslation = async () => {
    if (!selectedTranslation) return

    try {
      const response = await fetch(`http://localhost:8000/api/translations/${selectedTranslation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editTranslationName,
          description: editTranslationDescription
        })
      })

      if (response.ok) {
        toast.success("Prijevod je ažuriran")
        loadItems()
        setShowEditTranslationDialog(false)
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
        loadItems()
      }
    } catch (error) {
      console.error('Error deleting translation:', error)
      toast.error("Neuspješno brisanje prijevoda")
    }
  }

  // Category handlers
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Unesite naziv kategorije")
      return
    }

    try {
      const response = await fetch('http://localhost:8000/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() })
      })

      if (response.ok) {
        toast.success("Kategorija je dodana")
        setNewCategoryName('')
        setShowAddCategoryDialog(false)
        loadItems() // Reload to get updated categories
      } else {
        const data = await response.json()
        toast.error(data.detail || "Greška pri dodavanju kategorije")
      }
    } catch (error) {
      console.error('Error adding category:', error)
      toast.error("Neuspješno dodavanje kategorije")
    }
  }

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return

    try {
      const response = await fetch(`http://localhost:8000/api/categories/${categoryToDelete.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success("Kategorija je obrisana")
        setShowDeleteCategoryDialog(false)
        setCategoryToDelete(null)
        // If we were viewing the deleted category, switch to "sve"
        if (selectedCategory === categoryToDelete.name) {
          setSelectedCategory('sve')
        }
        loadItems() // Reload to get updated categories
      } else {
        const data = await response.json()
        toast.error(data.detail || "Greška pri brisanju kategorije")
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error("Neuspješno brisanje kategorije")
    }
  }

  const openDeleteCategoryDialog = (category: {id: number, name: string}) => {
    setCategoryToDelete(category)
    setShowDeleteCategoryDialog(true)
  }

  const openTranslateCategoryDialog = async (category: {id: number, name: string}) => {
    // Fetch category with translations
    try {
      const response = await fetch(`http://localhost:8000/api/categories-with-translations`)
      const categoriesData = await response.json()
      const fullCategory = categoriesData.find((c: any) => c.id === category.id)
      
      setSelectedCategoryForTranslation(fullCategory || category)
      
      // Pre-select missing languages
      const existingLangs = fullCategory?.translations?.map((t: any) => t.language_code) || []
      const availableLangs = languages.filter(l => !existingLangs.includes(l.code)).map(l => l.code)
      setSelectedLanguages(availableLangs)
      setShowTranslateCategoryDialog(true)
    } catch (error) {
      console.error('Error fetching category:', error)
      setSelectedCategoryForTranslation(category)
      setSelectedLanguages(languages.map(l => l.code))
      setShowTranslateCategoryDialog(true)
    }
  }

  const handleGenerateCategoryTranslations = async () => {
    if (!selectedCategoryForTranslation || selectedLanguages.length === 0) {
      toast.error("Molimo odaberite barem jedan jezik")
      return
    }

    try {
      setGenerating(true)
      const response = await fetch(`http://localhost:8000/api/category-translations/generate/${selectedCategoryForTranslation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedLanguages)
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(`Generirano ${data.translations.length} prijevoda kategorije`)
        loadItems()
        setShowTranslateCategoryDialog(false)
        setSelectedLanguages([])
      } else {
        toast.error(data.errors?.join(', ') || 'Greška pri generiranju')
      }
    } catch (error) {
      console.error('Error generating category translations:', error)
      toast.error("Neuspješno generiranje prijevoda")
    } finally {
      setGenerating(false)
    }
  }

  // Use all categories from database
  const categories = allCategories.map(c => c.name)
  
  // Check if there are uncategorized items
  const uncategorizedCount = items.filter(item => !item.category || item.category === '').length
  const hasUncategorized = uncategorizedCount > 0

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'sve' 
      || (selectedCategory === 'uncategorized' && (!item.category || item.category === ''))
      || item.category === selectedCategory
    const matchesSearch = searchQuery === '' || 
      item.name_hr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description_hr && item.description_hr.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Učitavanje...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFlags(!showFlags)}
            className="gap-2"
          >
            <Flag className="h-4 w-4" />
            {showFlags ? 'Prikaži oznake' : 'Prikaži zastave'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowLanguageManagementDialog(true)}
            className="gap-2"
          >
            <Languages className="h-4 w-4" />
            Upravljaj jezicima
          </Button>
          {allCategories.length > 1 && (
            <Button 
              onClick={() => setIsMoveMode(!isMoveMode)}
              variant={isMoveMode ? 'default' : 'outline'}
              className="gap-2"
            >
              <Move className="w-4 h-4" />
              {isMoveMode ? 'Završi Premještanje' : 'Premjesti Kategorije'}
            </Button>
          )}
        </div>
        <Button onClick={() => {
          setEditingItem(null)
          setIsFormOpen(true)
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Dodaj Novu Stavku
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pretraži stavke..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category Tabs or Reorder Mode */}
      {isMoveMode ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Povuci i ispusti kategorije za promjenu redoslijeda</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddCategoryDialog(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova kategorija
            </Button>
          </div>
          <div className="space-y-2 max-w-2xl">
            {allCategories.map((category, idx) => (
              <Card 
                key={category.id} 
                draggable
                onDragStart={(e) => handleDragStart(e, category.id)}
                onDragOver={(e) => handleDragOver(e)}
                onDrop={(e) => handleDrop(e, category.id)}
                onDragEnd={() => setDraggedCategory(null)}
                className={`transition-all cursor-grab active:cursor-grabbing ${
                  draggedCategory === category.id ? 'opacity-30 bg-blue-100 scale-95' : 'bg-white'
                } ${
                  isReordering ? 'pointer-events-none' : ''
                } ${draggedCategory !== null && draggedCategory !== category.id ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-transparent'} hover:shadow-md`}
              >
                <CardHeader className="py-3 px-4">
                  <CardTitle className="flex items-center justify-between gap-4 text-base">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <GripVertical className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <span className="truncate font-medium">{category.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground flex-shrink-0">
                      {items.filter(item => item.category === category.name).length} stavki
                    </p>
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1">
            <TabsList>
              <TabsTrigger value="sve">Sve</TabsTrigger>
              {allCategories.map(category => (
                <div key={category.id} className="relative group">
                  <TabsTrigger value={category.name}>
                    {category.name}
                  </TabsTrigger>
                  <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openTranslateCategoryDialog(category)
                      }}
                      className="bg-blue-500 text-white rounded-full p-0.5 hover:bg-blue-600 shadow-md"
                      title="Prijevodi kategorije"
                    >
                      <Languages className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openDeleteCategoryDialog(category)
                      }}
                      className="bg-destructive text-destructive-foreground rounded-full p-0.5 hover:bg-destructive/90 shadow-md"
                      title="Obriši kategoriju"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
              {hasUncategorized && (
                <TabsTrigger value="uncategorized" className="border-2 border-amber-400 border-dashed">
                  ⚠️ Bez kategorije ({uncategorizedCount})
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddCategoryDialog(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova kategorija
          </Button>
        </div>
      )}

      {!isMoveMode && (
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <div className="hidden"></div>

          <TabsContent value={selectedCategory} className="mt-6">
          {selectedCategory === 'uncategorized' && hasUncategorized && (
            <Card className="mb-6 border-amber-400 border-2 bg-amber-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-amber-400 p-2">
                    ⚠️
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-900">Stavke bez kategorije</h3>
                    <p className="text-sm text-amber-800 mt-1">
                      Ove stavke su izgubile kategoriju (možda je kategorija obrisana). 
                      Kliknite "Uredi" na stavci i dodijelite joj novu kategoriju.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">
                  {searchQuery ? 'Nema rezultata za vašu pretragu.' : 'Nema stavki u ovoj kategoriji. Dodajte prvu stavku!'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  {item.image_path ? (
                    <img
                      src={`http://localhost:8000${item.image_path}`}
                      alt={item.name_hr}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground">Nema slike</span>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{item.name_hr}</CardTitle>
                      </div>
                      <Badge variant={item.is_available ? 'default' : 'secondary'}>
                        {item.is_available ? 'Dostupno' : 'Nedostupno'}
                      </Badge>
                    </div>
                    {item.description_hr && (
                      <CardDescription className="mt-2 line-clamp-2">{item.description_hr}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-semibold">{item.price.toFixed(2)} €</span>
                      </div>
                      {item.category && (
                        <p className="text-sm text-muted-foreground">Kategorija: {item.category}</p>
                      )}

                      {/* Allergen & Dietary Tags */}
                      <div className="flex flex-wrap gap-1">
                        {item.is_vegetarian && <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">🌱 Vegetarijansko</Badge>}
                        {item.is_vegan && <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-400">🌿 Vegansko</Badge>}
                        {item.is_spicy && <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-300">🌶️ Ljuto</Badge>}
                        {item.contains_gluten && <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">🌾 Gluten</Badge>}
                        {item.contains_dairy && <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">🥛 Mliječno</Badge>}
                        {item.contains_nuts && <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-300">🥜 Orasi</Badge>}
                        {item.contains_fish && <Badge variant="outline" className="text-xs bg-cyan-50 text-cyan-700 border-cyan-300">🐟 Riba</Badge>}
                        {item.contains_shellfish && <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-300">🦐 Školjke</Badge>}
                        {item.contains_eggs && <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">🥚 Jaja</Badge>}
                      </div>

                      {/* Translation Status */}
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Prijevodi</span>
                          <span className="font-medium">
                            {item.translations?.length || 0}/{languages.length}
                          </span>
                        </div>
                        {item.translations && item.translations.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {item.translations.map((trans) => (
                              <div
                                key={trans.id}
                                className="relative group/flag"
                                title={trans.language_name}
                              >
                                {showFlags ? (
                                  <div 
                                    className="relative rounded-full overflow-hidden border-2 border-green-500 w-10 h-10 bg-white cursor-pointer hover:border-green-600 hover:scale-105 transition-all"
                                    onClick={() => openEditTranslationDialog(trans)}
                                  >
                                    <img
                                      src={getLanguageFlag(trans.language_code)}
                                      alt={trans.language_code}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <Badge 
                                    variant="secondary" 
                                    className="text-sm font-semibold cursor-pointer hover:bg-secondary/80 px-3 py-1"
                                    onClick={() => openEditTranslationDialog(trans)}
                                  >
                                    {trans.language_code.toUpperCase()}
                                  </Badge>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteTranslation(trans.id)
                                  }}
                                  className="absolute -top-1 -right-1 opacity-0 group-hover/flag:opacity-100 transition-opacity bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 shadow-md z-10"
                                  title="Obriši"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">Nema prijevoda</div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setEditingItem(item)
                            setIsFormOpen(true)
                          }}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Uredi
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => openTranslateDialog(item)}
                        >
                          <Languages className="w-3 h-3 mr-1" />
                          Prijevodi
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(item.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Uredi Stavku' : 'Dodaj Novu Stavku'}
            </DialogTitle>
          </DialogHeader>
          <MenuItemForm
            item={editingItem}
            presetCategory={!editingItem && selectedCategory !== 'sve' && selectedCategory !== 'uncategorized' ? selectedCategory : undefined}
            onSuccess={handleFormSubmit}
            onCancel={() => {
              setIsFormOpen(false)
              setEditingItem(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Obriši stavku"
        description="Jeste li sigurni da želite obrisati ovu stavku? Ova akcija se ne može poništiti."
        onConfirm={handleDelete}
        confirmText="Obriši"
        cancelText="Odustani"
      />

      {/* Translate Dialog */}
      <Dialog open={showTranslateDialog} onOpenChange={setShowTranslateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-primary" />
              Generiraj prijevode
            </DialogTitle>
            <DialogDescription className="text-base">
              {selectedItemForTranslation && (
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <span className="font-semibold">{selectedItemForTranslation.name_hr}</span>
                  {selectedItemForTranslation.description_hr && (
                    <p className="text-sm mt-1">{selectedItemForTranslation.description_hr}</p>
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
                  const hasTranslation = selectedItemForTranslation?.translations?.some(
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
            <Button variant="outline" onClick={() => setShowTranslateDialog(false)} size="lg">
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
      <Dialog open={showEditTranslationDialog} onOpenChange={setShowEditTranslationDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <Edit className="h-6 w-6 text-primary" />
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
              <Label htmlFor="edit-trans-name" className="text-base font-semibold">
                Naziv
              </Label>
              <Input
                id="edit-trans-name"
                value={editTranslationName}
                onChange={(e) => setEditTranslationName(e.target.value)}
                className="text-base"
                placeholder="Unesite naziv..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-trans-description" className="text-base font-semibold">
                Opis
              </Label>
              <Textarea
                id="edit-trans-description"
                value={editTranslationDescription}
                onChange={(e) => setEditTranslationDescription(e.target.value)}
                rows={5}
                className="text-base resize-none"
                placeholder="Unesite opis..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditTranslationDialog(false)} size="lg">
              Odustani
            </Button>
            <Button onClick={handleEditTranslation} size="lg" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Spremi promjene
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Dodaj novu kategoriju
            </DialogTitle>
            <DialogDescription>
              Unesite naziv nove kategorije menija
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name" className="text-base">
                Naziv kategorije
              </Label>
              <Input
                id="category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="npr. Pizze, Paste, Salate..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCategory()
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setShowAddCategoryDialog(false)
              setNewCategoryName('')
            }}>
              Odustani
            </Button>
            <Button onClick={handleAddCategory} className="gap-2">
              <Plus className="h-4 w-4" />
              Dodaj kategoriju
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteCategoryDialog}
        onOpenChange={setShowDeleteCategoryDialog}
        title="Obriši kategoriju"
        description={
          categoryToDelete 
            ? `Jeste li sigurni da želite obrisati kategoriju "${categoryToDelete.name}"? \n\nStavke u ovoj kategoriji NEĆE biti obrisane - pojavit će se u tabu "⚠️ Bez kategorije" gdje ih možete ponovno kategorizirati.`
            : ''
        }
        onConfirm={handleDeleteCategory}
        confirmText="Obriši"
        cancelText="Odustani"
      />

      {/* Translate Category Dialog */}
      <Dialog open={showTranslateCategoryDialog} onOpenChange={setShowTranslateCategoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-primary" />
              Prijevodi kategorije
            </DialogTitle>
            <DialogDescription className="text-base">
              {selectedCategoryForTranslation && (
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <span className="font-semibold text-lg">{selectedCategoryForTranslation.name}</span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Odaberite jezike za prijevod</Label>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {languages.map((lang) => {
                  const hasTranslation = selectedCategoryForTranslation?.translations?.some(
                    (t: any) => t.language_code === lang.code
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
                        id={`cat-lang-${lang.code}`}
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
                        htmlFor={`cat-lang-${lang.code}`}
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
            <Button variant="outline" onClick={() => setShowTranslateCategoryDialog(false)} size="lg">
              Odustani
            </Button>
            <Button 
              onClick={handleGenerateCategoryTranslations} 
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

      {/* Language Management Dialog */}
      <Dialog open={showLanguageManagementDialog} onOpenChange={setShowLanguageManagementDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="mb-8">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Languages className="h-6 w-6 text-primary" />
              Upravljanje jezicima
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-5">
              {availableLanguages.map((lang) => {
                const isActive = languages.some(l => l.code === lang.code)
                return (
                  <div
                    key={lang.code}
                    className={`
                      relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all cursor-pointer
                      ${isActive 
                        ? 'border-green-500 bg-green-50 hover:bg-green-100 hover:border-green-600 shadow-md' 
                        : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                      }
                    `}
                    onClick={async () => {
                      if (isActive) {
                        // Remove language
                        if (!confirm(`Ukloniti ${lang.name}? Svi prijevodi za taj jezik će biti obrisani!`)) {
                          return
                        }
                        try {
                          const response = await fetch(`http://localhost:8000/api/languages/remove/${lang.code}`, {
                            method: 'DELETE'
                          })
                          if (response.ok) {
                            toast.success(`Uklonjen: ${lang.name}`)
                            loadItems()
                          }
                        } catch (error) {
                          toast.error('Greška pri uklanjanju')
                        }
                      } else {
                        // Add language
                        try {
                          const response = await fetch('http://localhost:8000/api/languages/add', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ code: lang.code, name: lang.name })
                          })
                          if (response.ok) {
                            toast.success(`Dodan: ${lang.name}`)
                            loadItems()
                          }
                        } catch (error) {
                          toast.error('Greška pri dodavanju')
                        }
                      }
                    }}
                  >
                    <img
                      src={getLanguageFlag(lang.code)}
                      alt={lang.code}
                      className="w-16 h-11 object-cover rounded-lg border-2 shadow-sm"
                    />
                    <div className="text-center">
                      <div className="font-semibold text-base">{lang.name}</div>
                      <div className="text-xs text-muted-foreground">{lang.code.toUpperCase()}</div>
                    </div>
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold shadow-sm
                      ${isActive ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}
                    `}>
                      {isActive ? '✓' : '+'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowLanguageManagementDialog(false)} size="lg">
              Zatvori
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

