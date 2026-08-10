FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Variables de entorno para la demostración (datos pre-registrados en la imagen)
ENV DATABASE_URL=sqlite:///./cafeteria.db
ENV JWT_SECRET=super_secret_key_12345_cafeteria
ENV APP_ENV=development
ENV ADMIN_EMAIL=admin@cafeteria.com
ENV ADMIN_PASSWORD=cafe2026

# Inicializar la base de datos y cargar datos de demostración al construir la imagen
RUN python init_db.py

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
