import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface RestaurantInfo {
  id: number
  name: string
  description: string | null
  address: string | null
  phone: string | null
  email: string | null
}

export interface Translation {
  id: number
  menu_item_id: number
  language_code: string
  language_name: string
  name: string
  description: string | null
  is_ai_generated: boolean
}

export interface MenuItem {
  id: number
  name_hr: string
  name_en: string
  description_hr: string | null
  description_en: string | null
  price: number
  category: string | null
  image_path: string | null
  is_available: boolean
  is_vegetarian: boolean
  is_vegan: boolean
  contains_gluten: boolean
  contains_dairy: boolean
  contains_nuts: boolean
  contains_fish: boolean
  contains_shellfish: boolean
  contains_eggs: boolean
  is_spicy: boolean
  translations?: Translation[]
}

export interface CategoryTranslation {
  id: number
  category_id: number
  language_code: string
  language_name: string
  name: string
  is_ai_generated: boolean
}

export interface Category {
  id: number
  name: string
  order?: number
  translations?: CategoryTranslation[]
}

export interface Analytics {
  total_items: number
  available_items: number
  unavailable_items: number
  categories: Record<string, number>
  allergen_counts: {
    vegetarian: number
    vegan: number
    gluten: number
    dairy: number
    nuts: number
    fish: number
    shellfish: number
    eggs: number
    spicy: number
  }
  total_categories: number
}

export const api = {
  getMenuItems: async (): Promise<MenuItem[]> => {
    const response = await axios.get<MenuItem[]>(`${API_BASE_URL}/api/menu-items`)
    return response.data
  },

  getMenuItemsWithTranslations: async (): Promise<MenuItem[]> => {
    const response = await axios.get<MenuItem[]>(`${API_BASE_URL}/api/menu-items-with-translations`)
    return response.data
  },
  
  createMenuItem: async (data: FormData): Promise<MenuItem> => {
    const response = await axios.post<MenuItem>(`${API_BASE_URL}/api/menu-items`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
  
  updateMenuItem: async (id: number, data: FormData): Promise<MenuItem> => {
    const response = await axios.put<MenuItem>(`${API_BASE_URL}/api/menu-items/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
  
  deleteMenuItem: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/api/menu-items/${id}`)
  },
  
  login: async (password: string): Promise<boolean> => {
    try {
      const formData = new FormData()
      formData.append('password', password)
      const response = await axios.post(`${API_BASE_URL}/admin/login`, formData)
      return response.data?.success === true
    } catch {
      return false
    }
  },

  getAnalytics: async (): Promise<Analytics> => {
    const response = await axios.get<Analytics>(`${API_BASE_URL}/api/analytics`)
    return response.data
  },

  getCategories: async (): Promise<string[]> => {
    const response = await axios.get<{ categories: string[]; categories_with_ids: Category[] }>(`${API_BASE_URL}/api/categories`)
    return response.data.categories
  },

  getCategoriesWithIds: async (): Promise<Category[]> => {
    const response = await axios.get<{ categories: string[]; categories_with_ids: Category[] }>(`${API_BASE_URL}/api/categories`)
    return response.data.categories_with_ids
  },

  getCategoriesWithTranslations: async (): Promise<Category[]> => {
    const response = await axios.get<Category[]>(`${API_BASE_URL}/api/categories-with-translations`)
    return response.data
  },

  getCategoryByName: async (name: string): Promise<Category> => {
    const response = await axios.get<Category>(`${API_BASE_URL}/api/categories/by-name/${encodeURIComponent(name)}`)
    return response.data
  },

  createCategory: async (name: string): Promise<Category> => {
    const response = await axios.post<Category>(`${API_BASE_URL}/api/categories`, { name })
    return response.data
  },

  updateCategory: async (id: number, name: string, order?: number): Promise<Category> => {
    const response = await axios.put<Category>(`${API_BASE_URL}/api/categories/${id}`, { name, order })
    return response.data
  },

  deleteCategory: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/api/categories/${id}`)
  },

  reorderCategories: async (categories: Category[]): Promise<void> => {
    await axios.put(`${API_BASE_URL}/api/categories/reorder`, categories)
  },

  getQrCode: async (): Promise<{ qr_code: string; menu_url: string }> => {
    const response = await axios.get<{ qr_code: string; menu_url: string }>(`${API_BASE_URL}/api/qr-code`)
    return response.data
  },

  getRestaurantInfo: async (): Promise<RestaurantInfo> => {
    const response = await axios.get<RestaurantInfo>(`${API_BASE_URL}/api/restaurant-info`)
    return response.data
  },

  saveRestaurantInfo: async (info: Partial<RestaurantInfo>): Promise<RestaurantInfo> => {
    const response = await axios.post<RestaurantInfo>(`${API_BASE_URL}/api/restaurant-info`, info)
    return response.data
  },
}

