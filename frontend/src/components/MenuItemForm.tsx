import { useState, useEffect } from 'react'
import { api, type MenuItem } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface MenuItemFormProps {
  item?: MenuItem | null
  presetCategory?: string // When set, category is locked to this value
  onSuccess: () => void
  onCancel: () => void
}

export function MenuItemForm({ item, presetCategory, onSuccess, onCancel }: MenuItemFormProps) {
  const [formData, setFormData] = useState({
    name_hr: item?.name_hr || '',
    description_hr: item?.description_hr || '',
    price: item?.price || 0,
    category: presetCategory || item?.category || '',
    is_available: item?.is_available ?? true,
    is_vegetarian: item?.is_vegetarian ?? false,
    is_vegan: item?.is_vegan ?? false,
    contains_gluten: item?.contains_gluten ?? false,
    contains_dairy: item?.contains_dairy ?? false,
    contains_nuts: item?.contains_nuts ?? false,
    contains_fish: item?.contains_fish ?? false,
    contains_shellfish: item?.contains_shellfish ?? false,
    contains_eggs: item?.contains_eggs ?? false,
    is_spicy: item?.is_spicy ?? false,
  })
  const [image, setImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [categoryInput, setCategoryInput] = useState('')
  const [useCustomCategory, setUseCustomCategory] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  // Reload categories when form opens/closes or when item changes
  useEffect(() => {
    if (item) {
      loadCategories()
    }
  }, [item])

  const loadCategories = async () => {
    try {
      const cats = await api.getCategories()
      setCategories(cats || [])
    } catch (error) {
      console.error('Failed to load categories:', error)
      toast.error('Greška pri učitavanju kategorija')
      setCategories([]) // Set empty array on error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validate category
    const categoryValue = presetCategory || formData.category.trim()
    if (!categoryValue) {
      toast.error('Molimo odaberite kategoriju')
      setLoading(false)
      return
    }

    try {
      // If creating a new category, save it first
      if (!presetCategory && useCustomCategory && categoryInput.trim() && formData.category.trim()) {
        try {
          await api.createCategory(formData.category.trim())
          await loadCategories() // Reload categories list
          toast.success('Nova kategorija je dodana')
        } catch (error: any) {
          // Category might already exist, that's okay
          if (error.response?.status !== 400) {
            console.error('Failed to create category:', error)
          }
        }
      }

      const formDataToSend = new FormData()
      formDataToSend.append('name_hr', formData.name_hr)
      formDataToSend.append('description_hr', formData.description_hr)
      formDataToSend.append('price', formData.price.toString())
      formDataToSend.append('category', categoryValue)
      formDataToSend.append('is_available', formData.is_available.toString())
      formDataToSend.append('is_vegetarian', formData.is_vegetarian.toString())
      formDataToSend.append('is_vegan', formData.is_vegan.toString())
      formDataToSend.append('contains_gluten', formData.contains_gluten.toString())
      formDataToSend.append('contains_dairy', formData.contains_dairy.toString())
      formDataToSend.append('contains_nuts', formData.contains_nuts.toString())
      formDataToSend.append('contains_fish', formData.contains_fish.toString())
      formDataToSend.append('contains_shellfish', formData.contains_shellfish.toString())
      formDataToSend.append('contains_eggs', formData.contains_eggs.toString())
      formDataToSend.append('is_spicy', formData.is_spicy.toString())
      
      if (image) {
        formDataToSend.append('image', image)
      }

      if (item) {
        await api.updateMenuItem(item.id, formDataToSend)
        toast.success('Stavka je ažurirana')
      } else {
        await api.createMenuItem(formDataToSend)
        toast.success('Stavka je dodana')
      }

      onSuccess()
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Greška pri spremanju stavke'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name_hr">Naziv</Label>
        <Input
          id="name_hr"
          value={formData.name_hr}
          onChange={(e) => setFormData({ ...formData, name_hr: e.target.value })}
          placeholder="Naziv jela"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description_hr">Opis</Label>
        <Textarea
          id="description_hr"
          value={formData.description_hr}
          onChange={(e) => setFormData({ ...formData, description_hr: e.target.value })}
          placeholder="Opis jela (sastojci, priprema, itd.)"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Cijena (€)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            onFocus={(e) => {
              if (e.target.value === '0') {
                e.target.value = ''
              }
            }}
            placeholder="0.00"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Kategorija <span className="text-destructive">*</span></Label>
          {presetCategory ? (
            <Input
              value={presetCategory}
              disabled
              className="bg-muted"
            />
          ) : !useCustomCategory ? (
            <div className="space-y-2">
              <Select
                value={formData.category || undefined}
                onValueChange={(value) => {
                  if (value === "__custom__") {
                    setUseCustomCategory(true)
                    setCategoryInput('')
                    setFormData({ ...formData, category: '' })
                  } else {
                    setFormData({ ...formData, category: value })
                  }
                }}
                required
              >
                <SelectTrigger id="category" className={`w-full ${!formData.category ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder={categories.length > 0 ? "Odaberi kategoriju" : "Kliknite za dodavanje kategorije"} />
                </SelectTrigger>
                <SelectContent className="z-[100]">
                  {categories.length > 0 ? (
                    <>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                      <SelectItem value="__custom__">
                        + Dodaj novu kategoriju
                      </SelectItem>
                    </>
                  ) : (
                    <SelectItem value="__custom__">
                      + Dodaj novu kategoriju
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {/* Fallback: Direct input option */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setUseCustomCategory(true)}
                className="w-full"
              >
                Ili unesite kategoriju direktno
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                id="category-custom"
                value={categoryInput}
                onChange={(e) => {
                  setCategoryInput(e.target.value)
                  setFormData({ ...formData, category: e.target.value })
                }}
                placeholder="Unesite novu kategoriju"
                required
                className={!categoryInput.trim() ? 'border-destructive' : ''}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={async () => {
                  if (categoryInput.trim()) {
                    try {
                      await api.createCategory(categoryInput.trim())
                      await loadCategories()
                      setFormData({ ...formData, category: categoryInput.trim() })
                      setUseCustomCategory(false)
                      setCategoryInput('')
                      toast.success('Kategorija je dodana')
                    } catch (error: any) {
                      const errorMessage = error.response?.data?.detail || 'Greška pri dodavanju kategorije'
                      toast.error(errorMessage)
                    }
                  } else {
                    setUseCustomCategory(false)
                    setCategoryInput('')
                  }
                }}
              >
                Spremi kategoriju
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUseCustomCategory(false)
                  setCategoryInput('')
                }}
              >
                Odustani
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Slika</Label>
        <Input
          id="image"
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_available"
          checked={formData.is_available}
          onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
          className="w-4 h-4"
        />
        <Label htmlFor="is_available" className="cursor-pointer">
          Dostupno
        </Label>
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-base font-semibold">Alergeni i Posebne Opcije</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_vegetarian"
              checked={formData.is_vegetarian}
              onChange={(e) => setFormData({ ...formData, is_vegetarian: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="is_vegetarian" className="cursor-pointer">Vegetarijansko</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_vegan"
              checked={formData.is_vegan}
              onChange={(e) => setFormData({ ...formData, is_vegan: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="is_vegan" className="cursor-pointer">Vegansko</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="contains_gluten"
              checked={formData.contains_gluten}
              onChange={(e) => setFormData({ ...formData, contains_gluten: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="contains_gluten" className="cursor-pointer">Sadrži gluten</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="contains_dairy"
              checked={formData.contains_dairy}
              onChange={(e) => setFormData({ ...formData, contains_dairy: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="contains_dairy" className="cursor-pointer">Sadrži mliječne proizvode</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="contains_nuts"
              checked={formData.contains_nuts}
              onChange={(e) => setFormData({ ...formData, contains_nuts: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="contains_nuts" className="cursor-pointer">Sadrži orašaste plodove</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="contains_fish"
              checked={formData.contains_fish}
              onChange={(e) => setFormData({ ...formData, contains_fish: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="contains_fish" className="cursor-pointer">Sadrži ribu</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="contains_shellfish"
              checked={formData.contains_shellfish}
              onChange={(e) => setFormData({ ...formData, contains_shellfish: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="contains_shellfish" className="cursor-pointer">Sadrži školjke</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="contains_eggs"
              checked={formData.contains_eggs}
              onChange={(e) => setFormData({ ...formData, contains_eggs: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="contains_eggs" className="cursor-pointer">Sadrži jaja</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_spicy"
              checked={formData.is_spicy}
              onChange={(e) => setFormData({ ...formData, is_spicy: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="is_spicy" className="cursor-pointer">Ljuto</Label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Odustani
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Spremanje...' : 'Spremi'}
        </Button>
      </div>
    </form>
  )
}

