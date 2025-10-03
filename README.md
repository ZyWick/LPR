# 🚗 Flask LPR System

A lightweight Flask web application for a **License Plate Recognition (LPR)** system.  

---

## 📂 Project Structure
```

.
├── app.py          # Main Flask application
├── config.py       # Database + Flask config (can use env vars)
├── templates/
│   └── index.html  # interface
└── README.md       # You are here 🚀

```

---

## ⚙️ Installation

### 1. Clone the repo
```bash
git clone https://github.com/ZyWick/LPR.git
cd LPR
````

### 32. Install dependencies

```bash
pip install flask mysql-connector-python
```

### 3. Configure database

Edit **`config.py`** or set environment variables:

* **Database**: Update `host`, `user`, `password`, and `database` according to your MySQL setup.
* **Pool size**: Adjust `"pool_size"` based on expected concurrent connections.
* **Debug mode**: Change `"DEBUG": False` before deploying to production.

### 4. Run the app

```bash
python app.py
```

The app will run at **[http://127.0.0.1:5000/](http://127.0.0.1:5000/)**.

---

## 🔌 API Endpoints

### `GET /logs_all`

Fetch latest 20 logs (debugging).

### `POST /add_log`

Add a new gate log.
**Request JSON:**

```json
{
  "license_plate": "ABC123",
  "gate_entry": "North Gate",
  "image_link": "http://example.com/car.jpg"
}
```

### `POST /logs`

Paginated logs for DataTables.
Supports search, date filter, gate filter, and sorting.

### `POST /update-log`

Update a log entry.
**Request JSON:**

```json
{
  "id": 1,
  "field": "license_plate",
  "value": "XYZ789"
}
```
