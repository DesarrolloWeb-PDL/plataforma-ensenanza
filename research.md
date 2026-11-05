# Plataforma de Enseñanza de Programación — Research & Reverse Engineering

Fuente: investigación de plataformas e-learning de programación (kids block + teen HTML5+AI). Investigación realizada 2026-11-05.

## 1. Kids (6-12): plataformas block/Scratch

| Plataforma | Edad | Delivery | Modelo | Currículum |
|---|---|---|---|---|
| Scratch (MIT) | 8-16 (Jr 5-7) | Web + offline | Gratis, open source | Sin syllabus fijo; editor de bloques + comunidad; guía Creative Computing (Harvard); módulos CS First/Code Club |
| ScratchJr | 5-7 | Web/iOS/Android | Gratis | Juego auto-dirigido; bloques simplificados |
| Code.org | K-12 (CS Fundamentals K-5) | Web | Gratis (nonprofit) | Cursos A-F, unidades/lecciones; evaluaciones con rúbricas |
| Tynker | K-12 (bloques K-8, texto HS) | Web + apps | Freemium; escuelas cotizan | Cursos por grado; quizzes auto-calificados; AP CSP/A |
| Microsoft MakeCode | 9-14 (micro:bit), 5+ (Arcade) | Web (bloques+JS/TS/Python) | Gratis | Intro CS 14 semanas (micro:bit); Skillmaps; AP CSP con Arcade |
| Codingal | 6-18 | Clases online en vivo | Pago | Rutas K-12: Scratch→Python→Web/AI; certs STEM.org |
| Blockly (Google) | Librería dev | Librería | Open source | No es curso; editor de bloques |
| Kodable | K-5 (sin verificar) | Web/iOS | Freemium (sin verificar) | Niveles auto-dirigidos (sin verificar) |

### Hallazgos clave kids
- Scratch (MIT): editor de bloques, 40+ idiomas incl. español, remixing/sharing vía studios, cuentas de profesor con studios de clase. Sin LMS ni evaluaciones; dashboard limitado. Borrow: modelo gratuito de proyectos remixables, UI multilingüe, studios de clase.
- Code.org: bloques (Blockly) + texto (App Lab, Game Lab, Web Lab), módulos de IA, dashboard de profesor, vistas de progreso, rúbricas. Pedagogía standards-aligned K-12, evaluaciones por proyecto, PD para docentes. Borrow: evaluación por rúbricas, PD docente, Hour of Code como entrada.
- Tynker: bloques + texto (JS/Python/HTML/CSS/Java), robótica/IoT, modding Minecraft; dashboards docentes, mapas de conceptos, quizzes, calificación automática. Borrow: mapa de conceptos, ayuda contextual ("Tynker Troll"), quiz por lección.
- MakeCode: bloques + JS/TS/Python; targets Arcade/micro:bit/Minecraft; skillmaps; historial de versiones. Borrow: formato skillmap, puente hardware, historial de versiones.
- Codingal: instructor en vivo; Scratch, Python, JS, HTML/CSS, IA; certs STEM.org. Borrow: híbrido clases en vivo + auto-dirigido, dashboard de padres.

## 2. Teens (12-17): HTML5 web dev + IA

| Plataforma | Edad | Delivery | Modelo | Currículum |
|---|---|---|---|---|
| Code.org (IA) | 9-18 | Web | Gratis | AI Discoveries, AI Chat Lab, CS Principles |
| Teachable Machine (Google) | todos (guiado) | Web | Gratis | Sin curso; entrena modelos imagen/sonido/pose; exporta TF.js/Python |
| Machine Learning for Kids | 8-16 (guiado) | Web (Scratch/Python/App Inventor) | Gratis (cuenta docente) | Lecciones + worksheets; modelos pre-entrenados |
| Grasshopper (Google) | teens/adultos (sin verificar) | Móvil + web (descontinuado 2023) | Gratis (descontinuado) | Fundamentos JS, Intro a Webpages |
| freeCodeCamp | 16+ (adultos) | Web | Gratis, open source | 3000h+; certs (Responsive Web Design, JS, Python, Full Stack, SQL); proyectos + exámenes |
| Codecademy | 13+ (sin verificar) | Web + móvil | Freemium ($19.99-39.99/mes) | Cursos, skill paths, career paths; certs (Pro) |
| Khan Academy | 12-18+ | Web | Gratis (nonprofit) | JS+web (HTML/CSS/jQuery), Python Intro CS, AP CSP |
| Brilliant | 10+ (grado 5+) | Web + apps | Freemium (Premium) | CS interactivo: Python, algoritmos, redes neuronales, "How AI Works"; tutor IA Koji |
| Platzi | 16+ adultos (LatAm) | Web + app | Pago ($21-49/mes) | Rutas de carrera en español; certs; comunidad/clases en vivo |
| MakeCode (Arcade) | 14-18 (AP CSP) | Web | Gratis | AP CSP con Arcade, JS/TS |

### Hallazgos clave teens
- Code.org IA: AI Chat Lab (prompt engineering), AI Discoveries, entrenamiento de modelos en navegador; dashboard docente. Borrow: concepto AI Chat Lab para alfabetización de prompts.
- Teachable Machine: ML sin código (imagen/sonido/pose); exporta a TF.js/Python; integraciones (Scratch vía Raise Playground, App Inventor). UX simple de entrenamiento de modelos. Borrow: UX de entrenamiento de modelos para intro a IA.
- Machine Learning for Kids: entrena modelos imagen/sonido/texto/números; uso en Scratch/Python/App Inventor; modelos pre-entrenados; cuentas docentes. Borrow: patrón puente Scratch-ML.
- freeCodeCamp: IDE en navegador, proyectos, certs por examen; open source; comunidad. Borrow: certs verificables por examen, currículum open source.
- Codecademy: editor interactivo en navegador, workspaces, paths, quizzes, proyectos, features de IA (Interview Simulator, job-readiness checker), app móvil. Borrow: XP/gamificación, skill paths, prep de entrevistas con IA.
- Khan Academy: JS+web (ProcessingJS), HTML/CSS, SQL, Python; editor en navegador; galería de programas; recursos docentes; distritos. Borrow: puntos de mastery, modelo nonprofit gratuito, recursos docentes.
- Brilliant: resolución interactiva de problemas, Python, algoritmos, redes neuronales, "How AI Works"; tutor IA Koji; diagnóstico skill-graph; apps móviles; acreditación WASC; educadores gratis. Borrow: tutor IA (no revela respuestas), diagnóstico skill-graph, evaluaciones.
- Platzi: cursos en video en español, entorno de código integrado, bots de tutoría IA (sin verificar), app móvil offline, certs, comunidad/clases en vivo. Borrow: contenido español-first, comunidad/clases en vivo, pricing regional.

## 3. Patrones comunes

- **Forma del currículum**: bandas por grado (K-2, 3-5, 6-8, 9-12) y jerarquía unidad/lección/módulo; en teens, skill/career paths. Progresión: bloques → texto (JS/Python) → web (HTML/CSS) → IA.
- **Editores**: bloques (Blockly) en navegador para kids; editores de texto (Monaco/CodeMirror) con preview en vivo para teens; runtimes sandboxeados (iframe/worker).
- **Evaluación**: quizzes auto-calificados + rúbricas de proyecto (Code.org), XP/gamificación (Codecademy), puntos de mastery (Khan), diagnóstico skill-graph (Brilliant), certs/exámenes (freeCodeCamp).
- **Roles**: estudiante/profesor/padre; dashboards docentes con vistas de progreso, creación de clases, roster; emails de progreso a padres (Codingal).
- **Pedagogía**: aprendizaje basado en proyectos, remixing/sharing (Scratch), gamificación (rachas, insignias, leaderboards), ayuda contextual, PD docente.
- **Features de IA**: alfabetización de prompts (Code.org AI Chat Lab), entrenamiento ML sin código (Teachable Machine, ML4K), tutores IA (Brilliant Koji, bots Platzi), prep de entrevistas (Codecademy).

## 4. Gaps / oportunidades (plataforma en español)

1. **Español-first, localizado para LatAm**: la mayoría son inglés-first; Platzi es solo adultos. Faltan plataformas de bloques en español con currículum + LMS para kids.
2. **Plataforma unificada de dos tracks** (bloques kids → HTML5+IA teens) con identidad/progresión compartida y puente claro (bloques → texto).
3. **Dashboards docente + padre en español** con rúbricas, progreso y gestión de clases; Scratch no califica, Code.org poco localizado.
4. **Soporte offline/baja banda** (conectividad LatAm) — Platzi ofrece app móvil offline; la mayoría de editores web no.
5. **Modelo freemium asequible** con pricing escolar/distrital; muchos competidores paywallean analytics.
6. **Intro a IA para teens** integrando ML sin código (Teachable Machine) + alfabetización de prompts + proyectos HTML5 — pocos integran ambos.
7. **Comunidad/remix en español** (estilo Scratch) con moderación y seguridad.
8. **Certificación** con credenciales verificables (estilo freeCodeCamp) en español.

## 5. Stack tecnológico recomendado

**MVP**:
- Frontend: Next.js (React) + Tailwind; editor de bloques vía Blockly (open source); editor de texto vía Monaco Editor.
- Backend: Node.js/Fastify; PostgreSQL; Redis (sesiones/cache).
- Auth/roles: JWT + RBAC (estudiante/profesor/padre/admin); OAuth (Google).
- Contenido: lecciones en MDX; i18n (es por defecto, en después).
- Runtime: iframe sandboxeado + Web Worker para JS/HTML; track IA: TensorFlow.js + integración de exportación de Teachable Machine.
- Infra: Vercel/Netlify (web) + Postgres gestionado; CDN para assets; PWA opcional para offline.
- Analytics: PostHog o custom; dashboards docentes vía vistas SQL.

**Features MVP**:
- Track Bloques L1-L3 (editor estilo Scratch, proyectos, sharing/remix), track HTML5 L1-L3 (editor HTML/CSS/JS con preview en vivo), módulo intro IA (ML sin código estilo Teachable Machine + bases de prompts).
- Dashboard docente: creación de clases, roster, vista de progreso, rúbricas básicas.
- Dashboard padre: emails de progreso.
- Gamificación: insignias, rachas, XP.
- Certificación: insignias de finalización simple (verificables después).

**Después (later)**:
- Track Python basado en texto, IA/ML avanzado (TensorFlow), hardware (micro:bit), clases en vivo, foros de comunidad, modo offline, certs por examen, integraciones SIS/distrital, multi-idioma (pt-BR), apps móviles nativas.

## 6. Currículum propuesto (entregables concretos por proyecto)

**Track Bloques Kids (6-12)**
- L0 (5-7, estilo Jr): "Mi primera animación" — tarjeta de saludo animada con 3 sprites; "Cuenta-cuentos" — historia interactiva con sonido.
- L1 (8-9, Fundamentos): "Atrapa la fruta" — juego clicker con variable de puntaje y temporizador; "Laberinto" — sprite controlado por teclado con colisión.
- L2 (10-11, Intermedio): "Pong multijugador" — juego 2 jugadores con clones; "Dibujo con código" — arte con pen en espiral; listas para high scores.
- L3 (11-12, Avanzado/puente): "Plataformas" — side-scroller con gravedad; "Quiz interactivo" — banco de preguntas con listas; intro a leer JS generado (puente a texto).

**Track HTML5+IA Teens (12-17)**
- L0 (12-13, bases web): "Mi página personal" — HTML semántico + CSS responsive; "Tarjeta de presentación" — layout flexbox.
- L1 (13-14, interactividad): "Lista de tareas" — DOM JS + CRUD localStorage; "Juego de memoria" — manejo de eventos + estado.
- L2 (14-15, apps): "App del clima" — fetch API + renderizado JSON; "Galería de fotos" — filtros + búsqueda.
- L3 (15-16, intro IA): "Clasificador de imágenes" — modelo Teachable Machine exportado a TF.js integrado en página web; "Chat con IA" — alfabetización de prompts + llamada a endpoint LLM; discusión de ética/seguridad.
- L4 (16-17, capstone): "Proyecto final" — app estática (HTML/CSS/JS) con feature de IA, desplegada, con README y video demo; examen opcional de certificación.

## 7. Fuentes (seleccionadas)

- Scratch: https://scratch.mit.edu/parents, https://scratch.mit.edu/educators
- Code.org: https://support.code.org/hc/en-us/articles/228116468, https://code.org/districts
- Tynker: https://www.tynker.com/codingcup, https://www.tynker.com/school/coding-curriculum
- MakeCode: https://www.microsoft.com/en-us/makecode/resources, https://makecode.microbit.org/courses, https://arcade.makecode.com
- freeCodeCamp: https://www.freecodecamp.org/news/freecodecamp-turns-10-major-curriculum-updates/
- Codecademy: https://www.codecademy.com/pricing, https://www.codecademy.com/resources/blog/code-review-2024
- Khan Academy: https://www.khanacademy.org/computing, https://blog.khanacademy.org/introducing-khan-academys-new-intro-to-computer-science-course-with-python
- Brilliant: https://brilliant.org/cs/, https://brilliant.org/faq, https://educator.brilliant.org/
- Teachable Machine / ML4K: https://teachablemachine.withgoogle.com, https://machinelearningforkids.co.uk/pretrained
- Grasshopper: https://9to5google.com/2019/10/08/google-grasshopper-web, https://techcrunch.com/2018/04/18/grasshopper-a-learn-to-code-app-from-googles-area-120-incubator-goes-live/
- Codingal: https://www.codingal.com
- Platzi: https://platzi.com/l/2024lk, https://www.g2.com/products/platzi/reviews
