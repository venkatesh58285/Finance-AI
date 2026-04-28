import numpy as np

def detect_anomalies(df):
    """
    Use Z-score method:
    - Compute mean and standard deviation for revenue and expenses
    - Flag values where |Z-score| > 2 as anomalies
    """
    if 'revenue' in df.columns:
        mean_rev = df['revenue'].mean()
        std_rev = df['revenue'].std()
        if std_rev > 0:
            df['revenue_zscore'] = (df['revenue'] - mean_rev) / std_rev
            df['revenue_anomaly'] = np.abs(df['revenue_zscore']) > 2
        else:
            df['revenue_anomaly'] = False
            
    if 'expenses' in df.columns:
        mean_exp = df['expenses'].mean()
        std_exp = df['expenses'].std()
        if std_exp > 0:
            df['expense_zscore'] = (df['expenses'] - mean_exp) / std_exp
            df['expense_anomaly'] = np.abs(df['expense_zscore']) > 2
        else:
            df['expense_anomaly'] = False
            
    return df
