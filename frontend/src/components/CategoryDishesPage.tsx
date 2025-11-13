import { useState, useEffect } from 'react'
import { api, type MenuItem } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from './ConfirmDialog'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-react'
import { MenuItemForm } from './MenuItemForm'

interface CategoryDishesPageProps {
  categoryName: string
  onBack: () => void
}

export function CategoryDishesPage({ categoryName, onBack }: CategoryDishesPageProps) {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)

  useEffect(() => {
    loadItems()
  }, [categoryName])

  const loadItems = async () => {
    try {
      const data = await api.getMenuItems()
      // Filter items by category
      const categoryItems = data.filter(item => item.category === categoryName)
      setItems(categoryItems)
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
    loadItems()
  }

  const getAllergenBadges = (item: MenuItem) => {
    const badges = []
    if (item.is_vegetarian) badges.push(<Badge key="veg" variant="secondary">Vegetarijansko</Badge>)
    if (item.is_vegan) badges.push(<Badge key="vegan" variant="secondary">Vegansko</Badge>)
    if (item.contains_gluten) badges.push(<Badge key="gluten" variant="outline">Gluten</Badge>)
    if (item.contains_dairy) badges.push(<Badge key="dairy" variant="outline">Mliječni</Badge>)
    if (item.contains_nuts) badges.push(<Badge key="nuts" variant="outline">Orašasti</Badge>)
    if (item.is_spicy) badges.push(<Badge key="spicy" variant="destructive">Ljuto</Badge>)
    return badges
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
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Natrag na kategorije
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{categoryName}</h1>
            <p className="text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? 'stavka' : 'stavki'} u ovoj kategoriji
            </p>
          </div>
        </div>
        <Button onClick={() => {
          setEditingItem(null)
          setIsFormOpen(true)
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Dodaj Novu Stavku
        </Button>
      </div>

      {/* Dishes Grid */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Nema stavki u ovoj kategoriji.</p>
            <Button onClick={() => {
              setEditingItem(null)
              setIsFormOpen(true)
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Dodaj Prvu Stavku
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
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
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingItem(item)
                        setIsFormOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {item.description_hr && (
                  <p className="text-sm text-muted-foreground mb-3">{item.description_hr}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">
                    {item.price.toFixed(2)} €
                  </div>
                  {!item.is_available && (
                    <Badge variant="secondary">Nedostupno</Badge>
                  )}
                </div>
                {getAllergenBadges(item).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {getAllergenBadges(item)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Uredi Stavku' : `Dodaj Novu Stavku u ${categoryName}`}
            </DialogTitle>
          </DialogHeader>
          <MenuItemForm
            item={editingItem}
            presetCategory={categoryName}
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
        description="Jeste li sigurni da želite obrisati ovu stavku?"
        onConfirm={handleDelete}
        confirmText="Obriši"
        cancelText="Odustani"
      />
    </div>
  )
}

