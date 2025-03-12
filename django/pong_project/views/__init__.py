import importlib
import os
import glob

# Obtener la lista de archivos .py en la carpeta views (excepto __init__.py)
views_dir = os.path.dirname(__file__)
view_files = glob.glob(os.path.join(views_dir, "*.py"))

# Importar todas las vistas dinámicamente
for file_path in view_files:
    file_name = os.path.basename(file_path).split('.')[0]
    if file_name != "__init__":
        module = importlib.import_module(f".{file_name}", package="pong_project.views")
        # Añadir todos los atributos del módulo al namespace de views
        for attr_name in dir(module):
            if not attr_name.startswith("_"):
                globals()[attr_name] = getattr(module, attr_name)