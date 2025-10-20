# En la raíz del proyecto, crear un script de inicio
# startup.sh (Linux/Mac) o startup.bat (Windows)

# startup.sh
#!/bin/bash
echo "Iniciando Ruleta Completa..."

# Activar entorno virtual backend
cd backend
source venv/bin/activate

# Iniciar Flask en segundo plano
python app.py &
FLASK_PID=$!

# Navegar al frontend y iniciar React
cd ../frontend
npm start &
REACT_PID=$!

echo "✅ Backend Flask ejecutándose en http://localhost:5000"
echo "✅ Frontend React ejecutándose en http://localhost:3000"
echo "✅ Ruleta principal en http://localhost:5000"
echo "✅ Panel Admin en http://localhost:3000"

# Esperar a que el usuario presione Ctrl+C
echo "Presiona Ctrl+C para detener todos los servicios"
wait 
