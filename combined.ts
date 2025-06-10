def writeback_domain(domain_name: str, data: Dict[str, List[Dict]], db: Session):
    """
    Writeback endpoint for saving all domain data at once
    Simplified approach using business keys without tempId
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
    
    def get_date_columns(table_config):
        """Get list of date/datetime columns from table config"""
        date_columns = []
        for col in table_config.get("columns", []):
            if col["type"] == "date" or col["type"] == "datetime":
                date_columns.append(col["name"])
        return date_columns
    
    def get_foreign_key_columns(table_config):
        """Get list of foreign key columns (columns ending with _id)"""
        fk_columns = []
        for col in table_config.get("columns", []):
            if col["name"].endswith("_id"):
                fk_columns.append(col["name"])
        return fk_columns
    
    def resolve_foreign_keys(record_dict, table_config):
        """Resolve foreign key references using parent mappings"""
        relationships = table_config.get("relationships")
        if not relationships:
            return record_dict
        
        # Handle both old format (single relationship) and new format (multiple relationships)
        if isinstance(relationships, dict):
            # Old format - convert to new format
            if relationships.get("type") == "association" and "parents" in relationships:
                # Already in new association format
                parent_configs = relationships["parents"]
            else:
                # Convert old format to new format
                parent_configs = [{
                    "parentTable": relationships["parentTable"],
                    "parentKeys": relationships["parentKeys"],
                    "childKeys": relationships["childKeys"]
                }]
        elif isinstance(relationships, list):
            # New format - already a list
            parent_configs = relationships
        else:
            return record_dict
        
        # Process each parent relationship
        for parent_config in parent_configs:
            parent_table = parent_config["parentTable"]
            parent_table_config = table_configs.get(parent_table)
            
            if not parent_table_config:
                continue
                
            parent_pk_column = parent_table_config.get("primaryKeyColumn", "id")
            parent_model = TABLE_MODEL_MAP.get(parent_table)
            
            if not parent_model:
                continue
            
            # Handle both single key and multiple keys
            parent_keys = parent_config.get("parentKeys", [parent_config.get("parentKey")])
            child_keys = parent_config.get("childKeys", [parent_config.get("childKey")])
            
            # Ensure they're lists
            if not isinstance(parent_keys, list):
                parent_keys = [parent_keys]
            if not isinstance(child_keys, list):
                child_keys = [child_keys]
            
            # Build filter conditions for parent lookup
            parent_filters = []
            all_keys_present = True
            
            for i, child_key in enumerate(child_keys):
                if i < len(parent_keys):
                    parent_key = parent_keys[i]
                    if child_key in record_dict and record_dict[child_key] is not None:
                        parent_filters.append(
                            getattr(parent_model, parent_key) == record_dict[child_key]
                        )
                    else:
                        all_keys_present = False
                        break
            
            if parent_filters and all_keys_present:
                parent_record = db.query(parent_model).filter(and_(*parent_filters)).first()
                if parent_record:
                    # Set the foreign key ID field
                    # Try to infer FK field name
                    if len(child_keys) == 1 and child_keys[0].endswith('_id'):
                        # FK field already specified in child keys
                        fk_field_name = child_keys[0]
                    else:
                        # Infer FK field name from parent table (e.g., manufacturing_steps -> parent_step_id)
                        # Check if a specific FK field exists
                        if parent_table.endswith('s'):
                            fk_field_name = f"{parent_table[:-1]}_id"
                        else:
                            fk_field_name = f"{parent_table}_id"
                    
                    # Only set if the field exists in the model
                    if hasattr(TABLE_MODEL_MAP[table_config["tableName"]], fk_field_name):
                        record_dict[fk_field_name] = getattr(parent_record, parent_pk_column)
        
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
            pk_column = table_config.get("primaryKeyColumn", "id")
            business_keys = table_config.get("businessKeys", [])
            
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
            
            pk_column = table_config.get("primaryKeyColumn", "id")
            business_keys = table_config.get("businessKeys", [])
            date_columns = get_date_columns(table_config)
            is_association_table = table_config.get("isAssociationTable", False)
            
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
                    record_dict = resolve_foreign_keys(record_dict, table_config)
                    
                    # Handle date conversions based on config
                    for col_name in date_columns:
                        if col_name in record_dict:
                            value = record_dict[col_name]
                            if value and isinstance(value, str):
                                try:
                                    record_dict[col_name] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                                except:
                                    try:
                                        # Try without timezone
                                        record_dict[col_name] = datetime.fromisoformat(value.replace('Z', ''))
                                    except:
                                        pass
                    
                    # Also handle created_at and updated_at if they exist (system fields)
                    for sys_field in ['created_at', 'updated_at']:
                        if sys_field in record_dict:
                            value = record_dict[sys_field]
                            if value and isinstance(value, str):
                                try:
                                    record_dict[sys_field] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                                except:
                                    try:
                                        record_dict[sys_field] = datetime.fromisoformat(value.replace('Z', ''))
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
                        if is_association_table:
                            # For association tables, use foreign key columns as composite unique key
                            fk_columns = get_foreign_key_columns(table_config)
                            if fk_columns:
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
                        # For association tables, typically we don't update, but we can if there are additional fields
                        update_allowed = True
                        
                        if is_association_table:
                            # Check if only FK columns are being "updated" (no real change)
                            fk_columns = get_foreign_key_columns(table_config)
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
