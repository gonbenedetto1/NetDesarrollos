// ═══════════════════════════════════════════════════════
//  VIEWS/HELP.JS — Guia de uso del sistema
// ═══════════════════════════════════════════════════════

const HelpView = {
  render() {
    Topbar.render({ title: 'Guia de uso' });

    document.getElementById('view-content').innerHTML = `
      <div class="view-header">
        <div class="view-header-left">
          <h1>Guia de uso — Sistema NET</h1>
          <p>Como usar el sistema de gestion interna del equipo</p>
        </div>
      </div>

      <!-- Flujo de trabajo -->
      <div class="card" style="margin-bottom:16px">
        <h3 style="margin-bottom:12px;display:flex;align-items:center;gap:8px">
          <span style="width:28px;height:28px;border-radius:50%;background:var(--accent-bg);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0">1</span>
          Flujo de una tarea
        </h3>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:16px">
          ${[
            ['Pendiente','var(--s-pending)','La tarea fue creada pero aun no se empezo a trabajar.'],
            ['En progreso','var(--s-progress)','Alguien del equipo esta trabajando activamente en esto.'],
            ['En revision','var(--s-review)','El trabajo esta listo y necesita que otro lo revise/apruebe.'],
            ['Bloqueado','var(--s-blocked)','No se puede avanzar por un impedimento externo o tecnico.'],
            ['Finalizada','var(--s-done)','La tarea esta completa y aprobada.'],
          ].map(([label, color, desc], i, arr) => `
            <div style="display:flex;align-items:center;gap:8px">
              <div style="padding:8px 14px;background:${color}15;border:1px solid ${color}40;border-radius:var(--r-md);text-align:center;min-width:100px">
                <div style="width:8px;height:8px;border-radius:50%;background:${color};margin:0 auto 4px"></div>
                <div style="font-size:12px;font-weight:600;color:var(--text-1)">${label}</div>
              </div>
              ${i < arr.length - 1 ? '<span style="color:var(--text-4);font-size:16px">→</span>' : ''}
            </div>`).join('')}
        </div>
        <div style="background:var(--bg-input);border-radius:var(--r-md);padding:14px">
          <div style="font-size:13px;font-weight:600;color:var(--text-1);margin-bottom:8px">Reglas del flujo:</div>
          <ul style="font-size:13px;color:var(--text-2);line-height:1.7;padding-left:20px;margin:0">
            <li>Cuando empezas a trabajar en una tarea, cambiala a <strong>En progreso</strong></li>
            <li>Cuando terminas, ponela en <strong>En revision</strong> para que otro la mire</li>
            <li>Solo el lead o quien revisa puede marcarla como <strong>Finalizada</strong></li>
            <li>Si no podes avanzar, marcala como <strong>Bloqueada</strong> y explica por que</li>
          </ul>
        </div>
      </div>

      <!-- Cuando bloquear -->
      <div class="card" style="margin-bottom:16px;border-left:4px solid var(--red)">
        <h3 style="margin-bottom:12px;display:flex;align-items:center;gap:8px">
          <span style="width:28px;height:28px;border-radius:50%;background:var(--red-bg);color:var(--red-text);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0">!</span>
          Cuando marcar una tarea como BLOQUEADA
        </h3>
        <p style="font-size:13px;color:var(--text-2);line-height:1.6;margin-bottom:12px">
          Bloquear una tarea es serio — significa que <strong>no podes seguir avanzando</strong> sin ayuda externa. Usa este estado cuando:
        </p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
          <div style="background:var(--red-bg);border-radius:var(--r-md);padding:14px">
            <div style="font-size:12px;font-weight:600;color:var(--red-text);margin-bottom:6px">SI bloquear cuando:</div>
            <ul style="font-size:12.5px;color:var(--red-text);line-height:1.6;padding-left:16px;margin:0">
              <li>Necesitas credenciales, accesos o permisos que no tenes</li>
              <li>Hay un bug tecnico que no podes resolver solo</li>
              <li>Dependes de un dato o decision de alguien externo</li>
              <li>Una dependencia (otra tarea) debe completarse primero</li>
              <li>El ambiente de staging/produccion esta caido</li>
            </ul>
          </div>
          <div style="background:var(--green-bg);border-radius:var(--r-md);padding:14px">
            <div style="font-size:12px;font-weight:600;color:var(--green-text);margin-bottom:6px">NO bloquear cuando:</div>
            <ul style="font-size:12.5px;color:var(--green-text);line-height:1.6;padding-left:16px;margin:0">
              <li>Simplemente no sabes como hacer algo (pregunta primero)</li>
              <li>Te falta tiempo — eso no es un bloqueo</li>
              <li>El problema tiene una solucion alternativa viable</li>
              <li>Estas esperando un code review (usa "En revision")</li>
            </ul>
          </div>
        </div>
        <div style="background:var(--bg-input);border-radius:var(--r-md);padding:12px">
          <div style="font-size:12px;font-weight:600;color:var(--text-1);margin-bottom:4px">Al bloquear, siempre incluir:</div>
          <div style="font-size:12.5px;color:var(--text-2);line-height:1.5">
            1. <strong>Que paso</strong> — describe el problema concreto<br>
            2. <strong>Que intentaste</strong> — lo que ya probaste<br>
            3. <strong>Que necesitas</strong> — que hace falta para desbloquearlo
          </div>
        </div>
      </div>

      <!-- Progreso -->
      <div class="card" style="margin-bottom:16px">
        <h3 style="margin-bottom:12px;display:flex;align-items:center;gap:8px">
          <span style="width:28px;height:28px;border-radius:50%;background:var(--accent-bg);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0">2</span>
          Como usar el progreso
        </h3>
        <p style="font-size:13px;color:var(--text-2);line-height:1.6;margin-bottom:12px">
          El porcentaje de progreso se actualiza desde el panel lateral de cada tarea usando el slider. Guia rapida:
        </p>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
          ${[
            ['0-25%','Investigando, planificando o empezando','var(--orange)'],
            ['25-50%','Desarrollo activo, primeras implementaciones','var(--orange)'],
            ['50-75%','Funcionalidad principal lista, ajustes pendientes','var(--accent)'],
            ['75-100%','Testing final, puliendo detalles, listo para review','var(--green)'],
          ].map(([pct, desc, color]) => `
            <div style="background:var(--bg-input);border-radius:var(--r-md);padding:12px;text-align:center">
              <div style="font-size:18px;font-weight:700;color:${color};margin-bottom:4px">${pct}</div>
              <div style="font-size:11.5px;color:var(--text-3);line-height:1.4">${desc}</div>
            </div>`).join('')}
        </div>
      </div>

      <!-- Funcionalidades clave -->
      <div class="card" style="margin-bottom:16px">
        <h3 style="margin-bottom:12px;display:flex;align-items:center;gap:8px">
          <span style="width:28px;height:28px;border-radius:50%;background:var(--accent-bg);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0">3</span>
          Funcionalidades del sistema
        </h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          ${[
            ['Dashboard','Vista general con KPIs, bloqueos activos, tareas del equipo y carga de trabajo.'],
            ['Sistemas','Cada producto/proyecto tiene su espacio con vista Kanban o lista. Podes editar miembros del equipo.'],
            ['Mis tareas','Todas tus tareas asignadas, filtradas por estado. Usa la busqueda para encontrar rapido.'],
            ['Gantt','Timeline visual de todas las tareas. Filtra por sistema para una vista mas enfocada.'],
            ['Bloqueos','Panel dedicado a tareas bloqueadas. Prioridad: resolver estos primero.'],
            ['Adjuntos','Al crear o editar una tarea, podes adjuntar imagenes, PDFs y documentos (max 2MB, hasta 5 archivos).'],
            ['Comentarios','Cada tarea tiene hilo de comentarios. Usa @Nombre para mencionar a alguien y le llega notificacion.'],
            ['Notificaciones','La campana muestra notificaciones de tareas asignadas y menciones.'],
          ].map(([title, desc]) => `
            <div style="padding:12px;background:var(--bg-input);border-radius:var(--r-md)">
              <div style="font-size:13px;font-weight:600;color:var(--text-1);margin-bottom:4px">${title}</div>
              <div style="font-size:12px;color:var(--text-3);line-height:1.45">${desc}</div>
            </div>`).join('')}
        </div>
      </div>

      <!-- Rutina diaria -->
      <div class="card" style="margin-bottom:16px">
        <h3 style="margin-bottom:12px;display:flex;align-items:center;gap:8px">
          <span style="width:28px;height:28px;border-radius:50%;background:var(--green-bg);color:var(--green-text);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0">4</span>
          Rutina diaria recomendada
        </h3>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${[
            ['Al empezar el dia','Revisa el Dashboard. Mira tus tareas activas y si hay bloqueos que necesiten atencion.'],
            ['Antes de trabajar','Ve a "Mis tareas" y cambia el estado de lo que vas a hacer a "En progreso".'],
            ['Durante el dia','Actualiza el progreso cuando avances significativamente (no hace falta cada hora).'],
            ['Al terminar algo','Pone la tarea en "En revision" y deja un comentario con lo que hiciste.'],
            ['Si te trabas','Marca como "Bloqueado" inmediatamente con una buena descripcion. No esperes.'],
            ['Al final del dia','Revisa que tus tareas reflejen el estado real. Actualiza progreso si cambio.'],
          ].map(([when, what], i) => `
            <div style="display:flex;gap:12px;align-items:flex-start">
              <div style="width:6px;height:6px;border-radius:50%;background:var(--green);margin-top:6px;flex-shrink:0"></div>
              <div>
                <span style="font-size:13px;font-weight:600;color:var(--text-1)">${when}:</span>
                <span style="font-size:13px;color:var(--text-2)"> ${what}</span>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <!-- Leads / CRM -->
      <div class="card" style="margin-bottom:16px;border-left:4px solid var(--accent)">
        <h3 style="margin-bottom:12px;display:flex;align-items:center;gap:8px">
          <span style="width:28px;height:28px;border-radius:50%;background:var(--accent-bg);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0">5</span>
          Como usar el panel de Leads (CRM)
        </h3>
        <p style="font-size:13px;color:var(--text-2);line-height:1.6;margin-bottom:14px">
          Cada posible cliente es un <strong>lead</strong>. Se carga una sola vez y todo el equipo ve el estado actual — sin tener que preguntar.
        </p>

        <div style="font-size:13px;font-weight:600;color:var(--text-1);margin-bottom:8px">Las 7 etapas del pipeline:</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px">
          ${[
            ['Nuevo','10%','#AEAEB2','Recien identificado'],
            ['Contactado','25%','#0071E3','Ya hablamos'],
            ['Demo agendada','45%','#5AC8FA','Demo programada'],
            ['Propuesta enviada','65%','#BF5AF2','Cotizacion enviada'],
            ['Negociacion','80%','#FF9F0A','Revisando terminos'],
            ['Ganado','100%','#28C76F','Firmo ✓'],
            ['Perdido','0%','#FF3B30','No se concreto'],
          ].map(([name, prob, color, desc]) => `
            <div style="padding:8px 10px;background:${color}15;border:1px solid ${color}40;border-radius:var(--r-md)">
              <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">
                <div style="width:7px;height:7px;border-radius:50%;background:${color}"></div>
                <span style="font-size:12px;font-weight:600;color:var(--text-1)">${name}</span>
                <span style="font-size:10.5px;color:var(--text-3);margin-left:auto">${prob}</span>
              </div>
              <div style="font-size:10.5px;color:var(--text-3)">${desc}</div>
            </div>`).join('')}
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
          <div style="background:var(--bg-input);border-radius:var(--r-md);padding:12px">
            <div style="font-size:12px;font-weight:600;color:var(--text-1);margin-bottom:6px">Cuando registrar una interaccion:</div>
            <ul style="font-size:12px;color:var(--text-2);line-height:1.5;padding-left:16px;margin:0">
              <li>Despues de una llamada</li>
              <li>Despues de una reunion o demo</li>
              <li>Cuando mandas un email importante</li>
              <li>Cuando recibis info relevante del lead</li>
            </ul>
          </div>
          <div style="background:var(--bg-input);border-radius:var(--r-md);padding:12px">
            <div style="font-size:12px;font-weight:600;color:var(--text-1);margin-bottom:6px">Cuando mover de etapa:</div>
            <ul style="font-size:12px;color:var(--text-2);line-height:1.5;padding-left:16px;margin:0">
              <li>Contactado: tras la primera comunicacion</li>
              <li>Demo: al agendar la demo</li>
              <li>Propuesta: al enviar cotizacion</li>
              <li>Negociacion: cuando empiezan a pedir ajustes</li>
              <li>Ganado/Perdido: al cierre del deal</li>
            </ul>
          </div>
        </div>

        <div style="background:var(--accent-bg);border-radius:var(--r-md);padding:12px">
          <div style="font-size:12px;font-weight:600;color:var(--accent-text);margin-bottom:4px">💡 Buenas practicas:</div>
          <div style="font-size:12px;color:var(--accent-text);line-height:1.5">
            • <strong>Siempre cargar "proxima accion"</strong> con fecha — si esta vencida, aparece en rojo<br>
            • <strong>Usar tags</strong> para segmentar (ej: "hot", "enterprise", "agencia-chica")<br>
            • <strong>Valor y probabilidad</strong> ayudan a proyectar el pipeline — cargalos siempre<br>
            • <strong>Al perder</strong>, carga la razon — eso nos ayuda a mejorar como equipo
          </div>
        </div>
      </div>

      <!-- Atajos -->
      <div class="card">
        <h3 style="margin-bottom:12px;display:flex;align-items:center;gap:8px">
          <span style="width:28px;height:28px;border-radius:50%;background:var(--purple-bg);color:var(--purple-text);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0">⌨</span>
          Atajos rapidos
        </h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${[
            ['N','Crear nueva tarea (cuando no hay input activo)'],
            ['Esc','Cerrar panel lateral o modal'],
            ['Click en tarea','Abrir detalle en panel lateral'],
          ].map(([key, desc]) => `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--bg-input);border-radius:var(--r-md)">
              <kbd style="background:var(--bg-card);border:1px solid var(--border-2);border-radius:4px;padding:2px 8px;font-size:12px;font-weight:600;color:var(--text-1);font-family:var(--font-mono)">${key}</kbd>
              <span style="font-size:12.5px;color:var(--text-2)">${desc}</span>
            </div>`).join('')}
        </div>
      </div>
    `;
  },
};
