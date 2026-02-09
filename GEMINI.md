# Reglas Globales de Trabajo

1. **Gestión de Versiones (Commit & Push Automatizado):**
   - Siempre que completes una funcionalidad, tarea o cambio importante, debes proponer al usuario realizar un **commit** y **push** de los cambios.
   - Dado que el usuario no es técnico, **tú (el agente) debes encargarte de ejecutar estos comandos**. Nunca le pidas al usuario que escriba o que investigue cómo hacerlo.
   - Tu mensaje debe ser profesional: explica que vas a asegurar los cambios en el repositorio y solicita su confirmación para proceder con el envío (push).
   - Una vez que el usuario acepte, genera el mensaje de commit adecuado y ejecuta `git commit` y `git push` de forma proactiva.

2. **Usuario No Técnico - Ejecución Autónoma:**
   - El usuario **NO es técnico**. No sabe ejecutar SQL, comandos de terminal complejos, ni operaciones de base de datos.
   - **Nunca le pidas al usuario que ejecute scripts SQL, migraciones de base de datos, o comandos técnicos**. Tú debes encargarte de ejecutarlos.
   - Si una operación requiere acceso a paneles externos (como Supabase Dashboard), crea scripts automatizados o usa APIs para hacerlo de forma programática.
   - Cuando necesites feedback del usuario, hazlo en términos simples y no técnicos (ej: "¿Quieres que guarde los datos en la nube?" en vez de "¿Ejecuto la migración SQL?").
