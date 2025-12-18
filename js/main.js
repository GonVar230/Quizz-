// modal para iniciar
const btnComenzar = document.querySelector("#comenzar");
const apertura = document.querySelector(".apertura");
const cuestionario = document.querySelector(".contenedor__principal");
const puntaje  = document.querySelector(".contenedor__derecha");

btnComenzar.addEventListener("click", () =>{
    apertura.style.display = "none";
    cuestionario.style.display = "block";
    puntaje.style.display = "block";
});

let opcionSeleccionada = null;
let contadorPreguntas = 1;
let bloqueado = false; //  NUEVO

// historial real de preguntas
let historial = [];
let indexActual = 0;

async function configurando() {
    const resp = await fetch("./json/preguntas.json");
    const preguntas = await resp.json();

    const primera = preguntas[Math.floor(Math.random() * preguntas.length)];
    historial.push(primera);
    mostrarPregunta(primera);

    const next = document.querySelector("#next");
    const previous = document.querySelector("#previous");

    // NEXT
    next.addEventListener("click", () => {

        if (indexActual < historial.length - 1) {
            indexActual++;
            contadorPreguntas++;
            mostrarPregunta(historial[indexActual]);
            restaurarEstilos(contadorPreguntas);
            document.querySelector("#span-contador").textContent = `${contadorPreguntas} -`;
            return;
        }

        if (contadorPreguntas >= 15) return;

        const random = preguntas[Math.floor(Math.random() * preguntas.length)];
        historial.push(random);

        indexActual++;
        contadorPreguntas++;

        mostrarPregunta(random);
        limpiarEstilos();

        document.querySelector("#span-contador").textContent = `${contadorPreguntas} -`;
    });

    // PREVIOUS
    previous.addEventListener("click", () => {
        if (indexActual === 0) return;

        indexActual--;
        contadorPreguntas--;

        mostrarPregunta(historial[indexActual]);
        restaurarEstilos(contadorPreguntas);

        document.querySelector("#span-contador").textContent = `${contadorPreguntas} -`;
    });
}

// opciones
const items = document.querySelectorAll(".opciones");

items.forEach(item => {
    item.addEventListener("click", () => {
        if (bloqueado) return; //  BLOQUEO

        items.forEach(i => i.classList.remove("activo"));
        item.classList.add("activo");
        opcionSeleccionada = item; 
    });
});

const btnConfirmar = document.querySelector("#confirmar");

btnConfirmar.addEventListener("click", () => {
    if (!opcionSeleccionada) return;

    bloqueado = true; //  BLOQUEA AL CONFIRMAR

    const textoUsuario = opcionSeleccionada.querySelector("p").textContent.trim();
    const correcta = window.preguntaActual.respuesta.trim();

    const span = opcionSeleccionada.querySelector("span");
    const parrafo = opcionSeleccionada.querySelector("p");

    let estado = "";

    if (textoUsuario === correcta) {
        estado = "correcta";
        opcionSeleccionada.style.border = "2px solid green";
        opcionSeleccionada.style.backgroundColor = "white";
        span.style.backgroundColor = "green";
        span.style.color = "white";
        parrafo.style.color = "green";
        parrafo.style.backgroundColor = "white";
    } else {
        estado = "incorrecta";
        opcionSeleccionada.style.border = "2px solid red";
        opcionSeleccionada.style.backgroundColor = "white";
        span.style.backgroundColor = "red";
        span.style.color = "white";
        parrafo.style.color = "red";
        parrafo.style.backgroundColor = "white";
    }

    localStorage.setItem(
        "pregunta_" + contadorPreguntas,
        JSON.stringify({ opcion: textoUsuario, estado })
    );

    const referenciaActual = document.getElementById(`referencia-${contadorPreguntas}`);

    if (referenciaActual) {
        referenciaActual.classList.remove("tic", "cruz");

        if (estado === "correcta") {
            referenciaActual.classList.add("tic");
            referenciaActual.style.backgroundColor = "green";
            referenciaActual.style.color = "white";
        } else {
            referenciaActual.classList.add("cruz");
            referenciaActual.style.backgroundColor = "red";
            referenciaActual.style.color = "white";
        }
    }
});

function mostrarPregunta(obj) { 
    window.preguntaActual = obj;

    document.querySelector("#pregunta").textContent = obj.pregunta;
    
    document.querySelector("#respuestaA").textContent = obj.opciones[0];
    document.querySelector("#respuestaB").textContent = obj.opciones[1];
    document.querySelector("#respuestaC").textContent = obj.opciones[2];
    document.querySelector("#respuestaD").textContent = obj.opciones[3];

    opcionSeleccionada = null;
    bloqueado = false; //  DESBLOQUEA AL CAMBIAR DE PREGUNTA

    items.forEach(i => i.classList.remove("activo"));
    limpiarEstilos();
}

// limpiar estilos
function limpiarEstilos() {
    items.forEach(item => {
        item.style.border = "";
        item.style.backgroundColor = "";

        const span = item.querySelector("span");
        const p = item.querySelector("p");

        if (span) {
            span.style.backgroundColor = "";
            span.style.color = "";
        }
        if (p) {
            p.style.color = "";
            p.style.backgroundColor = "";
        }
    });
}

// restaurar estilos
function restaurarEstilos(num) {
    const data = localStorage.getItem("pregunta_" + num);
    if (!data) return;

    const { opcion, estado } = JSON.parse(data);

    items.forEach(item => {
        const txt = item.querySelector("p").textContent.trim();

        if (txt === opcion) {
            const span = item.querySelector("span");
            const p = item.querySelector("p");

            if (estado === "correcta") {
                item.style.border = "2px solid green";
                item.style.backgroundColor = "white";
                span.style.backgroundColor = "green";
                span.style.color = "white";
                p.style.color = "green";
                p.style.backgroundColor = "white";
            } else {
                item.style.border = "2px solid red";
                item.style.backgroundColor = "white";
                span.style.backgroundColor = "red";
                span.style.color = "white";
                p.style.color = "red";
                p.style.backgroundColor = "white";
            }
        }
    });
}

configurando();
