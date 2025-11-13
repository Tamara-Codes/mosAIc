from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
import shutil
from typing import List, Optional
import qrcode
from io import BytesIO
import base64
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

from database import get_db, engine, Base
from models import MenuItem, Category, RestaurantInfo, Translation
from schemas import (
    MenuItemCreate, MenuItemUpdate, MenuItemResponse, 
    CategoryCreate, CategoryResponse, 
    RestaurantInfoCreate, RestaurantInfoResponse,
    TranslationCreate, TranslationUpdate, TranslationResponse,
    MenuItemWithTranslationsResponse
)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],  # Vite default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create necessary directories
os.makedirs("static/images", exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Simple authentication (for MVP - in production use proper auth)
# Get admin password from environment variable, default to "admin123" for MVP
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

# Initialize OpenAI client
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Supported languages for translation (default set)
DEFAULT_SUPPORTED_LANGUAGES = {
    "en": "English",
    "de": "German",
    "it": "Italian",
    "fr": "French",
    "es": "Spanish",
    "sl": "Slovenian",
    "cs": "Czech",
    "pl": "Polish",
    "hu": "Hungarian"
}

# Load supported languages from file or use default
LANGUAGES_FILE = "supported_languages.json"
def load_supported_languages():
    try:
        if os.path.exists(LANGUAGES_FILE):
            with open(LANGUAGES_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        return DEFAULT_SUPPORTED_LANGUAGES.copy()
    except:
        return DEFAULT_SUPPORTED_LANGUAGES.copy()

def save_supported_languages(languages):
    try:
        with open(LANGUAGES_FILE, 'w', encoding='utf-8') as f:
            json.dump(languages, f, ensure_ascii=False, indent=2)
        return True
    except:
        return False

SUPPORTED_LANGUAGES = load_supported_languages()

@app.get("/")
async def root():
    """Root endpoint - API info"""
    return JSONResponse({"message": "API is running. Use the React frontend at http://localhost:5173"})

@app.post("/admin/login")
async def admin_login_post(password: str = Form(...)):
    """Handle admin login"""
    if password == ADMIN_PASSWORD:
        return JSONResponse({"success": True})
    else:
        return JSONResponse({"success": False, "error": "Netočna lozinka!"}, status_code=401)

@app.get("/api/restaurant-info", response_model=RestaurantInfoResponse)
async def get_restaurant_info(db: Session = Depends(get_db)):
    """Get restaurant information"""
    info = db.query(RestaurantInfo).first()
    if not info:
        # Return default info if not set
        return RestaurantInfoResponse(id=0, name="Restaurant Menu", description="", address="", phone="", email="")
    return info

@app.post("/api/restaurant-info", response_model=RestaurantInfoResponse)
async def save_restaurant_info(info: RestaurantInfoCreate, db: Session = Depends(get_db)):
    """Save or update restaurant information"""
    existing = db.query(RestaurantInfo).first()
    if existing:
        existing.name = info.name
        existing.description = info.description
        existing.address = info.address
        existing.phone = info.phone
        existing.email = info.email
    else:
        existing = RestaurantInfo(**info.dict())
        db.add(existing)
    
    db.commit()
    db.refresh(existing)
    return existing

@app.get("/api/menu-items", response_model=List[MenuItemResponse])
async def get_menu_items(db: Session = Depends(get_db)):
    """Get all menu items"""
    return db.query(MenuItem).all()

@app.post("/api/menu-items", response_model=MenuItemResponse)
async def create_menu_item(
    name_hr: str = Form(...),
    description_hr: Optional[str] = Form(None),
    price: float = Form(...),
    category: Optional[str] = Form(None),
    is_available: Optional[str] = Form("true"),  # Default to available
    is_vegetarian: Optional[str] = Form("false"),
    is_vegan: Optional[str] = Form("false"),
    contains_gluten: Optional[str] = Form("false"),
    contains_dairy: Optional[str] = Form("false"),
    contains_nuts: Optional[str] = Form("false"),
    contains_fish: Optional[str] = Form("false"),
    contains_shellfish: Optional[str] = Form("false"),
    contains_eggs: Optional[str] = Form("false"),
    is_spicy: Optional[str] = Form("false"),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """Create a new menu item"""
    image_path = None
    
    if image:
        # Save uploaded image
        file_path = f"static/images/{image.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        image_path = f"/static/images/{image.filename}"
    
    def str_to_bool(value: Optional[str]) -> bool:
        return value.lower() in ("true", "on", "1") if value else False
    
    menu_item = MenuItem(
        name_hr=name_hr,
        name_en=name_hr,  # Use Croatian name for English field for now
        description_hr=description_hr,
        description_en=description_hr,  # Use Croatian description for English field for now
        price=price,
        category=category,
        image_path=image_path,
        is_available=str_to_bool(is_available),
        is_vegetarian=str_to_bool(is_vegetarian),
        is_vegan=str_to_bool(is_vegan),
        contains_gluten=str_to_bool(contains_gluten),
        contains_dairy=str_to_bool(contains_dairy),
        contains_nuts=str_to_bool(contains_nuts),
        contains_fish=str_to_bool(contains_fish),
        contains_shellfish=str_to_bool(contains_shellfish),
        contains_eggs=str_to_bool(contains_eggs),
        is_spicy=str_to_bool(is_spicy)
    )
    
    db.add(menu_item)
    db.commit()
    db.refresh(menu_item)
    
    return menu_item

@app.put("/api/menu-items/{item_id}", response_model=MenuItemResponse)
async def update_menu_item(
    item_id: int,
    name_hr: Optional[str] = Form(None),
    description_hr: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    category: Optional[str] = Form(None),
    is_available: Optional[str] = Form(None),
    is_vegetarian: Optional[str] = Form(None),
    is_vegan: Optional[str] = Form(None),
    contains_gluten: Optional[str] = Form(None),
    contains_dairy: Optional[str] = Form(None),
    contains_nuts: Optional[str] = Form(None),
    contains_fish: Optional[str] = Form(None),
    contains_shellfish: Optional[str] = Form(None),
    contains_eggs: Optional[str] = Form(None),
    is_spicy: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """Update a menu item"""
    menu_item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    
    if not menu_item:
        raise HTTPException(status_code=404, detail="Stavka menija nije pronađena")
    
    def str_to_bool(value: Optional[str]) -> bool:
        return value.lower() in ("true", "on", "1") if value else False
    
    if name_hr is not None:
        menu_item.name_hr = name_hr
        menu_item.name_en = name_hr  # Keep English field in sync with Croatian
    if description_hr is not None:
        menu_item.description_hr = description_hr
        menu_item.description_en = description_hr  # Keep English field in sync with Croatian
    if price is not None:
        menu_item.price = price
    if category is not None:
        menu_item.category = category
    if is_available is not None:
        menu_item.is_available = str_to_bool(is_available)
    if is_vegetarian is not None:
        menu_item.is_vegetarian = str_to_bool(is_vegetarian)
    if is_vegan is not None:
        menu_item.is_vegan = str_to_bool(is_vegan)
    if contains_gluten is not None:
        menu_item.contains_gluten = str_to_bool(contains_gluten)
    if contains_dairy is not None:
        menu_item.contains_dairy = str_to_bool(contains_dairy)
    if contains_nuts is not None:
        menu_item.contains_nuts = str_to_bool(contains_nuts)
    if contains_fish is not None:
        menu_item.contains_fish = str_to_bool(contains_fish)
    if contains_shellfish is not None:
        menu_item.contains_shellfish = str_to_bool(contains_shellfish)
    if contains_eggs is not None:
        menu_item.contains_eggs = str_to_bool(contains_eggs)
    if is_spicy is not None:
        menu_item.is_spicy = str_to_bool(is_spicy)
    
    if image:
        # Save new image
        file_path = f"static/images/{image.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        menu_item.image_path = f"/static/images/{image.filename}"
    
    db.commit()
    db.refresh(menu_item)
    
    return menu_item

@app.delete("/api/menu-items/{item_id}")
async def delete_menu_item(item_id: int, db: Session = Depends(get_db)):
    """Delete a menu item"""
    menu_item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    
    if not menu_item:
        raise HTTPException(status_code=404, detail="Stavka menija nije pronađena")
    
    # Delete image if exists
    if menu_item.image_path:
        image_file = menu_item.image_path.replace("/static", "static")
        if os.path.exists(image_file):
            os.remove(image_file)
    
    db.delete(menu_item)
    db.commit()
    
    return {"message": "Stavka je obrisana"}

@app.get("/api/analytics")
async def get_analytics(db: Session = Depends(get_db)):
    """Get analytics data for dashboard"""
    all_items = db.query(MenuItem).all()
    
    total_items = len(all_items)
    available_items = len([item for item in all_items if item.is_available])
    unavailable_items = total_items - available_items
    
    # Count by category
    categories = {}
    for item in all_items:
        cat = item.category or "Bez kategorije"
        categories[cat] = categories.get(cat, 0) + 1
    
    # Allergen counts
    allergen_counts = {
        "vegetarian": len([item for item in all_items if item.is_vegetarian]),
        "vegan": len([item for item in all_items if item.is_vegan]),
        "gluten": len([item for item in all_items if item.contains_gluten]),
        "dairy": len([item for item in all_items if item.contains_dairy]),
        "nuts": len([item for item in all_items if item.contains_nuts]),
        "fish": len([item for item in all_items if item.contains_fish]),
        "shellfish": len([item for item in all_items if item.contains_shellfish]),
        "eggs": len([item for item in all_items if item.contains_eggs]),
        "spicy": len([item for item in all_items if item.is_spicy]),
    }
    
    return JSONResponse({
        "total_items": total_items,
        "available_items": available_items,
        "unavailable_items": unavailable_items,
        "categories": categories,
        "allergen_counts": allergen_counts,
        "total_categories": len(categories)
    })

# Predefined categories
PREDEFINED_CATEGORIES = [
    "HLADNA PREDJELA",
    "TOPLA PREDJELA",
    "MESNA JELA S PRILOGOM",
    "RIBLJA JELA",
    "OBROČNE SALATE",
    "DESERT"
]

@app.get("/api/categories")
async def get_categories(db: Session = Depends(get_db)):
    """Get all categories from database and predefined ones"""
    # Get categories from database (this is the source of truth)
    db_categories = db.query(Category).order_by(Category.order, Category.id).all()
    category_dict = {cat.name: cat.id for cat in db_categories}
    categories_set = set(category_dict.keys())
    
    # Add predefined categories if they don't exist in database
    max_order = max([cat.order for cat in db_categories], default=-1)
    for idx, cat in enumerate(PREDEFINED_CATEGORIES):
        if cat not in categories_set:
            # Check if category exists in DB, if not add it
            existing = db.query(Category).filter(Category.name == cat).first()
            if not existing:
                new_cat = Category(name=cat, order=max_order + idx + 1)
                db.add(new_cat)
                db.flush()
                category_dict[cat] = new_cat.id
                categories_set.add(cat)
            else:
                category_dict[cat] = existing.id
                categories_set.add(cat)
    
    db.commit()
    
    # Fetch again to get updated order
    db_categories = db.query(Category).order_by(Category.order, Category.id).all()
    categories_list = [cat.name for cat in db_categories]
    categories_with_ids = [{"id": cat.id, "name": cat.name, "order": cat.order} for cat in db_categories]
    
    return JSONResponse({
        "categories": categories_list,  # For backward compatibility
        "categories_with_ids": categories_with_ids  # New format with IDs and order
    })

@app.get("/api/categories/by-name/{category_name}")
async def get_category_by_name(category_name: str, db: Session = Depends(get_db)):
    """Get category by name"""
    category = db.query(Category).filter(Category.name == category_name).first()
    if not category:
        raise HTTPException(status_code=404, detail="Kategorija nije pronađena")
    return category

@app.post("/api/categories", response_model=CategoryResponse)
async def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    """Create a new category"""
    # Check if category already exists
    existing = db.query(Category).filter(Category.name == category.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Kategorija već postoji")
    
    # Get max order value
    max_category = db.query(Category).order_by(Category.order.desc()).first()
    next_order = (max_category.order + 1) if max_category else 0
    
    new_category = Category(name=category.name, order=next_order)
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    
    return new_category

@app.put("/api/categories/reorder")
async def reorder_categories(categories_order: List[dict], db: Session = Depends(get_db)):
    """Reorder categories"""
    for idx, item in enumerate(categories_order):
        category = db.query(Category).filter(Category.id == item["id"]).first()
        if category:
            category.order = idx
    
    db.commit()
    return {"message": "Kategorije su preuredene"}

@app.put("/api/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category: CategoryCreate,
    db: Session = Depends(get_db)
):
    """Update a category name and/or order"""
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Kategorija nije pronađena")
    
    # Check if new name already exists
    existing = db.query(Category).filter(
        Category.name == category.name,
        Category.id != category_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Kategorija s tim nazivom već postoji")
    
    old_name = db_category.name
    db_category.name = category.name
    if category.order is not None:
        db_category.order = category.order
    
    # Update all menu items with old category name
    items = db.query(MenuItem).filter(MenuItem.category == old_name).all()
    for item in items:
        item.category = category.name
    
    db.commit()
    db.refresh(db_category)
    
    return db_category

@app.delete("/api/categories/{category_id}")
async def delete_category(category_id: int, db: Session = Depends(get_db)):
    """Delete a category"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Kategorija nije pronađena")
    
    category_name = category.name
    
    # Remove category from all menu items
    items = db.query(MenuItem).filter(MenuItem.category == category_name).all()
    for item in items:
        item.category = None
    
    db.delete(category)
    db.commit()
    
    return {"message": "Kategorija je obrisana"}

@app.post("/api/categories/initialize")
async def initialize_categories(db: Session = Depends(get_db)):
    """Initialize predefined categories (ensures they exist in the system)"""
    # Categories are stored as strings on menu items, so this endpoint
    # just ensures the predefined categories are available in the system
    # They will appear in the categories list even if no items use them yet
    return JSONResponse({
        "message": "Kategorije su inicijalizirane",
        "categories": PREDEFINED_CATEGORIES
    })

# Category Translation endpoints
@app.get("/api/categories-with-translations")
async def get_categories_with_translations(db: Session = Depends(get_db)):
    """Get all categories with their translations"""
    from schemas import CategoryWithTranslationsResponse
    categories = db.query(Category).order_by(Category.order, Category.id).all()
    return [CategoryWithTranslationsResponse.from_orm(cat) for cat in categories]

@app.post("/api/category-translations/generate/{category_id}")
async def generate_category_translations(
    category_id: int, 
    language_codes: List[str],
    db: Session = Depends(get_db)
):
    """Generate AI translations for a category in specified languages"""
    from models import CategoryTranslation
    
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Kategorija nije pronađena")
    
    translations = []
    errors = []
    
    for lang_code in language_codes:
        if lang_code not in SUPPORTED_LANGUAGES:
            errors.append(f"Nepodržan jezik: {lang_code}")
            continue
        
        # Check if translation already exists
        existing = db.query(CategoryTranslation).filter(
            CategoryTranslation.category_id == category_id,
            CategoryTranslation.language_code == lang_code
        ).first()
        
        if existing:
            errors.append(f"Prijevod za {SUPPORTED_LANGUAGES[lang_code]} već postoji")
            continue
        
        try:
            # Generate translation using GPT-4o-mini
            prompt = f"""Translate the following restaurant menu category name from Croatian to {SUPPORTED_LANGUAGES[lang_code]}.
Keep the translation natural and appropriate for a restaurant menu category.

Croatian Category Name: {category.name}

Provide the translation in the following JSON format:
{{
    "name": "translated category name"
}}"""
            
            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a professional translator specialized in restaurant menus. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            import json
            translation_data = json.loads(response.choices[0].message.content)
            
            # Create translation record
            translation = CategoryTranslation(
                category_id=category_id,
                language_code=lang_code,
                language_name=SUPPORTED_LANGUAGES[lang_code],
                name=translation_data["name"],
                is_ai_generated=True
            )
            
            db.add(translation)
            translations.append({
                "language_code": lang_code,
                "language_name": SUPPORTED_LANGUAGES[lang_code],
                "name": translation_data["name"]
            })
            
        except Exception as e:
            errors.append(f"Greška pri generiranju prijevoda za {SUPPORTED_LANGUAGES[lang_code]}: {str(e)}")
    
    db.commit()
    
    return JSONResponse({
        "success": len(translations) > 0,
        "translations": translations,
        "errors": errors
    })

@app.put("/api/category-translations/{translation_id}")
async def update_category_translation(
    translation_id: int,
    name: str,
    db: Session = Depends(get_db)
):
    """Update a category translation"""
    from models import CategoryTranslation
    
    translation = db.query(CategoryTranslation).filter(CategoryTranslation.id == translation_id).first()
    if not translation:
        raise HTTPException(status_code=404, detail="Prijevod nije pronađen")
    
    translation.name = name
    db.commit()
    
    return {"message": "Prijevod je ažuriran"}

@app.delete("/api/category-translations/{translation_id}")
async def delete_category_translation(translation_id: int, db: Session = Depends(get_db)):
    """Delete a category translation"""
    from models import CategoryTranslation
    
    translation = db.query(CategoryTranslation).filter(CategoryTranslation.id == translation_id).first()
    if not translation:
        raise HTTPException(status_code=404, detail="Prijevod nije pronađen")
    
    db.delete(translation)
    db.commit()
    
    return {"message": "Prijevod je obrisan"}

@app.get("/api/qr-code")
async def generate_qr_code_api():
    """Generate QR code for the menu - API endpoint"""
    # Get the base URL from environment or use default
    # For production, set MENU_URL environment variable to your public URL
    menu_url = os.getenv("MENU_URL", "http://localhost:5173")  # Frontend URL
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(menu_url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64 for embedding
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return JSONResponse({
        "qr_code": img_str,
        "menu_url": menu_url
    })

# Translation endpoints
@app.get("/api/supported-languages")
async def get_supported_languages():
    """Get list of supported languages for translation"""
    global SUPPORTED_LANGUAGES
    SUPPORTED_LANGUAGES = load_supported_languages()  # Reload from file
    return JSONResponse({
        "languages": [
            {"code": code, "name": name} 
            for code, name in SUPPORTED_LANGUAGES.items()
        ]
    })

@app.post("/api/languages/add")
async def add_language(language: dict):
    """Add a new supported language"""
    global SUPPORTED_LANGUAGES
    code = language.get("code")
    name = language.get("name")
    
    if not code or not name:
        raise HTTPException(status_code=400, detail="Language code and name are required")
    
    SUPPORTED_LANGUAGES = load_supported_languages()
    if code in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail="Language already exists")
    
    SUPPORTED_LANGUAGES[code] = name
    if save_supported_languages(SUPPORTED_LANGUAGES):
        return JSONResponse({"message": f"Language {name} added successfully"})
    else:
        raise HTTPException(status_code=500, detail="Failed to save languages")

@app.delete("/api/languages/remove/{language_code}")
async def remove_language(language_code: str, db: Session = Depends(get_db)):
    """Remove a supported language and delete all translations for it"""
    global SUPPORTED_LANGUAGES
    SUPPORTED_LANGUAGES = load_supported_languages()
    
    if language_code not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=404, detail="Language not found")
    
    # Delete all translations for this language
    deleted_count = db.query(Translation).filter(Translation.language_code == language_code).delete()
    
    # Delete all category translations for this language
    from models import CategoryTranslation
    db.query(CategoryTranslation).filter(CategoryTranslation.language_code == language_code).delete()
    
    db.commit()
    
    # Remove from supported languages
    language_name = SUPPORTED_LANGUAGES[language_code]
    del SUPPORTED_LANGUAGES[language_code]
    
    if save_supported_languages(SUPPORTED_LANGUAGES):
        return JSONResponse({
            "message": f"Language {language_name} removed successfully",
            "translations_deleted": deleted_count
        })
    else:
        raise HTTPException(status_code=500, detail="Failed to save languages")

@app.get("/api/menu-items-with-translations", response_model=List[MenuItemWithTranslationsResponse])
async def get_menu_items_with_translations(db: Session = Depends(get_db)):
    """Get all menu items with their translations"""
    items = db.query(MenuItem).all()
    return items

@app.get("/api/translations/{menu_item_id}", response_model=List[TranslationResponse])
async def get_translations(menu_item_id: int, db: Session = Depends(get_db)):
    """Get all translations for a specific menu item"""
    menu_item = db.query(MenuItem).filter(MenuItem.id == menu_item_id).first()
    if not menu_item:
        raise HTTPException(status_code=404, detail="Stavka menija nije pronađena")
    
    translations = db.query(Translation).filter(Translation.menu_item_id == menu_item_id).all()
    return translations

@app.post("/api/translations/generate/{menu_item_id}")
async def generate_translations(
    menu_item_id: int, 
    language_codes: List[str],
    db: Session = Depends(get_db)
):
    """Generate AI translations for a menu item in specified languages"""
    menu_item = db.query(MenuItem).filter(MenuItem.id == menu_item_id).first()
    if not menu_item:
        raise HTTPException(status_code=404, detail="Stavka menija nije pronađena")
    
    translations = []
    errors = []
    
    for lang_code in language_codes:
        if lang_code not in SUPPORTED_LANGUAGES:
            errors.append(f"Nepodržan jezik: {lang_code}")
            continue
        
        # Check if translation already exists
        existing = db.query(Translation).filter(
            Translation.menu_item_id == menu_item_id,
            Translation.language_code == lang_code
        ).first()
        
        if existing:
            errors.append(f"Prijevod za {SUPPORTED_LANGUAGES[lang_code]} već postoji")
            continue
        
        try:
            # Generate translation using GPT-4o-mini
            prompt = f"""Translate the following restaurant menu item from Croatian to {SUPPORTED_LANGUAGES[lang_code]}.
Keep the translation natural and appetizing for a restaurant menu.

Croatian Name: {menu_item.name_hr}
Croatian Description: {menu_item.description_hr or ''}

Provide the translation in the following JSON format:
{{
    "name": "translated name",
    "description": "translated description"
}}"""
            
            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a professional translator specialized in restaurant menus. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            import json
            translation_data = json.loads(response.choices[0].message.content)
            
            # Create translation record
            translation = Translation(
                menu_item_id=menu_item_id,
                language_code=lang_code,
                language_name=SUPPORTED_LANGUAGES[lang_code],
                name=translation_data["name"],
                description=translation_data.get("description", ""),
                is_ai_generated=True
            )
            
            db.add(translation)
            translations.append({
                "language_code": lang_code,
                "language_name": SUPPORTED_LANGUAGES[lang_code],
                "name": translation_data["name"],
                "description": translation_data.get("description", "")
            })
            
        except Exception as e:
            errors.append(f"Greška pri generiranju prijevoda za {SUPPORTED_LANGUAGES[lang_code]}: {str(e)}")
    
    db.commit()
    
    return JSONResponse({
        "success": len(translations) > 0,
        "translations": translations,
        "errors": errors
    })

@app.put("/api/translations/{translation_id}", response_model=TranslationResponse)
async def update_translation(
    translation_id: int,
    translation_update: TranslationUpdate,
    db: Session = Depends(get_db)
):
    """Update a translation"""
    translation = db.query(Translation).filter(Translation.id == translation_id).first()
    if not translation:
        raise HTTPException(status_code=404, detail="Prijevod nije pronađen")
    
    if translation_update.name is not None:
        translation.name = translation_update.name
    if translation_update.description is not None:
        translation.description = translation_update.description
    
    # Mark as manually edited (not purely AI-generated)
    translation.is_ai_generated = False
    
    db.commit()
    db.refresh(translation)
    
    return translation

@app.delete("/api/translations/{translation_id}")
async def delete_translation(translation_id: int, db: Session = Depends(get_db)):
    """Delete a translation"""
    translation = db.query(Translation).filter(Translation.id == translation_id).first()
    if not translation:
        raise HTTPException(status_code=404, detail="Prijevod nije pronađen")
    
    db.delete(translation)
    db.commit()
    
    return {"message": "Prijevod je obrisan"}

@app.post("/api/translations/batch-generate")
async def batch_generate_translations(
    language_codes: List[str],
    db: Session = Depends(get_db)
):
    """Generate translations for all menu items in specified languages"""
    menu_items = db.query(MenuItem).all()
    
    if not menu_items:
        raise HTTPException(status_code=404, detail="Nema stavki menija")
    
    total_generated = 0
    total_errors = 0
    results = []
    
    for menu_item in menu_items:
        for lang_code in language_codes:
            if lang_code not in SUPPORTED_LANGUAGES:
                total_errors += 1
                continue
            
            # Check if translation already exists
            existing = db.query(Translation).filter(
                Translation.menu_item_id == menu_item.id,
                Translation.language_code == lang_code
            ).first()
            
            if existing:
                continue
            
            try:
                # Generate translation using GPT-4o-mini
                prompt = f"""Translate the following restaurant menu item from Croatian to {SUPPORTED_LANGUAGES[lang_code]}.
Keep the translation natural and appetizing for a restaurant menu.

Croatian Name: {menu_item.name_hr}
Croatian Description: {menu_item.description_hr or ''}

Provide the translation in the following JSON format:
{{
    "name": "translated name",
    "description": "translated description"
}}"""
                
                response = openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a professional translator specialized in restaurant menus. Always respond with valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    response_format={"type": "json_object"}
                )
                
                import json
                translation_data = json.loads(response.choices[0].message.content)
                
                # Create translation record
                translation = Translation(
                    menu_item_id=menu_item.id,
                    language_code=lang_code,
                    language_name=SUPPORTED_LANGUAGES[lang_code],
                    name=translation_data["name"],
                    description=translation_data.get("description", ""),
                    is_ai_generated=True
                )
                
                db.add(translation)
                total_generated += 1
                
            except Exception as e:
                total_errors += 1
                results.append({
                    "menu_item": menu_item.name_hr,
                    "language": SUPPORTED_LANGUAGES[lang_code],
                    "error": str(e)
                })
    
    db.commit()
    
    return JSONResponse({
        "success": True,
        "total_generated": total_generated,
        "total_errors": total_errors,
        "results": results
    })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
