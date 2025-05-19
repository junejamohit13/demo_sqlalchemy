#main.py
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from pathlib import Path
import json
import sqlite3
from typing import Dict, Any, List, Optional
from fastapi.middleware.cors import CORSMiddleware

ROOT = Path(__file__).parent
schema_cfg = json.loads((ROOT / "schema_config.json").read_text())
ui_cfg     = json.loads((ROOT / "ui_config.json").read_text())

app = FastAPI(title="3-NF demo API (decoupled configs)")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      #  ["*"] is OK for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SQLite database setup
DB_PATH = ROOT / "writeback.db"

def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# Create tables and initialize with dummy data if needed
def init_db():
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    # Create tables
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS customer (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_number TEXT UNIQUE,
        first_name TEXT,
        last_name TEXT,
        email TEXT
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE,
        customer_id INTEGER,
        order_date TEXT,
        status TEXT,
        FOREIGN KEY (customer_id) REFERENCES customer(id)
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS order_item (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        line_number INTEGER,
        product_code TEXT,
        quantity INTEGER,
        unit_price REAL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        UNIQUE(order_id, line_number)
    )
    ''')
    
    # Add dummy data if tables are empty
    cursor.execute("SELECT COUNT(*) FROM customer")
    if cursor.fetchone()[0] == 0:
        # Add dummy customers
        customers = [
            ("CUST-001", "John", "Doe", "john@example.com"),
            ("CUST-002", "Jane", "Smith", "jane@example.com"),
            ("CUST-003", "Bob", "Johnson", "bob@example.com")
        ]
        cursor.executemany(
            "INSERT INTO customer (customer_number, first_name, last_name, email) VALUES (?, ?, ?, ?)",
            customers
        )
        
        # Add dummy orders
        orders = [
            ("ORD-001", 1, "2023-01-15", "NEW"),
            ("ORD-002", 1, "2023-02-20", "PROCESSING"),
            ("ORD-003", 2, "2023-03-10", "DONE"),
            ("ORD-004", 3, "2023-04-05", "NEW")
        ]
        cursor.executemany(
            "INSERT INTO orders (order_number, customer_id, order_date, status) VALUES (?, ?, ?, ?)",
            orders
        )
        
        # Add dummy order items
        order_items = [
            (1, 1, "PROD-A", 2, 19.99),
            (1, 2, "PROD-B", 1, 29.99),
            (2, 1, "PROD-C", 3, 14.99),
            (3, 1, "PROD-D", 1, 49.99)
        ]
        cursor.executemany(
            "INSERT INTO order_item (order_id, line_number, product_code, quantity, unit_price) VALUES (?, ?, ?, ?, ?)",
            order_items
        )
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

class RowIn(BaseModel):
    data: Dict[str, Any]

class BusinessKey(BaseModel):
    key: str
    value: Any

@app.get("/schema-config")
def get_schema_cfg(): 
    return schema_cfg

@app.get("/ui-config")
def get_ui_cfg(): 
    return ui_cfg

@app.get("/business-keys/{table}")
def get_business_keys(table: str, conn: sqlite3.Connection = Depends(get_db)):
    """Get all available business keys for a table"""
    if table not in schema_cfg["tables"]:
        raise HTTPException(404, f"Unknown table {table}")
    
    # Get business key columns
    business_keys = schema_cfg["tables"][table]["businessKeys"]
    if not business_keys:
        return []
    
    # For simplicity, we'll just handle the first business key
    primary_key = business_keys[0]
    
    cursor = conn.cursor()
    cursor.execute(f"SELECT id, {primary_key} FROM {table}")
    results = cursor.fetchall()
    
    # Ensure we return clean values
    formatted_results = []
    for row in results:
        # Convert complex values to string to avoid [object Object] issues
        value = row[1]
        if isinstance(value, (dict, list)):
            value = str(value)
        formatted_results.append({"id": row[0], "value": value})
    
    return formatted_results

@app.get("/related-business-keys/{table}/{parent_table}/{parent_id}")
def get_related_business_keys(
    table: str, 
    parent_table: str, 
    parent_id: int, 
    conn: sqlite3.Connection = Depends(get_db)
):
    """Get business keys related to a parent record (for 'many' relationships)"""
    if table not in schema_cfg["tables"]:
        raise HTTPException(404, f"Unknown table {table}")
    
    if parent_table not in schema_cfg["tables"]:
        raise HTTPException(404, f"Unknown parent table {parent_table}")
    
    # Check for relationship definition
    relationships = schema_cfg["tables"][table].get("relationships", {})
    parent_rel = None
    parent_key = None
    
    for rel_name, rel_data in relationships.items():
        if rel_data["parentTable"] == parent_table:
            parent_rel = rel_data
            parent_key = rel_data["parentKey"]
            break
    
    if not parent_rel or not parent_key:
        raise HTTPException(404, f"No relationship found from {table} to {parent_table}")
    
    # Get business key columns
    business_keys = schema_cfg["tables"][table]["businessKeys"]
    if not business_keys:
        return []
    
    # For simplicity, we'll just handle the first business key
    primary_key = business_keys[0]
    
    cursor = conn.cursor()
    
    # Query for related records
    cursor.execute(
        f'SELECT id, {primary_key} FROM {table} WHERE {parent_key} = ?',
        (parent_id,)
    )
    results = cursor.fetchall()
    
    # Ensure we return clean values
    formatted_results = []
    for row in results:
        # Convert complex values to string to avoid [object Object] issues
        value = row[1]
        if isinstance(value, (dict, list)):
            value = str(value)
        formatted_results.append({"id": row[0], "value": value})
    
    return formatted_results

@app.get("/related-data/{table}/{key_column}/{key_value}")
def get_related_data(
    table: str, 
    key_column: str, 
    key_value: str, 
    conn: sqlite3.Connection = Depends(get_db)
):
    """Get data for a record based on business key"""
    if table not in schema_cfg["tables"]:
        raise HTTPException(404, f"Unknown table {table}")
    
    cursor = conn.cursor()
    # Get schema columns for this table
    columns = schema_cfg["tables"][table]["columns"] + schema_cfg["tables"][table]["businessKeys"]
    
    # Build query to get data by business key
    query = f"SELECT id, {', '.join(columns)} FROM {table} WHERE {key_column} = ?"
    cursor.execute(query, (key_value,))
    result = cursor.fetchone()
    
    if not result:
        raise HTTPException(404, f"No record found with {key_column}={key_value}")
    
    # Convert to dict
    data = dict(result)
    return data

@app.post("/submit/{table}")
def submit(table: str, payload: RowIn, conn: sqlite3.Connection = Depends(get_db)):
    """Create or update a record"""
    if table not in schema_cfg["tables"]:
        raise HTTPException(404, f"Unknown table {table}")
    
    cursor = conn.cursor()
    row = payload.data.copy()
    
    # Check if we're updating by business key
    business_keys = schema_cfg["tables"][table]["businessKeys"]
    bk_exists = False
    
    if all(bk in row for bk in business_keys):
        # Check if this business key combination already exists
        where_clauses = [f"{bk} = ?" for bk in business_keys]
        query = f"SELECT id FROM {table} WHERE {' AND '.join(where_clauses)}"
        
        # Ensure we're passing primitive values, not complex objects
        param_values = []
        for bk in business_keys:
            value = row[bk]
            # Convert to string if it's not a primitive type
            if isinstance(value, (dict, list)):
                value = str(value)
            param_values.append(value)
            
        cursor.execute(query, param_values)
        existing = cursor.fetchone()
        
        if existing:
            # Update existing record
            pk = existing[0]
            bk_exists = True
            
            # Prepare update
            cols = [c for c in row.keys() if c != "id" and c not in business_keys]
            if cols:
                set_clause = ", ".join([f"{col} = ?" for col in cols])
                
                # Ensure we're passing primitive values, not complex objects
                param_values = []
                for col in cols:
                    value = row[col]
                    # Convert to string if it's not a primitive type
                    if isinstance(value, (dict, list)):
                        value = str(value)
                    param_values.append(value)
                
                query = f"UPDATE {table} SET {set_clause} WHERE id = ?"
                cursor.execute(query, param_values + [pk])
                conn.commit()
    
    if not bk_exists:
        # Insert new record
        cols = list(row.keys())
        placeholders = ", ".join(["?"] * len(cols))
        query = f"INSERT INTO {table} ({', '.join(cols)}) VALUES ({placeholders})"
        
        # Ensure we're passing primitive values, not complex objects
        param_values = []
        for col in cols:
            value = row[col]
            # Convert to string if it's not a primitive type
            if isinstance(value, (dict, list)):
                value = str(value)
            param_values.append(value)
            
        cursor.execute(query, param_values)
        pk = cursor.lastrowid
        conn.commit()
    
    return {"surrogatePK": pk}

#schema_config.json
{
  "sequence": ["customer", "orders", "order_item"],
  "tables": {
    "customer": {
      "businessKeys": ["customer_number"],
      "columns": ["first_name", "last_name", "email"],
      "relationships": {
        "orders": {
          "type": "many",
          "childTable": "orders",
          "childKey": "customer_id"
        }
      }
    },
    "orders": {
      "businessKeys": ["order_number"],
      "foreignKeys": { "customer_id": "customer" },
      "columns": ["order_date", "status"],
      "relationships": {
        "customer": {
          "type": "many",
          "parentKey": "customer_id",
          "parentTable": "customer"
        }
      }
    },
    "order_item": {
      "businessKeys": ["order_number", "line_number"],
      "foreignKeys": { "order_id": "orders" },
      "columns": ["product_code", "quantity", "unit_price"],
      "relationships": {
        "order": {
          "type": "many",
          "parentKey": "order_id",
          "parentTable": "orders"
        }
      }
    }
  }
}


# ui_config.json
{
  "screens": [
    {
      "id": "customer",
      "table": "customer",
      "title": "Customer",
      "sections": [
        {
          "title": "Customer Information",
          "isBusinessKeySection": true,
          "fields": [
            { "column": "customer_number", "widget": "text" }
          ]
        },
        {
          "title": "Details",
          "fields": [
            { "column": "first_name",  "widget": "text"  },
            { "column": "last_name",   "widget": "text"  },
            { "column": "email",       "widget": "email" }
          ]
        }
      ]
    },

    {
      "id": "orders",
      "table": "orders",
      "title": "Order",
      "sections": [
        {
          "title": "Order Identification",
          "isBusinessKeySection": true,
          "fields": [
            { "column": "order_number", "widget": "text" }
          ]
        },
        {
          "title": "Details",
          "fields": [
            { "column": "order_date", "widget": "date" },
            { "column": "status",     "widget": "select",
              "options": ["NEW","PROCESSING","DONE"] }
          ]
        },
        {
          "title": "Line items",
          "nested": {
            "repeat": true,
            "table": "order_item",
            "sections": [
              {
                "title": "Line",
                "fields": [
                  { "column": "line_number",   "widget": "number" },
                  { "column": "product_code", "widget": "text"   },
                  { "column": "quantity",     "widget": "number" },
                  { "column": "unit_price",   "widget": "number" }
                ]
              }
            ]
          }
        }
      ]
    }
  ]
}

