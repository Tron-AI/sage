from django.db import connection

def get_sql_field_type(field):
    """
    Map ProductField field types to SQL data types.
    """
    sql_field_map = {
        'varchar': 'VARCHAR',
        'int': 'INTEGER',
        'float': 'FLOAT',
        'boolean': 'BOOLEAN',
        'date': 'DATE',
        'datetime': 'DATETIME',
        'text': 'TEXT',
        'decimal': 'DECIMAL',
    }
    return sql_field_map.get(field.field_type, 'TEXT')

def apply_validation_rules(fields, table_name):
    """Apply validation rules to the dynamic table."""
    for field in fields:
        if hasattr(field, 'validation_rule') and field.validation_rule:
            validation = field.validation_rule
            
            with connection.cursor() as cursor:
                # Escape field names and constraint names with spaces
                field_name = f'"{field.name}"' if ' ' in field.name or any(c in field.name for c in [';', '"', "'"]) else field.name
                
                # Unique Constraint
                if validation.is_unique:
                    cursor.execute(
                        f'ALTER TABLE {table_name} ADD CONSTRAINT "unique_{field.name}" UNIQUE ({field_name});'
                    )
                
                # Picklist Validation (Enum)
                if validation.is_picklist and validation.picklist_values:
                    picklist_values = validation.picklist_values.split(',')
                    picklist_sql = ", ".join([f"'{value.strip()}'" for value in picklist_values])
                    cursor.execute(
                        f'ALTER TABLE {table_name} ADD CONSTRAINT "check_{field.name}_picklist" '
                        f'CHECK ({field_name} IN ({picklist_sql}));'
                    )
                
                # Min/Max Value Constraints
                if validation.has_min_max:
                    if validation.min_value is not None:
                        cursor.execute(
                            f'ALTER TABLE {table_name} ADD CONSTRAINT "check_{field.name}_min" '
                            f'CHECK ({field_name} >= {validation.min_value});'
                        )
                    if validation.max_value is not None:
                        cursor.execute(
                            f'ALTER TABLE {table_name} ADD CONSTRAINT "check_{field.name}_max" '
                            f'CHECK ({field_name} <= {validation.max_value});'
                        )

                # Decimal Places Constraint
                if validation.has_max_decimal and field.field_type == 'decimal':
                    cursor.execute(
                        f'ALTER TABLE {table_name} ADD CONSTRAINT "check_{field.name}_decimals" '
                        f'CHECK (ROUND({field_name}, {validation.max_decimal_places}) = {field_name});'
                    )

                # Custom Validation Rules (if provided)
                if validation.custom_validation:
                    # Execute custom SQL validation (requires careful handling)
                    cursor.execute(validation.custom_validation)
