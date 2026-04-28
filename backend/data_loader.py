import pandas as pd
import io

def load_data_from_json(json_data):
    """Load data from JSON API input."""
    df = pd.DataFrame(json_data)
    return preprocess_data(df)

def load_data_from_csv(csv_content):
    """Load data from a CSV file content."""
    df = pd.read_csv(io.StringIO(csv_content))
    return preprocess_data(df)

def preprocess_data(df):
    """
    Handle missing values, ensure correct types, 
    sort chronologically, and add engineered features.
    """
    # Fill missing values with 0
    df = df.fillna(0)
    
    # Ensure types
    for col in ['revenue', 'expenses']:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
            
    # Feature engineering
    if 'revenue' in df.columns and 'expenses' in df.columns:
        df['profit'] = df['revenue'] - df['expenses']
        
        # Revenue Growth (%)
        df['revenue_growth_pct'] = df['revenue'].pct_change().fillna(0) * 100
        
        # Expense Growth (%)
        df['expense_growth_pct'] = df['expenses'].pct_change().fillna(0) * 100
        
        # Round values
        df['revenue_growth_pct'] = df['revenue_growth_pct'].round(2)
        df['expense_growth_pct'] = df['expense_growth_pct'].round(2)
        df['profit'] = df['profit'].round(2)
        
    return df
