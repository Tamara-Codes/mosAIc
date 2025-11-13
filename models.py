from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

class RestaurantInfo(Base):
    __tablename__ = "restaurant_info"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    address = Column(String)
    phone = Column(String)
    email = Column(String)

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)  # Croatian name
    order = Column(Integer, default=0, index=True)
    
    # Relationship to translations
    translations = relationship("CategoryTranslation", back_populates="category", cascade="all, delete-orphan")

class MenuItem(Base):
    __tablename__ = "menu_items"
    
    id = Column(Integer, primary_key=True, index=True)
    name_hr = Column(String, nullable=False)  # Croatian name
    name_en = Column(String, nullable=False)  # English name
    description_hr = Column(String)  # Croatian description
    description_en = Column(String)  # English description
    price = Column(Float, nullable=False)
    image_path = Column(String)  # Path to uploaded image
    category = Column(String)  # e.g., "Glavna jela", "Deserti", etc.
    is_available = Column(Boolean, default=True)
    
    # Allergen information
    is_vegetarian = Column(Boolean, default=False)
    is_vegan = Column(Boolean, default=False)
    contains_gluten = Column(Boolean, default=False)
    contains_dairy = Column(Boolean, default=False)
    contains_nuts = Column(Boolean, default=False)
    contains_fish = Column(Boolean, default=False)
    contains_shellfish = Column(Boolean, default=False)
    contains_eggs = Column(Boolean, default=False)
    is_spicy = Column(Boolean, default=False)
    
    # Relationship to translations
    translations = relationship("Translation", back_populates="menu_item", cascade="all, delete-orphan")

class Translation(Base):
    __tablename__ = "translations"
    
    id = Column(Integer, primary_key=True, index=True)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id", ondelete="CASCADE"), nullable=False)
    language_code = Column(String(10), nullable=False, index=True)  # e.g., "en", "de", "it", "fr"
    language_name = Column(String(50), nullable=False)  # e.g., "English", "German", "Italian"
    name = Column(String, nullable=False)  # Translated name
    description = Column(Text)  # Translated description
    is_ai_generated = Column(Boolean, default=True)  # Flag to indicate AI-generated translation
    
    # Relationship to menu item
    menu_item = relationship("MenuItem", back_populates="translations")

class CategoryTranslation(Base):
    __tablename__ = "category_translations"
    
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    language_code = Column(String(10), nullable=False, index=True)  # e.g., "en", "de", "it", "fr"
    language_name = Column(String(50), nullable=False)  # e.g., "English", "German", "Italian"
    name = Column(String, nullable=False)  # Translated category name
    is_ai_generated = Column(Boolean, default=True)  # Flag to indicate AI-generated translation
    
    # Relationship to category
    category = relationship("Category", back_populates="translations")

