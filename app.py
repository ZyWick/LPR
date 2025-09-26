from flask import Flask, render_template, jsonify, request
import mysql.connector.pooling
from datetime import datetime, timedelta
from config import DB_CONFIG, FLASK_CONFIG 

app = Flask(__name__)
app.config.update(FLASK_CONFIG)
pool = mysql.connector.pooling.MySQLConnectionPool(**DB_CONFIG)

# Column map for DataTables
COLUMNS_MAP = {
    "0": "entry_time",  # use DB field directly
    "1": "license_plate",
    "2": "gate_entry",
    "3": "entry_time",  # fallback
}

def get_conn():
    return pool.get_connection()


@app.route("/logs_all", methods=["GET"])
def get_logs():
    """Get last 20 logs (debugging)."""
    with get_conn() as conn, conn.cursor(dictionary=True) as cursor:
        cursor.execute("""
            SELECT 
                id, 
                license_plate, 
                gate_entry, 
                image_link, 
                entry_time
            FROM gate_logs
            ORDER BY entry_time DESC
            LIMIT 20
        """)
        rows = cursor.fetchall()
    return jsonify(rows)


@app.route("/add_log", methods=["POST"])
def add_log():
    """Insert new log."""
    data = request.get_json(force=True)
    try:
        with get_conn() as conn, conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO gate_logs (license_plate, gate_entry, image_link)
                VALUES (%s, %s, %s)
            """, (data["license_plate"], data["gate_entry"], data["image_link"]))
            conn.commit()
        return jsonify({"message": "Log added!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/logs", methods=["POST"])
def logs():
    """Paginated logs for DataTables."""
    draw = int(request.values.get("draw", 1))
    start = int(request.values.get("start", 0))
    length = int(request.values.get("length", 25))
    search_value = request.values.get("search[value]", "")
    date_filter = request.values.get("date", "")
    gate_filter = request.values.get("gate", "")
    order_column_index = request.values.get("order[0][column]", "0")
    order_dir = request.values.get("order[0][dir]", "desc")

    order_column = COLUMNS_MAP.get(order_column_index, "entry_time")
    if order_dir not in ("asc", "desc"):
        order_dir = "desc"

    base_query = "FROM gate_logs WHERE 1=1"
    params = []

    if search_value:
        base_query += " AND license_plate LIKE %s"
        params.append(f"%{search_value}%")

    if date_filter:
        try:
            date_obj = datetime.strptime(date_filter, "%Y-%m-%d")
            start_date = date_obj.replace(hour=0, minute=0, second=0)
            end_date = start_date + timedelta(days=1)
            base_query += " AND entry_time >= %s AND entry_time < %s"
            params.extend([start_date, end_date])
        except ValueError:
            pass

    if gate_filter:
        base_query += " AND gate_entry = %s"
        params.append(gate_filter)

    try:
        with get_conn() as conn, conn.cursor(dictionary=True) as cursor:
            # Data query
            cursor.execute(f"""
                SELECT 
                    id,
                    license_plate,
                    gate_entry,
                    image_link,
                    entry_time,
                    DATE_FORMAT(entry_time, '%Y-%m-%d %H:%i:%S') AS entry_display
                {base_query}
                ORDER BY {order_column} {order_dir}
                LIMIT %s OFFSET %s
            """, tuple(params + [length, start]))
            data = cursor.fetchall()

            # Counts
            cursor.execute("SELECT COUNT(*) AS cnt FROM gate_logs")
            total = cursor.fetchone()["cnt"]

            cursor.execute(f"SELECT COUNT(*) AS cnt {base_query}", tuple(params))
            filtered = cursor.fetchone()["cnt"]

        return jsonify({
            "draw": draw,
            "recordsTotal": total,
            "recordsFiltered": filtered,
            "data": data
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/update-log", methods=["POST"])
def update_log():
    """Update a single log inline."""
    data = request.form or request.get_json(force=True)
    log_id = data.get("id")
    field = data.get("field")
    value = data.get("value")

    if not log_id or field not in ("license_plate", "gate_entry"):
        return jsonify({"error": "Invalid input"}), 400

    try:
        with get_conn() as conn, conn.cursor() as cursor:
            cursor.execute(f"UPDATE gate_logs SET {field} = %s WHERE id = %s", (value, log_id))
            conn.commit()
        return jsonify({"message": "Log updated successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/")
def home():
    return render_template("index.html")


if __name__ == "__main__":
    # Disable debug in production!
    app.run(debug=True)
