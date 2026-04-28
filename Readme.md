# Finance AI

Finance AI is a Python-based application for financial data analysis, anomaly detection, and LLM-powered insights. It features a simple web frontend for user interaction.

## Features

- Load and analyze financial data from CSV files
- Detect anomalies in financial time series
- Leverage LLMs for financial insights and explanations
- Web-based frontend for easy interaction

## Project Structure

```
analysis.py            # Financial data analysis logic
anomaly.py             # Anomaly detection algorithms
app.py                 # Backend server (likely Flask or FastAPI)
data_loader.py         # Data loading utilities
llm_service.py         # LLM integration and service logic
main.py                # Entry point or orchestrator
requirements.txt       # Python dependencies
sample_data.csv        # Example financial data
sample_data_volatile.csv # Example volatile data
frontend/
  app.js               # Frontend JavaScript
  index.html           # Main HTML page
  style.css            # Stylesheet
```

## Getting Started

### Prerequisites

- Python 3.8+
- (Recommended) Create a virtual environment

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Navigate to backend folder:
  ```bash
   cd backend
   ```
4. Run the backend server:
   ```bash
   python main.py
   ```
5. Open `../frontend/index.html` in your browser

## Usage

- Upload or use the provided sample CSV files
- Analyze data and detect anomalies
- Get LLM-powered explanations

## License

MIT License

## Authors

- Venkatesh Rachamadugu

---

Feel free to contribute or open issues for improvements!
