// ── DOM refs ──────────────────────────────────────────────
const btnComenzar    = document.querySelector("#comenzar");
const apertura       = document.querySelector(".apertura");
const cuestionario   = document.querySelector(".contenedor__principal");
const puntaje        = document.querySelector(".contenedor__derecha");
const headerScore    = document.querySelector("#header-live-score");

let opcionSeleccionada = null;
let contadorPreguntas  = 1;
let bloqueado          = false;

// historial real de preguntas
let historial   = [];
let indexActual = 0;

// registro de respuestas en memoria (sin localStorage)
const respuestas = {}; // { 1: { opcion, estado }, ... }

// ── INICIO ────────────────────────────────────────────────
btnComenzar.addEventListener("click", () => {
    apertura.style.display    = "none";
    cuestionario.style.display = "block";
    puntaje.style.display      = "block";
    headerScore.classList.add("visible");
    configurando();
});

// ── CARGA JSON + LÓGICA PRINCIPAL ─────────────────────────
async function configurando() {
    const resp     = await fetch("./json/preguntas.json");
    const preguntas = await resp.json();

    const primera = elegirAleatoria(preguntas);
    historial.push(primera);
    mostrarPregunta(primera);
    actualizarUI();

    const next     = document.querySelector("#next");
    const previous = document.querySelector("#previous");

    // NEXT
    next.addEventListener("click", () => {
        if (indexActual < historial.length - 1) {
            indexActual++;
            contadorPreguntas++;
            mostrarPregunta(historial[indexActual]);
            restaurarEstilos(contadorPreguntas);
            bloqueado = !!respuestas[contadorPreguntas];
            actualizarUI();
            return;
        }

        if (contadorPreguntas >= 15) return;

        const random = elegirAleatoria(preguntas);
        historial.push(random);
        indexActual++;
        contadorPreguntas++;

        mostrarPregunta(random);
        limpiarEstilos();
        bloqueado = false;
        actualizarUI();
    });

    // PREVIOUS
    previous.addEventListener("click", () => {
        if (indexActual === 0) return;
        indexActual--;
        contadorPreguntas--;
        mostrarPregunta(historial[indexActual]);
        restaurarEstilos(contadorPreguntas);
        bloqueado = !!respuestas[contadorPreguntas];
        actualizarUI();
    });
}

// ── ELEGIR ALEATORIA SIN REPETIR ──────────────────────────
function elegirAleatoria(preguntas) {
    const usadas      = new Set(historial.map(p => p.pregunta));
    const disponibles = preguntas.filter(p => !usadas.has(p.pregunta));
    const pool        = disponibles.length > 0 ? disponibles : preguntas;
    return pool[Math.floor(Math.random() * pool.length)];
}

// ── SELECCIÓN DE OPCIÓN ───────────────────────────────────
const items = document.querySelectorAll(".opciones");

items.forEach(item => {
    item.addEventListener("click", () => {
        if (bloqueado) return;
        items.forEach(i => i.classList.remove("activo"));
        item.classList.add("activo");
        opcionSeleccionada = item;
    });
});

// ── CONFIRMAR ─────────────────────────────────────────────
const btnConfirmar = document.querySelector("#confirmar");

btnConfirmar.addEventListener("click", () => {
    if (!opcionSeleccionada) return;

    bloqueado = true;

    const textoUsuario = opcionSeleccionada.querySelector("p").textContent.trim();
    const correcta     = window.preguntaActual.respuesta.trim();
    const esCorrecta   = textoUsuario === correcta;
    const estado       = esCorrecta ? "correcta" : "incorrecta";

    // Guardar en memoria
    respuestas[contadorPreguntas] = { opcion: textoUsuario, estado };

    // Estilos en la opción elegida
    opcionSeleccionada.classList.remove("activo");
    opcionSeleccionada.classList.add(esCorrecta ? "correcta" : "incorrecta");

    // Si falló, mostrar la correcta en verde
    if (!esCorrecta) {
        items.forEach(item => {
            if (item.querySelector("p").textContent.trim() === correcta) {
                item.classList.add("correcta");
            }
        });
    }

    // Bloquear el resto
    items.forEach(item => {
        if (!item.classList.contains("correcta") && !item.classList.contains("incorrecta")) {
            item.classList.add("bloqueada");
        }
    });

    // Feedback banner
    mostrarFeedback(esCorrecta);

    // Panel lateral
    const ref = document.getElementById(`referencia-${contadorPreguntas}`);
    if (ref) {
        ref.classList.remove("tic", "cruz", "activa");
        ref.classList.add(estado === "correcta" ? "tic" : "cruz");
    }

    actualizarUI();
    verificarCompletado();
});

// ── FEEDBACK BANNER ───────────────────────────────────────
function mostrarFeedback(correcto) {
    const banner = document.getElementById("feedback-banner");
    const icon   = document.getElementById("feedback-icon");
    const text   = document.getElementById("feedback-text");

    banner.className = "feedback-banner show " + (correcto ? "correcto" : "incorrecto");
    icon.className   = "bi " + (correcto ? "bi-check-circle-fill" : "bi-x-circle-fill");
    text.textContent = correcto
        ? "¡Correcto! Muy bien."
        : "Incorrecto. La respuesta correcta está marcada en verde.";
}

// ── MOSTRAR PREGUNTA ──────────────────────────────────────
function mostrarPregunta(obj) {
    window.preguntaActual = obj;

    document.querySelector("#pregunta").textContent    = obj.pregunta;
    document.querySelector("#respuestaA").textContent  = obj.opciones[0];
    document.querySelector("#respuestaB").textContent  = obj.opciones[1];
    document.querySelector("#respuestaC").textContent  = obj.opciones[2];
    document.querySelector("#respuestaD").textContent  = obj.opciones[3];

    opcionSeleccionada = null;
    items.forEach(i => i.classList.remove("activo"));
    limpiarEstilos();

    // Ocultar feedback
    document.getElementById("feedback-banner").className = "feedback-banner";
}

// ── LIMPIAR ESTILOS ───────────────────────────────────────
function limpiarEstilos() {
    items.forEach(item => {
        item.className = "opciones";
    });
}

// ── RESTAURAR ESTILOS AL NAVEGAR ─────────────────────────
function restaurarEstilos(num) {
    const data = respuestas[num];
    if (!data) { limpiarEstilos(); return; }

    const { opcion, estado } = data;
    const correcta = window.preguntaActual.respuesta.trim();

    items.forEach(item => {
        const txt = item.querySelector("p").textContent.trim();
        if (txt === opcion) {
            item.classList.add(estado === "correcta" ? "correcta" : "incorrecta");
        }
        if (txt === correcta) {
            item.classList.add("correcta");
        }
        if (!item.classList.contains("correcta") && !item.classList.contains("incorrecta")) {
            item.classList.add("bloqueada");
        }
    });

    mostrarFeedback(estado === "correcta");
}

// ── ACTUALIZAR UI (barra, contador, celdas, stats) ────────
function actualizarUI() {
    const respondidas = Object.keys(respuestas).length;
    const correctas   = Object.values(respuestas).filter(r => r.estado === "correcta").length;
    const incorrectas = respondidas - correctas;
    const pct         = Math.round((respondidas / 15) * 100);

    // Barra de progreso
    document.getElementById("barra-progreso-fill").style.width = pct + "%";
    document.getElementById("prog-label").textContent = `Pregunta ${contadorPreguntas} de 15`;
    document.getElementById("prog-pct").textContent   = pct + "%";

    // Contador
    document.querySelector("#span-contador").textContent = `${contadorPreguntas}.`;

    // Stats panel
    document.getElementById("stat-done").textContent    = respondidas;
    document.getElementById("stat-correct").textContent = correctas;
    document.getElementById("stat-wrong").textContent   = incorrectas;

    // Header live score
    document.getElementById("live-c").textContent = correctas;
    document.getElementById("live-i").textContent = incorrectas;

    // Celdas del panel: marcar activa
    for (let i = 1; i <= 15; i++) {
        const celda = document.getElementById(`referencia-${i}`);
        if (!celda) continue;
        if (i === contadorPreguntas && !respuestas[i]) {
            celda.classList.add("activa");
        } else if (!respuestas[i]) {
            celda.classList.remove("activa");
        }
    }

    // Botones prev/next
    document.querySelector("#previous").disabled = indexActual === 0;
    document.querySelector("#next").disabled     = contadorPreguntas >= 15;
}

// ── VERIFICAR SI SE COMPLETARON LAS 15 ───────────────────
function verificarCompletado() {
    if (Object.keys(respuestas).length >= 15) {
        document.getElementById("btn-ver-resultado").classList.add("show");
        document.querySelector("#next").disabled = true;
    }
}

// ── BOTÓN VER RESULTADO ───────────────────────────────────
document.getElementById("btn-ver-resultado").addEventListener("click", abrirResumen);

// ── MODAL RESUMEN FINAL ───────────────────────────────────
function abrirResumen() {
    const correctas   = Object.values(respuestas).filter(r => r.estado === "correcta").length;
    const incorrectas = Object.values(respuestas).filter(r => r.estado === "incorrecta").length;
    const sinResp     = 15 - Object.keys(respuestas).length;
    const pct         = Math.round((correctas / 15) * 100);

    // Trofeo y nivel según puntaje
    let trofeo, titulo, subtitulo, nivel, nivelClass;

    if (pct >= 90) {
        trofeo = "🏆"; titulo = "¡Excelente resultado!";
        subtitulo = "Dominás JavaScript muy bien.";
        nivel = "⭐ Nivel Avanzado — ¡Seguí así!";
        nivelClass = "excelente";
    } else if (pct >= 70) {
        trofeo = "🥈"; titulo = "¡Buen trabajo!";
        subtitulo = "Sólido conocimiento de JavaScript.";
        nivel = "📚 Nivel Intermedio — Algunos temas para repasar.";
        nivelClass = "bien";
    } else if (pct >= 50) {
        trofeo = "📖"; titulo = "Vas por buen camino";
        subtitulo = "Hay margen para mejorar.";
        nivel = "🔧 Nivel Básico-Intermedio — Repasá los fundamentos.";
        nivelClass = "regular";
    } else {
        trofeo = "💪"; titulo = "¡Seguí practicando!";
        subtitulo = "Este quiz te ayuda a ver en qué enfocarte.";
        nivel = "📌 Nivel Principiante — Revisá los conceptos base de JS.";
        nivelClass = "inicio";
    }

    document.getElementById("modal-trophy").textContent    = trofeo;
    document.getElementById("modal-titulo").textContent    = titulo;
    document.getElementById("modal-subtitulo").textContent = subtitulo;
    document.getElementById("ring-score").textContent      = `${correctas}/15`;
    document.getElementById("ring-pct").textContent        = `${pct}%`;
    document.getElementById("mstat-c").textContent         = correctas;
    document.getElementById("mstat-i").textContent         = incorrectas;
    document.getElementById("mstat-n").textContent         = sinResp;

    const nivelEl = document.getElementById("modal-nivel");
    nivelEl.textContent = nivel;
    nivelEl.className   = `modal-nivel ${nivelClass}`;

    // Ring cónico
    document.getElementById("modal-ring").style.setProperty("--pct", pct + "%");

    // Detalle por pregunta
    const grid = document.getElementById("detalle-grid");
    grid.innerHTML = "";

    historial.forEach((preg, i) => {
        const num  = i + 1;
        const resp = respuestas[num];
        const cls   = !resp ? "skip" : (resp.estado === "correcta" ? "ok" : "mal");
        const badge = !resp ? "Sin responder" : (resp.estado === "correcta" ? "Correcta ✓" : "Incorrecta ✗");

        const item = document.createElement("div");
        item.className = `detalle-item ${cls}`;
        item.innerHTML = `
            <div class="detalle-num">${num}</div>
            <span class="detalle-texto">${preg.pregunta.length > 65 ? preg.pregunta.slice(0, 65) + "…" : preg.pregunta}</span>
            <span class="detalle-badge">${badge}</span>
        `;
        grid.appendChild(item);
    });

    document.getElementById("modal-overlay").classList.add("show");
    document.body.style.overflow = "hidden";
}

// Cerrar modal al click en overlay
document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target === document.getElementById("modal-overlay")) cerrarModal();
});

function cerrarModal() {
    document.getElementById("modal-overlay").classList.remove("show");
    document.body.style.overflow = "";
}

// Reiniciar
document.getElementById("btn-reiniciar").addEventListener("click", () => {
    location.reload();
});
