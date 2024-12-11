document.addEventListener('DOMContentLoaded', function() {
    // Inicialización de flatpickr
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 6);

    flatpickr("#dia", {
        locale: "es",
        dateFormat: "d/m/Y",
        minDate: "today",
        maxDate: nextWeek,
        disableMobile: true,
        inline: false,
        showMonths: 1,
        static: true,
        onChange: (selectedDates, dateStr) => console.log("Fecha seleccionada:", dateStr)
    });

    // Variables de elementos comunes
    const formularioReserva = document.getElementById('formularioReserva');
    const formularioUsuario = document.getElementById('formulario-secundario');
    const confirmacion = document.getElementById('confirmacion');
    const datosConfirmacion = document.getElementById('datos-confirmacion');
    const botonConfirmar = document.getElementById('confirmar');
    const botonInicio = document.getElementById('inicio');
    const botonVolver = document.getElementById('volver');
    const botonVolverNaranja = document.getElementById('botonVolverNaranja');
    const navbar = document.querySelector('.nav');

    // Validaciones de usuario
    const nombre = document.getElementById('nombre');
    const apellido = document.getElementById('apellido');
    const celular = document.getElementById('celular');

    function validarNombreApellido(input) {
        input.value = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').slice(0, 25);
    }
    function validarCelular(input) {
        input.value = input.value.replace(/\D/g, '').slice(0, 11);
    }
    nombre.addEventListener('input', () => validarNombreApellido(nombre));
    apellido.addEventListener('input', () => validarNombreApellido(apellido));
    celular.addEventListener('input', () => validarCelular(celular));

    // Validación de campos de formulario
    function validarFormularioReserva() {
        const numeroCancha = document.getElementById('numero-cancha').value;
        const dia = document.getElementById('dia').value;
        const horaInicio = document.getElementById('hora-inicio').value;
        const horaFin = document.getElementById('hora-fin').value;
        
        if (!numeroCancha || !dia || !horaInicio || !horaFin || horaInicio >= horaFin) {
            alert("Por favor, complete todos los campos correctamente.");
            return false;
        }
        return true;
    }

    // Desplazamiento y confirmación de reserva
    formularioReserva.addEventListener('submit', function(event) {
        if (validarFormularioReserva()) {
            event.preventDefault();
            formularioReserva.style.display = 'none';
            formularioUsuario.style.display = 'block';
        }
    });

    formularioUsuario.addEventListener('submit', function(event) {
        event.preventDefault();
        actualizarDatosConfirmacion();
        formularioUsuario.style.display = 'none';
        confirmacion.style.display = 'block';
    });

    async function validarDisponibilidad(fecha, horaInicio, horaFin, cancha) {
        try {
            const reservasRef = collection(db, "reservas");
            const q = window.query(reservasRef, 
                window.where("fecha", "==", fecha),
                window.where("cancha", "==", cancha)
            );
            
            const querySnapshot = await window.getDocs(q);
            
            for (const doc of querySnapshot.docs) {
                const reserva = doc.data();
                if (
                    (horaInicio >= reserva.horaInicio && horaInicio < reserva.horaFin) ||
                    (horaFin > reserva.horaInicio && horaFin <= reserva.horaFin) ||
                    (horaInicio <= reserva.horaInicio && horaFin >= reserva.horaFin)
                ) {
                    return false; // Horario no disponible
                }
            }
            return true; // Horario disponible
        } catch (error) {
            console.error("Error al verificar disponibilidad:", error);
            throw error;
        }
    }

    botonConfirmar.addEventListener('click', async function(event) {
        event.preventDefault();
        
        try {
            const fecha = document.getElementById('dia').value;
            const horaInicio = document.getElementById('hora-inicio').value;
            const horaFin = document.getElementById('hora-fin').value;
            const cancha = document.getElementById('numero-cancha').value;

            // Verificar disponibilidad antes de guardar
            const disponible = await validarDisponibilidad(fecha, horaInicio, horaFin, cancha);
            
            if (!disponible) {
                alert("Lo sentimos, este horario ya no está disponible. Por favor, selecciona otro horario.");
                return;
            }

            // Recopilar datos del formulario
            const reserva = {
                cancha: document.getElementById('numero-cancha').value,
                fecha: document.getElementById('dia').value,
                horaInicio: document.getElementById('hora-inicio').value,
                horaFin: document.getElementById('hora-fin').value,
                nombre: document.getElementById('nombre').value,
                apellido: document.getElementById('apellido').value,
                celular: document.getElementById('celular').value,
                estado: 'pendiente',
                fechaCreacion: new Date().toISOString()
            };

            // Guardar en Firebase
            const docRef = await addDoc(collection(db, "reservas"), reserva);
            console.log("Reserva guardada con ID:", docRef.id);
            
            // Redirigir a carga.html
            window.location.href = 'carga.html';
        } catch (error) {
            console.error("Error al procesar la reserva:", error);
            alert("Hubo un error al procesar tu reserva. Por favor, intenta nuevamente.");
        }
    });

    botonInicio.addEventListener('click', () => window.location.href = 'index.html');

    // Función para manejar el botón "Volver"
    function volverAtras() {
        if (confirmacion.style.display === 'block') {
            confirmacion.style.display = 'none';
            formularioUsuario.style.display = 'block';
        } else if (formularioUsuario.style.display === 'block') {
            formularioUsuario.style.display = 'none';
            formularioReserva.style.display = 'block';
        }
    }

    botonVolver.addEventListener('click', volverAtras);
    botonVolverNaranja.addEventListener('click', volverAtras);

    function actualizarDatosConfirmacion() {
        datosConfirmacion.innerHTML = `
            <h3>Detalles de la reserva</h3>
            <p><span style="color: black;">Cancha:</span> ${document.getElementById('numero-cancha').value}</p>
            <p><span style="color: black;">Día:</span> ${document.getElementById('dia').value}</p>
            <p><span style="color: black;">Hora de inicio:</span> ${document.getElementById('hora-inicio').value}</p>
            <p><span style="color: black;">Hora de fin:</span> ${document.getElementById('hora-fin').value}</p>
            <h3>Datos del usuario</h3>
            <p><span style="color: black;">Nombre:</span> ${nombre.value}</p>
            <p><span style="color: black;">Apellido:</span> ${apellido.value}</p>
            <p><span style="color: black;">Celular:</span> ${celular.value}</p>
        `;
    }

    // Evento de desplazamiento para cambiar el fondo de la navbar
    window.addEventListener('scroll', function() {
        if (window.scrollY > 0) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Desplazamiento suave al footer
    const contactanosLink = document.querySelector('a[href="#footer"]');
    contactanosLink.addEventListener('click', function(event) {
        event.preventDefault();
        const footer = document.querySelector('.footer');
        footer.scrollIntoView({ behavior: 'smooth' });
    });

    // Desplazamiento suave a la sección de torneos
    const torneosLink = document.querySelector('a[href="#imagenes-seccion"]');
    torneosLink.addEventListener('click', function(event) {
        event.preventDefault();
        const imagenesSeccion = document.querySelector('.imagenes-seccion');
        imagenesSeccion.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Desplazamiento suave a la sección de reserva
    const reservarLink = document.querySelector('.btn-reservar');
    reservarLink.addEventListener('click', function(event) {
        event.preventDefault();
        const seccionFormularios = document.getElementById('seccion-formularios');
        const offset = 100; // Ajusta este valor para detener el desplazamiento antes
        window.scrollTo({
            top: seccionFormularios.offsetTop - offset,
            behavior: 'smooth'
        });
    });

    // Función para verificar disponibilidad y actualizar horarios
    async function actualizarHorariosDisponibles() {
        const cancha = document.getElementById('numero-cancha').value;
        const fecha = document.getElementById('dia').value;
        
        if (!cancha || !fecha) return;

        const horariosBase = [
            "08:00", "09:30", "11:00", "12:30", "14:00", 
            "15:30", "17:00", "18:30", "20:00", "21:30", "23:00"
        ];

        try {
            // Eliminar mensaje anterior si existe
            const mensajeAnterior = document.getElementById('mensaje-no-disponible');
            if (mensajeAnterior) {
                mensajeAnterior.remove();
            }

            // Consultar reservas existentes
            const reservasQuery = query(
                collection(db, "reservas"),
                where("cancha", "==", cancha),
                where("fecha", "==", fecha)
            );
            const reservasSnapshot = await getDocs(reservasQuery);
            
            // Obtener horarios ocupados
            const horariosOcupados = new Set();
            reservasSnapshot.forEach(doc => {
                const reserva = doc.data();
                let horaActual = reserva.horaInicio;
                while (horaActual !== reserva.horaFin) {
                    horariosOcupados.add(horaActual);
                    const index = horariosBase.indexOf(horaActual);
                    horaActual = horariosBase[index + 1];
                }
            });

            // Actualizar select de hora inicio
            const selectInicio = document.getElementById('hora-inicio');
            selectInicio.innerHTML = '<option value="" disabled selected>Seleccione una hora</option>';
            
            let horariosDisponibles = 0;
            horariosBase.slice(0, -1).forEach(hora => {
                if (!horariosOcupados.has(hora)) {
                    horariosDisponibles++;
                    const option = document.createElement('option');
                    option.value = hora;
                    option.textContent = hora;
                    selectInicio.appendChild(option);
                }
            });

            // Mostrar mensaje si no hay horarios disponibles
            if (horariosDisponibles === 0) {
                const mensaje = document.createElement('p');
                mensaje.id = 'mensaje-no-disponible';
                mensaje.style.color = 'red';
                mensaje.style.marginTop = '10px';
                mensaje.style.fontWeight = 'bold';
                mensaje.style.fontSize = '18px';
                mensaje.textContent = 'TODOS LOS HORARIOS SE ENCUENTRAN RESERVADOS PARA ESTA FECHA';
                selectInicio.parentNode.appendChild(mensaje);
            }

            // Limpiar hora fin
            const selectFin = document.getElementById('hora-fin');
            selectFin.innerHTML = '<option value="" disabled selected>Seleccione una hora</option>';
            selectFin.disabled = true;
        } catch (error) {
            console.error("Error al obtener horarios disponibles:", error);
        }
    }

    // Función para actualizar horas de fin disponibles
    function actualizarHorasFin() {
        const horaInicio = document.getElementById('hora-inicio').value;
        const selectFin = document.getElementById('hora-fin');
        
        if (!horaInicio) {
            selectFin.disabled = true;
            return;
        }

        const horariosBase = [
            "08:00", "09:30", "11:00", "12:30", "14:00", 
            "15:30", "17:00", "18:30", "20:00", "21:30", "23:00"
        ];

        const indexInicio = horariosBase.indexOf(horaInicio);
        selectFin.innerHTML = '<option value="" disabled selected>Seleccione una hora</option>';
        
        // Mostrar solo los horarios posteriores a la hora de inicio
        for (let i = indexInicio + 1; i < horariosBase.length; i++) {
            const option = document.createElement('option');
            option.value = horariosBase[i];
            option.textContent = horariosBase[i];
            selectFin.appendChild(option);
        }
        
        selectFin.disabled = false;
    }

    // Event listeners
    document.getElementById('numero-cancha').addEventListener('change', actualizarHorariosDisponibles);
    document.getElementById('dia').addEventListener('change', actualizarHorariosDisponibles);
    document.getElementById('hora-inicio').addEventListener('change', actualizarHorasFin);
});
