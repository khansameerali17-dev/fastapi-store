from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Models (In-Memory) ---
products_db = [
    # Produce - Fruits
    {"id": 1, "name": "Organic Bananas", "description": "Fresh bunch of organic bananas", "price": 2.99, "image_url": "/images/organic-bananas.jpg", "category": "Fruits"},
    {"id": 2, "name": "Fresh Strawberries", "description": "Sweet and juicy red strawberries (1lb)", "price": 4.99, "image_url": "/images/fresh-strawberries.jpg", "category": "Fruits"},
    {"id": 3, "name": "Hass Avocados", "description": "Perfectly ripe Hass avocados (bag of 4)", "price": 5.49, "image_url": "/images/hass-avocados.jpg", "category": "Fruits"},
    {"id": 4, "name": "Honeycrisp Apples", "description": "Crisp and sweet apples (per lb)", "price": 2.49, "image_url": "/images/honeycrisp-apples.jpg", "category": "Fruits"},
    
    # Produce - Vegetables
    {"id": 5, "name": "Organic Spinach", "description": "Baby spinach leaves, pre-washed", "price": 3.29, "image_url": "/images/organic-spinach.jpg", "category": "Vegetables"},
    {"id": 6, "name": "Cherry Tomatoes", "description": "Vine-ripened cherry tomatoes (pint)", "price": 3.99, "image_url": "/images/cherry-tomatoes.jpg", "category": "Vegetables"},
    {"id": 7, "name": "Red Bell Peppers", "description": "Crunchy red sweet bell peppers (each)", "price": 1.50, "image_url": "/images/red-bell-peppers.jpg", "category": "Vegetables"},
    {"id": 8, "name": "Broccoli Crowns", "description": "Fresh broccoli crowns (per lb)", "price": 2.19, "image_url": "/images/broccoli-crowns.jpg", "category": "Vegetables"},

    # Dairy & Eggs
    {"id": 9, "name": "Whole Milk", "description": "1 Gallon of vitamin D whole milk", "price": 3.49, "image_url": "/images/whole-milk.jpg", "category": "Dairy"},
    {"id": 10, "name": "Free Range Eggs", "description": "Grade A Large brown eggs (1 dozen)", "price": 5.99, "image_url": "/images/free-range-eggs.jpg", "category": "Dairy"},
    {"id": 11, "name": "Greek Yogurt", "description": "Plain unsweetened Greek yogurt (32oz)", "price": 4.59, "image_url": "/images/greek-yogurt.jpg", "category": "Dairy"},
    {"id": 12, "name": "Cheddar Cheese", "description": "Sharp cheddar block (8oz)", "price": 3.79, "image_url": "/images/cheddar-cheese.jpg", "category": "Dairy"},

    # Bakery
    {"id": 13, "name": "Sourdough Boule", "description": "Artisan baked sourdough bread", "price": 5.49, "image_url": "/images/sourdough-boule.jpg", "category": "Bakery"},
    {"id": 14, "name": "Croissants", "description": "Butter croissants, freshly baked (4 pack)", "price": 6.99, "image_url": "/images/croissants.jpg", "category": "Bakery"},
    {"id": 15, "name": "Blueberry Muffins", "description": "Jumbo blueberry muffins (4 pack)", "price": 5.99, "image_url": "/images/blueberry-muffins.jpg", "category": "Bakery"},

    # Meat & Seafood
    {"id": 16, "name": "Chicken Breasts", "description": "Boneless skinless chicken breasts (per lb)", "price": 6.49, "image_url": "/images/chicken-breasts.jpg", "category": "Meat"},
    {"id": 17, "name": "Ground Beef", "description": "Grass-fed 85% lean ground beef (1lb)", "price": 7.99, "image_url": "/images/ground-beef.jpg", "category": "Meat"},
    {"id": 18, "name": "Atlantic Salmon", "description": "Fresh center-cut Atlantic salmon (per lb)", "price": 12.99, "image_url": "/images/atlantic-salmon.jpg", "category": "Meat"},

    # Pantry & Snacks
    {"id": 19, "name": "Extra Virgin Olive Oil", "description": "Cold-pressed organic olive oil (500ml)", "price": 14.99, "image_url": "/images/olive-oil.jpg", "category": "Pantry"},
    {"id": 20, "name": "Ground Coffee", "description": "Dark roast arabica whole bean (12oz)", "price": 9.99, "image_url": "/images/ground-coffee.jpg", "category": "Pantry"},
    {"id": 21, "name": "Potato Chips", "description": "Sea salt and vinegar kettle chips (8oz)", "price": 3.99, "image_url": "/images/potato-chips.jpg", "category": "Snacks"},
    {"id": 22, "name": "Dark Chocolate Bar", "description": "70% Cocoa dark chocolate with sea salt", "price": 3.49, "image_url": "/images/dark-chocolate.jpg", "category": "Snacks"},
    
    # Beverages
    {"id": 23, "name": "Sparkling Water", "description": "Lemon flavored sparkling water (8 pack)", "price": 4.99, "image_url": "/images/sparkling-water.jpg", "category": "Beverages"},
    {"id": 24, "name": "Orange Juice", "description": "100% pure squeezed orange juice (52oz)", "price": 5.49, "image_url": "/images/orange-juice.jpg", "category": "Beverages"}
]

from typing import List, Optional, Dict, Any

carts_db: Dict[str, Dict[str, Any]] = {}
orders_db: List[Dict[str, Any]] = []

def get_cart(cart_id: str) -> Dict[str, Any]:
    if cart_id not in carts_db:
        carts_db[cart_id] = {"id": cart_id, "items": []}
    return carts_db[cart_id]

# --- Pydantic Schemas ---
class CartItemAdd(BaseModel):
    product_id: int
    quantity: int

class OrderCreate(BaseModel):
    cartId: str
    customer_info: Optional[dict] = {}

# --- API Endpoints ---
@app.get("/api/products")
def get_products():
    return products_db

@app.get("/api/products/{product_id}")
def get_product(product_id: int):
    product = next((p for p in products_db if p["id"] == product_id), None)
    if product:
        return product
    raise HTTPException(status_code=404, detail="Product not found")

@app.get("/api/cart/{cart_id}")
def get_cart_view(cart_id: str):
    cart = get_cart(cart_id)
    populated_items = []
    
    for item in cart["items"]:
        product = next((p for p in products_db if p["id"] == item["product_id"]), None)
        populated_items.append({**item, "product": product})
        
    return {"id": cart["id"], "items": populated_items}

@app.post("/api/cart/{cart_id}/items")
def add_to_cart(cart_id: str, item_data: CartItemAdd):
    product_exists = any(p["id"] == item_data.product_id for p in products_db)
    if not product_exists:
        raise HTTPException(status_code=404, detail="Product not found")

    cart = get_cart(cart_id)
    existing_item = next((item for item in cart["items"] if item["product_id"] == item_data.product_id), None)

    if existing_item:
        existing_item["quantity"] += item_data.quantity
    else:
        cart["items"].append({"product_id": item_data.product_id, "quantity": item_data.quantity})

    return cart

@app.delete("/api/cart/{cart_id}/items/{product_id}")
def remove_from_cart(cart_id: str, product_id: int):
    cart = get_cart(cart_id)
    cart["items"] = [item for item in cart["items"] if item["product_id"] != product_id]
    return cart

@app.post("/api/orders")
def place_order(order_data: OrderCreate):
    cart_id = order_data.cartId
    if cart_id not in carts_db or not carts_db[cart_id]["items"]:
        raise HTTPException(status_code=400, detail="Cart is empty or invalid")

    cart = carts_db[cart_id]
    order_items: List[Dict[str, Any]] = []

    for item in cart["items"]:
        product = next((p for p in products_db if p["id"] == item["product_id"]), None)
        if product:
            order_items.append({
                "product_id": item["product_id"],
                "quantity": int(item["quantity"]),
                "price_at_purchase": float(product["price"]),
                "name": product["name"]
            })
            
    total_amount: float = sum((float(i["price_at_purchase"]) * float(i["quantity"])) for i in order_items)

    new_order = {
        "id": len(orders_db) + 1,
        "cart_id": cart_id,
        "items": order_items,
        "total_amount": round(float(total_amount) + 5.0, 2),
        "status": "placed",
        "created_at": datetime.now().isoformat(),
        "customer_info": order_data.customer_info
    }

    orders_db.append(new_order)
    carts_db[cart_id] = {"id": cart_id, "items": []} # Empty list
    
    return new_order

@app.get("/api/admin/orders")
def get_all_orders():
    # Sort orders by newest first
    return sorted(orders_db, key=lambda x: x["id"], reverse=True)

class OrderStatusUpdate(BaseModel):
    status: str

ADMIN_PASSWORD = "admin123"

class AdminLogin(BaseModel):
    password: str

@app.post("/api/admin/login")
def admin_login(login_data: AdminLogin):
    if login_data.password == ADMIN_PASSWORD:
        return {"authenticated": True}
    raise HTTPException(status_code=401, detail="Invalid password")

@app.put("/api/admin/orders/{order_id}")
def update_order_status(order_id: int, status_data: OrderStatusUpdate):
    valid_statuses = ["placed", "accepted", "rejected", "delivered"]
    new_status = status_data.status.lower()
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
    
    order = next((o for o in orders_db if o["id"] == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order["status"] = new_status
    return order

# Serve static files from "public" directory
# html=True makes index.html serve at "/" automatically
# This MUST be the last mount so API routes take priority
app.mount("/", StaticFiles(directory="public", html=True), name="static")
