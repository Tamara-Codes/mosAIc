import { useState, useEffect } from 'react'
import { api, type MenuItem, type Category } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from './ConfirmDialog'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Tag, ArrowRight, GripVertical, Move } from 'lucide-react'

interface CategoriesPageProps {
  onCategoryClick?: (categoryName: string) => void
}

export function CategoriesPage({ onCategoryClick }: CategoriesPageProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)
  const [draggedCategory, setDraggedCategory] = useState<number | null>(null)
  const [isReordering, setIsReordering] = useState(false)
  const [isMoveMode, setIsMoveMode] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [categoriesData, itemsData] = await Promise.all([
        api.getCategoriesWithIds(),
        api.getMenuItems()
      ])
      setCategories(categoriesData)
      setItems(itemsData)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Greška pri učitavanju podataka')
      setLoading(false)
    }
  }

  const getCategoryItemCount = (categoryName: string) => {
    return items.filter(item => item.category === categoryName).length
  }

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

    const draggedIdx = categories.findIndex(c => c.id === draggedCategory)
    const targetIdx = categories.findIndex(c => c.id === targetCategoryId)

    if (draggedIdx === -1 || targetIdx === -1) {
      setDraggedCategory(null)
      return
    }

    // Create new array with swapped items
    const newCategories: Category[] = [...categories]
    const temp = newCategories[draggedIdx]
    newCategories[draggedIdx] = newCategories[targetIdx]
    newCategories[targetIdx] = temp

    setCategories(newCategories)
    setDraggedCategory(null)
    setIsReordering(true)

    try {
      await api.reorderCategories(newCategories)
      toast.success('Redoslijed kategorija je promijenjen')
    } catch (error) {
      console.error('Error reordering categories:', error)
      toast.error('Greška pri promjeni redoslijeda')
      // Reload to get correct order
      loadData()
    } finally {
      setIsReordering(false)
    }
  }

  const handleAddCategory = () => {
    setEditingCategory(null)
    setNewCategoryName('')
    setIsDialogOpen(true)
  }

  const handleEditCategory = (category: string) => {
    setEditingCategory(category)
    setNewCategoryName(category)
    setIsDialogOpen(true)
  }

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Unesite naziv kategorije')
      return
    }

    try {
      if (editingCategory) {
        // Find the category by name
        const categoryToUpdate = categories.find(c => c.name === editingCategory)
        if (categoryToUpdate) {
          await api.updateCategory(categoryToUpdate.id, newCategoryName)
          toast.success('Kategorija je ažurirana')
        }
      } else {
        // Create new category via API
        await api.createCategory(newCategoryName.trim())
        toast.success('Kategorija je dodana')
      }

      setIsDialogOpen(false)
      setEditingCategory(null)
      setNewCategoryName('')
      loadData()
    } catch (error: any) {
      console.error('Error saving category:', error)
      const errorMessage = error.response?.data?.detail || 'Greška pri spremanju kategorije'
      toast.error(errorMessage)
    }
  }

  const handleDeleteClick = (category: string) => {
    setCategoryToDelete(category)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return
    
    try {
      // Find the category by name
      const categoryToDeleteObj = categories.find(c => c.name === categoryToDelete)
      if (categoryToDeleteObj) {
        await api.deleteCategory(categoryToDeleteObj.id)
        toast.success('Kategorija je obrisana')
      }
      
      loadData()
      setDeleteConfirmOpen(false)
      setCategoryToDelete(null)
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Greška pri brisanju kategorije')
      setDeleteConfirmOpen(false)
      setCategoryToDelete(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Učitavanje...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button onClick={handleAddCategory}>
          <Plus className="w-4 h-4 mr-2" />
          Dodaj Kategoriju
        </Button>
        {categories.length > 1 && (
          <Button 
            onClick={() => setIsMoveMode(!isMoveMode)}
            variant={isMoveMode ? 'default' : 'outline'}
          >
            <Move className="w-4 h-4 mr-2" />
            {isMoveMode ? 'Završi Premještanje' : 'Premjesti Kategorije'}
          </Button>
        )}
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Nema kategorija. Dodajte prvu kategoriju!</p>
          </CardContent>
        </Card>
      ) : isMoveMode ? (
        // List view for move mode
        <div className="space-y-2 max-w-2xl">
          {categories.map((category) => (
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
                    {getCategoryItemCount(category.name)} {getCategoryItemCount(category.name) === 1 ? 'stavka' : 'stavki'}
                  </p>
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        // Grid view for normal mode
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card 
              key={category.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onCategoryClick?.(category.name)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span className="truncate">{category.name}</span>
                  <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditCategory(category.name)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(category.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {getCategoryItemCount(category.name)} {getCategoryItemCount(category.name) === 1 ? 'stavka' : 'stavki'}
                  </p>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Uredi Kategoriju' : 'Dodaj Novu Kategoriju'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory 
                ? 'Promijenite naziv kategorije. Sve stavke u ovoj kategoriji će biti ažurirane.'
                : 'Unesite naziv nove kategorije.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Naziv Kategorije</Label>
              <Input
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="npr. Glavna jela, Deserti..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Odustani
              </Button>
              <Button onClick={handleSaveCategory}>
                Spremi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Obriši kategoriju"
        description={categoryToDelete ? `Kategorija "${categoryToDelete}" ima ${getCategoryItemCount(categoryToDelete)} stavki. Jeste li sigurni da želite obrisati kategoriju? Stavke će ostati bez kategorije.` : ''}
        onConfirm={handleDeleteCategory}
        confirmText="Obriši"
        cancelText="Odustani"
      />
    </div>
  )
}

