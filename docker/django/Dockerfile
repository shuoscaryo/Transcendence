# Usa la imagen oficial de Python
FROM python:3.9-slim

# Instala las dependencias necesarias para Django
RUN pip install --no-cache-dir django

# Establece el directorio de trabajo en el contenedor
WORKDIR /pong

# Initialize the Django project
RUN django-admin startproject pong /

# Copia solo los archivos de configuración de tu host (asumiendo que están en un directorio config/ en tu host)
COPY ./config/settings.py /app/project_name/settings.py
COPY ./config/urls.py /app/project_name/urls.py
COPY ./config/wsgi.py /app/project_name/wsgi.py


# Expone el puerto de Django (8000 por defecto)
EXPOSE 8000

# Comando para correr el servidor de Django
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]