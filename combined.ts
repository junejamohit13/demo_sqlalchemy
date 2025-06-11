import os
import json
from datetime import datetime
from typing import Dict, List, Any, Tuple, Set, Optional
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Text, and_, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, class_mapper
from sqlalchemy.orm.properties import ColumnProperty
from sqlalchemy.sql.schema import ForeignKeyConstraint
import traceback
# Model introspection utilities
class ModelIntrospector:
    """Utilities for extracting metadata from SQLAlchemy models"""
    
    @staticmethod
    def get_business_keys(model_class) -> List[str]:
        """Get business keys defined in the model"""
        if hasattr(model_class, '__business_keys__'):
            return model_class.__business_keys__
        return []
    
    @staticmethod
    def get_primary_key_column(model_class) -> str:
        """Get the primary key column name for a model"""
        mapper = class_mapper(model_class)
        pk_columns = mapper.primary_key
        if pk_columns:
            return pk_columns[0].name
        return "id"  # Default fallback
    
    @staticmethod
    def get_foreign_key_info(model_class) -> List[Dict[str, Any]]:
        """Get foreign key information from a model"""
        foreign_keys = []
        mapper = class_mapper(model_class)
        
        for column in mapper.columns:
            if column.foreign_keys:
                for fk in column.foreign_keys:
                    foreign_keys.append({
                        "column": column.name,
                        "foreign_table": fk.column.table.name,
                        "foreign_column": fk.column.name
                    })
        
        return foreign_keys
    
    @staticmethod
    def get_date_columns(model_class) -> List[str]:
        """Get list of date/datetime columns from a model"""
        date_columns = []
        mapper = class_mapper(model_class)
        
        for column in mapper.columns:
            if column.type.__class__.__name__ in ['DateTime', 'Date', 'Time']:
                date_columns.append(column.name)
        
        return date_columns
    
    @staticmethod
    def get_required_columns(model_class) -> List[str]:
        """Get list of required (non-nullable) columns"""
        required_columns = []
        mapper = class_mapper(model_class)
        
        for column in mapper.columns:
            if not column.nullable and not column.primary_key and not column.default:
                required_columns.append(column.name)
        
        return required_columns
    
    @staticmethod
    def is_association_table(model_class) -> bool:
        """Detect if a model represents an association table"""
        # Check if explicitly marked
        if hasattr(model_class, '__is_association_table__'):
            return model_class.__is_association_table__
        
        # Auto-detect: tables with 2+ FKs and few other columns
        fk_info = ModelIntrospector.get_foreign_key_info(model_class)
        if len(fk_info) >= 2:
            mapper = class_mapper(model_class)
            total_columns = len(list(mapper.columns))
            fk_columns = len(fk_info)
            system_columns = ['id', 'created_at', 'updated_at']
            
            # Count non-FK, non-system columns
            non_fk_columns = 0
            for col in mapper.columns:
                col_name = col.name
                is_fk = any(fk['column'] == col_name for fk in fk_info)
                is_system = col_name in system_columns
                if not is_fk and not is_system:
                    non_fk_columns += 1
            
            # If mostly FKs with few additional columns, it's likely an association table
            return non_fk_columns <= 3
        
        return False
    
    @staticmethod
    def get_association_table_relationships(model_class) -> Optional[Dict[str, Any]]:
        """Get relationship info for association tables"""
        fk_info = ModelIntrospector.get_foreign_key_info(model_class)
        
        if len(fk_info) >= 2:  # Association tables typically have 2+ foreign keys
            parents = []
            for fk in fk_info:
                parents.append({
                    "parentTable": fk["foreign_table"],
                    "parentKey": fk["foreign_column"],
                    "childKey": fk["column"]
                })
            
            return {
                "type": "association",
                "parents": parents
            }
        
        return None

# Refactored writeback_domain function
def writeback_domain(domain_name: str, data: Dict[str, List[Dict]], db: Session):
    """
    Writeback endpoint for saving all domain data at once
    Using SQLAlchemy model introspection for metadata
    """
    
    # Get domain config
    domain_config = None
    for domain in BACKEND_CONFIG["domains"]:
        if domain["domainName"] == domain_name:
            domain_config = domain
            break
    
    if not domain_config:
        raise Exception(f"Domain {domain_name} not found")
    
    insertion_order = domain_config.get("insertionOrder", [])
    print(f"Processing writeback for domain: {domain_name}, insertion order: {insertion_order}")
    
    # Build table config lookup
    table_configs = {table["tableName"]: table for table in domain_config["tables"]}
    
    # Create model introspector
    introspector = ModelIntrospector()
    
    # Track business key to PK mappings for foreign key resolution
    # Format: {table_name: {tuple(business_key_values): pk_value}}
    bk_to_pk_mappings = {}
    
    # Results tracking
    results = {
        "created": {},
        "updated": {},
        "conflicts": {},
        "errors": {}
    }
    
    def get_business_key_tuple(record, business_keys):
        """Get tuple of business key values for a record"""
        return tuple(record.get(bk) for bk in business_keys)
    
    def resolve_foreign_keys(record_dict, model_class, table_config):
        """Resolve foreign key references using parent mappings"""
        # Get foreign key info from model
        fk_info = introspector.get_foreign_key_info(model_class)
        
        if not fk_info:
            return record_dict
        
        # For association tables, use the introspected relationships
        if introspector.is_association_table(model_class):
            relationships = introspector.get_association_table_relationships(model_class)
            if relationships:
                for parent_config in relationships["parents"]:
                    parent_table = parent_config["parentTable"]
                    parent_model = TABLE_MODEL_MAP.get(parent_table)
                    
                    if not parent_model:
                        continue
                    
                    # Get business keys for parent table
                    parent_business_keys = introspector.get_business_keys(parent_model)
                    
                    if parent_business_keys:
                        # Build business key tuple from record
                        bk_values = []
                        all_keys_present = True
                        
                        for bk in parent_business_keys:
                            if bk in record_dict:
                                bk_values.append(record_dict[bk])
                            else:
                                all_keys_present = False
                                break
                        
                        if all_keys_present:
                            bk_tuple = tuple(bk_values)
                            
                            # Look up the PK from our mappings
                            if parent_table in bk_to_pk_mappings and bk_tuple in bk_to_pk_mappings[parent_table]:
                                pk_value = bk_to_pk_mappings[parent_table][bk_tuple]
                                record_dict[parent_config["childKey"]] = pk_value
                            else:
                                # Try to find in database
                                parent_pk_column = introspector.get_primary_key_column(parent_model)
                                filters = []
                                for i, bk in enumerate(parent_business_keys):
                                    filters.append(getattr(parent_model, bk) == bk_values[i])
                                
                                parent_record = db.query(parent_model).filter(and_(*filters)).first()
                                if parent_record:
                                    pk_value = getattr(parent_record, parent_pk_column)
                                    record_dict[parent_config["childKey"]] = pk_value
                                    # Cache it
                                    if parent_table not in bk_to_pk_mappings:
                                        bk_to_pk_mappings[parent_table] = {}
                                    bk_to_pk_mappings[parent_table][bk_tuple] = pk_value
        
        return record_dict
    
    try:
        # First pass: Build BK to PK mappings for all existing records
        for table_name in insertion_order:
            if table_name not in table_configs:
                continue
                
            model_class = TABLE_MODEL_MAP.get(table_name)
            if not model_class:
                continue
                
            table_config = table_configs[table_name]
            pk_column = introspector.get_primary_key_column(model_class)
            business_keys = introspector.get_business_keys(model_class)
            
            if business_keys:
                bk_to_pk_mappings[table_name] = {}
                
                # Get all existing records
                existing_records = db.query(model_class).all()
                for record in existing_records:
                    bk_tuple = tuple(getattr(record, bk) for bk in business_keys)
                    pk_value = getattr(record, pk_column)
                    bk_to_pk_mappings[table_name][bk_tuple] = pk_value
        
        # Process tables in insertion order
        for table_name in insertion_order:
            if table_name not in data:
                continue
                
            model_class = TABLE_MODEL_MAP.get(table_name)
            if not model_class:
                results["errors"][table_name] = f"Table {table_name} not found in model map"
                continue
            
            table_config = table_configs.get(table_name)
            if not table_config:
                results["errors"][table_name] = f"Table config for {table_name} not found"
                continue
            
            # Get metadata from model
            pk_column = introspector.get_primary_key_column(model_class)
            business_keys = introspector.get_business_keys(model_class)
            date_columns = introspector.get_date_columns(model_class)
            fk_columns = [fk["column"] for fk in introspector.get_foreign_key_info(model_class)]
            is_association_table = introspector.is_association_table(model_class)
            
            # Initialize tracking for this table
            results["created"][table_name] = []
            results["updated"][table_name] = []
            results["conflicts"][table_name] = []
            
            # Process each record
            records = data[table_name]
            for record_data in records:
                try:
                    record_dict = record_data.copy() if isinstance(record_data, dict) else record_data
                    
                    # Extract metadata
                    pk_ref = record_dict.pop('_pk', None)
                    
                    # Resolve foreign key references
                    record_dict = resolve_foreign_keys(record_dict, model_class, table_config)
                    
                    # Handle date conversions based on introspected columns
                    for col_name in date_columns:
                        if col_name in record_dict:
                            value = record_dict[col_name]
                            if value and isinstance(value, str):
                                try:
                                    record_dict[col_name] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                                except:
                                    try:
                                        record_dict[col_name] = datetime.fromisoformat(value.replace('Z', ''))
                                    except:
                                        pass
                    
                    # Determine if this is an insert or update
                    is_new_record = True
                    existing_record = None
                    
                    # If we have a pk_ref, try to find by PK first
                    if pk_ref:
                        pk_value = pk_ref["primaryKeyValue"]
                        existing_record = db.query(model_class).filter(
                            getattr(model_class, pk_column) == pk_value
                        ).first()
                        if existing_record:
                            is_new_record = False
                    
                    # If no pk_ref or not found by PK, check for existing record
                    if not existing_record:
                        if is_association_table and fk_columns:
                            # For association tables, use foreign key columns as composite unique key
                            fk_filters = []
                            for fk_col in fk_columns:
                                if fk_col in record_dict and record_dict[fk_col] is not None:
                                    fk_filters.append(getattr(model_class, fk_col) == record_dict[fk_col])
                            
                            if len(fk_filters) == len(fk_columns):  # All FKs present
                                existing_record = db.query(model_class).filter(and_(*fk_filters)).first()
                                if existing_record:
                                    is_new_record = False
                        
                        elif business_keys:
                            # Regular table with business keys
                            bk_filters = []
                            for bk in business_keys:
                                if bk in record_dict and record_dict[bk] is not None:
                                    bk_filters.append(getattr(model_class, bk) == record_dict[bk])
                            
                            if bk_filters:
                                existing_record = db.query(model_class).filter(and_(*bk_filters)).first()
                                if existing_record:
                                    is_new_record = False
                    
                    if not is_new_record and existing_record:
                        # Update existing record
                        update_allowed = True
                        
                        if is_association_table:
                            # Check if only FK columns are being "updated" (no real change)
                            non_fk_changes = any(
                                key not in fk_columns + ['created_at', 'updated_at', pk_column]
                                for key in record_dict.keys()
                            )
                            update_allowed = non_fk_changes
                        
                        if update_allowed:
                            # Update the record
                            for key, value in record_dict.items():
                                if hasattr(existing_record, key) and key != pk_column:
                                    setattr(existing_record, key, value)
                            
                            if hasattr(existing_record, 'updated_at'):
                                existing_record.updated_at = datetime.utcnow()
                        
                        # Track the update
                        pk_value = getattr(existing_record, pk_column)
                        if business_keys:
                            bk_tuple = get_business_key_tuple(record_dict, business_keys)
                            bk_to_pk_mappings[table_name][bk_tuple] = pk_value
                        
                        results["updated"][table_name].append({
                            "pk": pk_value,
                            "business_keys": {bk: getattr(existing_record, bk) for bk in business_keys} if business_keys else {},
                            "association": is_association_table
                        })
                    
                    else:
                        # Create new record
                        new_record = model_class(**record_dict)
                        db.add(new_record)
                        db.flush()  # Flush to get the PK without committing
                        
                        # Track the new PK
                        new_pk_value = getattr(new_record, pk_column)
                        
                        # Add BK to PK mapping
                        if business_keys:
                            bk_tuple = get_business_key_tuple(record_dict, business_keys)
                            bk_to_pk_mappings[table_name][bk_tuple] = new_pk_value
                        
                        results["created"][table_name].append({
                            "pk": new_pk_value,
                            "business_keys": {bk: getattr(new_record, bk) for bk in business_keys} if business_keys else {},
                            "association": is_association_table
                        })
                
                except Exception as e:
                    results["errors"].setdefault(table_name, []).append({
                        "record": record_dict if 'record_dict' in locals() else record_data,
                        "error": str(e),
                        "trace": traceback.format_exc()
                    })
        
        # If we got here, commit the transaction
        db.commit()
        
        return {
            "success": True,
            "message": "Writeback completed successfully",
            "results": results,
            "summary": {
                "total_created": sum(len(v) for v in results["created"].values()),
                "total_updated": sum(len(v) for v in results["updated"].values()),
                "total_conflicts": sum(len(v) for v in results["conflicts"].values()),
                "total_errors": sum(len(v) if isinstance(v, list) else 1 for v in results["errors"].values())
            }
        }
        
    except Exception as e:
        db.rollback()
        return {
            "success": False,
            "message": "Writeback failed",
            "error": str(e),
            "results": results,
            "trace": traceback.format_exc()
        }
