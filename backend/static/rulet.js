// backend/static/rulet.js
class RuletaGame {
    constructor() {
        this.API_BASE = '/api';
        this.userId = this.generarUserId();
        this.puntos = 100;
        this.items = [];
        this.isSpinning = false;
        
        this.init();
    }

    generarUserId() {
        let userId = localStorage.getItem('ruleta_user_id');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('ruleta_user_id', userId);
        }
        return userId;
    }

    async init() {
        await this.cargarItemsRuleta();
        this.configurarEventos();
        this.actualizarUI();
    }

    async cargarItemsRuleta() {
        try {
            const response = await fetch(`${this.API_BASE}/ruleta/items`);
            const data = await response.json();
            this.items = data.items || [];
            this.crearSegmentosRuleta();
        } catch (error) {
            console.error('Error cargando items:', error);
            // Fallback a items por defecto
            this.items = this.getDefaultItems();
            this.crearSegmentosRuleta();
        }
    }

    getDefaultItems() {
        return [
            { id: 1, text: "Premio Mayor", type: "prize", puntos: 100, color: "#FFD700" },
            { id: 2, text: "Viaje a la Playa", type: "prize", puntos: 80, color: "#4CAF50" },
            { id: 3, text: "Tarjeta Regalo $50", type: "prize", puntos: 60, color: "#2196F3" },
            { id: 4, text: "Pierdes Turno", type: "penalty", puntos: -10, color: "#F44336" },
            { id: 5, text: "Giro Extra", type: "bonus", puntos: 0, color: "#9C27B0" },
        ];
    }

    crearSegmentosRuleta() {
        const fortuneWheel = document.getElementById('fortune-wheel');
        fortuneWheel.innerHTML = '';

        if (this.items.length === 0) {
            console.warn('No hay items para mostrar en la ruleta');
            return;
        }

        const numSegments = this.items.length;
        const segmentAngle = 360 / numSegments;

        const getPointInCircle = (angle, radiusPercent, centerX, centerY) => {
            const x = centerX + radiusPercent * Math.cos((angle - 90) * Math.PI / 180);
            const y = centerY + radiusPercent * Math.sin((angle - 90) * Math.PI / 180);
            return `${x}% ${y}%`;
        };

        this.items.forEach((item, index) => {
            const segment = document.createElement('div');
            segment.classList.add('segment');
            segment.style.background = item.color || this.getColorByType(item.type);

            const startAngle = index * segmentAngle;
            const endAngle = startAngle + segmentAngle;

            const centerX = 50;
            const centerY = 50;
            const radius = 50;

            let clipPathPoints = [`${centerX}% ${centerY}%`];
            const numArcPoints = Math.max(2, Math.ceil(segmentAngle / 10));
            
            for (let i = 0; i <= numArcPoints; i++) {
                const currentAngle = startAngle + (segmentAngle / numArcPoints) * i;
                clipPathPoints.push(getPointInCircle(currentAngle, radius, centerX, centerY));
            }
            
            segment.style.clipPath = `polygon(${clipPathPoints.join(',')})`;

            // Añadir texto
            const segmentText = document.createElement('div');
            segmentText.classList.add('segment-text');
            segmentText.textContent = item.text;

            const textCenterAngle = startAngle + (segmentAngle / 2);
            const textRadiusOffset = 35;
            
            const textX = centerX + textRadiusOffset * Math.cos((textCenterAngle - 90) * Math.PI / 180);
            const textY = centerY + textRadiusOffset * Math.sin((textCenterAngle - 90) * Math.PI / 180);
            const textRotationAdjusted = textCenterAngle + 90;

            segmentText.style.left = `${textX}%`;
            segmentText.style.top = `${textY}%`;
            segmentText.style.transform = `translate(-50%, -50%) rotate(${textRotationAdjusted}deg)`;

            segment.appendChild(segmentText);
            fortuneWheel.appendChild(segment);
        });
    }

    getColorByType(type) {
        const colors = {
            'prize': '#4CAF50',
            'penalty': '#F44336',
            'bonus': '#2196F3',
            'wildcard': '#FFC107'
        };
        return colors[type] || '#666666';
    }

    configurarEventos() {
        const spinButton = document.getElementById('spin-button');
        spinButton.addEventListener('click', () => this.girarRuleta());

        // Soporte touch
        const wheel = document.getElementById('wheel-container');
        wheel.addEventListener('touchstart', (e) => {
            if (!this.isSpinning) {
                this.girarRuleta();
            }
            e.preventDefault();
        });
    }

    async girarRuleta() {
        if (this.isSpinning) return;
        
        this.isSpinning = true;
        this.updateSpinButton(true);

        try {
            const response = await fetch(`${this.API_BASE}/ruleta/girar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: this.userId
                })
            });

            const data = await response.json();
            
            if (data.error) {
                this.showError(data.error);
                return;
            }

            // Encontrar índice del producto ganado
            const winningIndex = this.items.findIndex(item => 
                item.text === data.resultado.text
            );

            await this.animateWheel(winningIndex);
            this.showResult(data);
            
        } catch (error) {
            console.error('Error al girar ruleta:', error);
            this.showError('Error de conexión. Intenta nuevamente.');
        } finally {
            this.isSpinning = false;
            this.updateSpinButton(false);
        }
    }

    async animateWheel(winningIndex) {
        return new Promise((resolve) => {
            const fortuneWheel = document.getElementById('fortune-wheel');
            const segmentAngle = 360 / this.items.length;
            
            const fullRotations = 5;
            const randomOffset = Math.random() * (segmentAngle - 10) + 5;
            const targetAngle = winningIndex * segmentAngle + randomOffset;
            const totalRotation = fullRotations * 360 + (360 - targetAngle);

            fortuneWheel.style.transition = 'transform 4s cubic-bezier(0.1, 0.8, 0.2, 1)';
            fortuneWheel.style.transform = `rotate(${totalRotation}deg)`;

            fortuneWheel.addEventListener('transitionend', () => {
                resolve();
            }, { once: true });
        });
    }

    showResult(data) {
        this.puntos = data.puntos_actuales;
        localStorage.setItem('user_points', this.puntos.toString());

        const resultDisplay = document.getElementById('result');
        const resultado = data.resultado;

        const resultColors = {
            'prize': '#27ae60',
            'penalty': '#e74c3c', 
            'bonus': '#3498db',
            'wildcard': '#f39c12'
        };

        resultDisplay.innerHTML = `
            <div style="text-align: center;">
                <h3 style="margin: 0 0 10px 0;">🎉 ¡Felicidades! 🎉</h3>
                <p style="font-size: 1.4em; margin: 0 0 10px 0; font-weight: bold;">
                    ${resultado.text}
                </p>
                <p style="margin: 5px 0; font-size: 1.1em;">
                    Puntos: <strong>${resultado.puntos >= 0 ? '+' : ''}${resultado.puntos}</strong>
                </p>
                <p style="margin: 0; font-size: 1em;">
                    Total: <strong>${this.puntos} puntos</strong>
                </p>
            </div>
        `;

        resultDisplay.className = 'result-display ' + resultado.type;
        this.actualizarUI();
    }

    showError(mensaje) {
        const resultDisplay = document.getElementById('result');
        resultDisplay.innerHTML = `
            <div style="text-align: center; color: #e74c3c;">
                <h3 style="margin: 0 0 10px 0;">⚠️ Error</h3>
                <p style="margin: 0;">${mensaje}</p>
            </div>
        `;
        resultDisplay.className = 'result-display penalty';
    }

    updateSpinButton(spinning) {
        const spinButton = document.getElementById('spin-button');
        spinButton.disabled = spinning;
        spinButton.textContent = spinning ? 'GIRANDO...' : `GIRAR RULETA (${this.puntos} pts)`;
    }

    actualizarUI() {
        document.getElementById('user-points').textContent = this.puntos;
        this.updateSpinButton(this.isSpinning);
    }
}

// Inicializar la ruleta cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    window.ruletaGame = new RuletaGame();
});