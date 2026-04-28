def apply_rules(df):
    """
    Apply rule-based analysis:
    - If revenue drops more than 15% -> flag "Revenue Decline"
    - If expenses increase more than 20% -> flag "Expense Spike"
    - If profit becomes negative -> flag "Loss Period"
    """
    flags = []
    
    for index, row in df.iterrows():
        period_flags = []
        if 'revenue_growth_pct' in df.columns and row['revenue_growth_pct'] < -15:
            period_flags.append("Revenue Decline")
        if 'expense_growth_pct' in df.columns and row['expense_growth_pct'] > 20:
            period_flags.append("Expense Spike")
        if 'profit' in df.columns and row['profit'] < 0:
            period_flags.append("Loss Period")
            
        flags.append(", ".join(period_flags) if period_flags else "Normal")
        
    df['rule_flags'] = flags
    return df

def generate_structured_insights(df):
    """
    Combine rule-based and statistical outputs into structured insights.
    """
    revenue_decline_periods = df[df['rule_flags'].str.contains("Revenue Decline", na=False)]['month'].tolist() if 'month' in df.columns else []
    expense_spike_periods = df[df['rule_flags'].str.contains("Expense Spike", na=False)]['month'].tolist() if 'month' in df.columns else []
    loss_periods = df[df['rule_flags'].str.contains("Loss Period", na=False)]['month'].tolist() if 'month' in df.columns else []
    
    anomaly_periods = []
    if 'revenue_anomaly' in df.columns:
        anomaly_periods.extend(df[df['revenue_anomaly'] == True]['month'].tolist() if 'month' in df.columns else [])
    if 'expense_anomaly' in df.columns:
         anomaly_periods.extend(df[df['expense_anomaly'] == True]['month'].tolist() if 'month' in df.columns else [])
         
    anomaly_periods = list(set(anomaly_periods))
    
    total_revenue = df['revenue'].sum() if 'revenue' in df.columns else 0
    total_profit = df['profit'].sum() if 'profit' in df.columns else 0
    avg_profit_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0
    
    return {
        "trends": f"Revenue declined notably in: {revenue_decline_periods}. "
                  f"Expenses spiked in: {expense_spike_periods}. ",
        "anomalies": f"Statistical anomalies detected in periods: {anomaly_periods}.",
        "profit_analysis": f"Total profit across the period is {total_profit}. "
                           f"Losses occurred in: {loss_periods}. "
                           f"Average Profit Margin: {avg_profit_margin:.2f}%."
    }
