# Usar una imagen base oficial de Python
FROM python:3.10-slim

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar el archivo de requerimientos al contenedor
COPY requirements.txt /app/

# Instalar las dependencias de Python (incluyendo Django)
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código fuente de Django al contenedor
COPY . /app/

# Exponer el puerto que usará Django (normalmente 8000)
EXPOSE 8000

# Ejecutar el servidor de Django
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]