# Migration Analysis: Ionic to Angular

## 1. Resumen funcional de la app actual

- Aplicacion Angular + Ionic centrada en quizzes de Pokemon con dataset local.
- La app carga `src/assets/pokemon.json` mediante `HttpClient` y usa una lista local de `1025` Pokemon.
- No hay autenticacion, perfiles, favoritos, equipo, progreso persistido ni almacenamiento local.
- El flujo principal empieza en `lobby` y desde ahi se accede a 6 modos de juego activos.
- Existe una `Pokedex` navegable por URL (`/pokedex`) con busqueda, paginacion y detalle en modal.
- Las imagenes de Pokemon se sirven desde URLs remotas de `serebii.net`.
- El modo de colores no usa API REST; extrae la paleta en cliente desde la artwork oficial de GitHub/PokeAPI sprites:
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{number}.png`

## 2. Lista de pantallas actuales

### Pantallas activas por rutas actuales

- `lobby`: selector de modos de juego.
- `tab1`: quiz de letras con imagen visible y teclado generado aleatoriamente.
- `shadow-quiz`: quiz de opcion multiple con silueta, ayudas y tipos.
- `blur-quiz`: quiz de opcion multiple con imagen borrosa progresiva.
- `tab4`: quiz de letras con teclado completo tipo QWERTY y validacion por `ENTER`.
- `clues`: quiz por pistas progresivas + busqueda de Pokemon.
- `colors`: quiz por paleta de colores dominante.
- `pokedex`: listado paginado, filtro por nombre y detalle de Pokemon.
- `tab2`: redireccion automatica a `/shadow-quiz`.
- `tab3`: redireccion automatica a `/blur-quiz`.

### Pantallas/componentes legacy no activos en rutas

- `src/app/colors/*`: version antigua del modo colores.
- `src/app/clues/*`: version antigua del modo pistas.

## 3. Rutas actuales y rutas propuestas en Angular

| Ruta actual | Comportamiento actual | Ruta Angular propuesta | Notas |
| --- | --- | --- | --- |
| `/` | redirige a `lobby` | `/` -> `lobby` | mantener |
| `/lobby` | menu principal | `/lobby` | mantener |
| `/tab1` | quiz letras con banco aleatorio | `/tab1` | mantener por compatibilidad |
| `/tab2` | redirect a `shadow-quiz` | `/tab2` -> `/shadow-quiz` | mantener redirect |
| `/tab3` | redirect a `blur-quiz` | `/tab3` -> `/blur-quiz` | mantener redirect |
| `/shadow-quiz` | quiz silueta | `/shadow-quiz` | mantener |
| `/blur-quiz` | quiz desenfoque | `/blur-quiz` | mantener |
| `/tab4` | quiz letras con teclado completo | `/tab4` | mantener |
| `/clues` | quiz por pistas | `/clues` | mantener |
| `/colors` | quiz por colores | `/colors` | mantener |
| `/pokedex` | listado + detalle | `/pokedex` | mantener |

### Enrutado Angular propuesto

- `src/app/app.routes.ts` con standalone components.
- `router-outlet` nativo de Angular.
- Redirecciones simples para `/`, `/tab2`, `/tab3` y `**`.

## 4. Componentes actuales y equivalentes nuevos

| Actual | Tipo actual | Equivalente Angular limpio |
| --- | --- | --- |
| `AppComponent` | shell Ionic con `ion-app` y `ion-router-outlet` | `AppComponent` standalone con `router-outlet` |
| `LobbyPage` | pagina Ionic | `LobbyPageComponent` standalone |
| `Tab1Page` | pagina Ionic | `Tab1PageComponent` standalone |
| `ShadowQuizPage` | pagina Ionic | `ShadowQuizPageComponent` standalone |
| `BlurRevampPage` | pagina Ionic | `BlurQuizPageComponent` standalone |
| `Tab4Page` | pagina Ionic | `Tab4PageComponent` standalone |
| `CluesRevampPage` | pagina Ionic | `CluesPageComponent` standalone |
| `ColorsRevampPage` | pagina Ionic | `ColorsPageComponent` standalone |
| `PokedexPage` | pagina Ionic | `PokedexPageComponent` standalone |
| `PokemonModalComponent` | modal Ionic con `ModalController` | `PokemonDetailDialogComponent` propio en Angular |

### Componentes/shared propuestos

- `PageHeaderComponent`: sustituto comun de `ion-header` y `ion-toolbar`.
- `ToastOutletComponent`: sustituto del `ToastController`.
- `SkeletonBlockComponent`: sustituto de `ion-skeleton-text`.
- `PokemonDetailDialogComponent`: sustituto del modal Ionic.

## 5. Servicios actuales y equivalentes nuevos

| Actual | Responsabilidad | Nuevo equivalente |
| --- | --- | --- |
| `PokemonService` | cargar `assets/pokemon.json`, normalizar `Legendary` | se mantiene con ajuste de imports/modelos |
| `PokemonTypeService` | mapear tipo -> icono/color | se mantiene |
| `ToastController` de Ionic | feedback temporal en pistas | reemplazar por `ToastService` propio |

### Lógica compartida actual reutilizable

- `QuizBaseComponent`: base para quizzes de opciones (`shadow`, `blur`).
- `pokemon-utils.ts`: utilidades para random, sampleo, shuffle y URL de artwork oficial.

## 6. Modelos/interfaces detectados

### `interfaces.ts`

```ts
export interface Pokemon {
  Number: number;
  Name: string;
  Generation: number;
  Legendary: boolean | string;
  Image: string;
  Type1: string;
  Type2?: string;
  Description?: string;
}
```

```ts
export interface Option {
  Name: string;
  Correct: boolean;
  Background: string;
}
```

### Tipos internos detectados

- `OptionState = 'normal' | 'correct' | 'incorrect' | 'disabled'`
- `OptionVM = { Name: string; Correct: boolean; state: OptionState }`
- `CellState = 'empty' | 'ok' | 'bad'`
- `PokemonTypeMeta`
- `LobbyRoute`

## 7. Dependencias que se mantienen

### Necesarias para la nueva app

- `@angular/common`
- `@angular/core`
- `@angular/forms`
- `@angular/router`
- `@angular/platform-browser`
- `@angular/compiler`
- `rxjs`
- `tslib`
- `zone.js`

### Posibles a mantener segun decision final

- `@angular/animations`: solo si se usa realmente en la version nueva.

## 8. Dependencias Ionic que deben eliminarse o sustituirse

### A eliminar del runtime/build Angular

- `@ionic/angular`
- `ionicons`
- `@ionic/angular-toolkit`
- Imports CSS de Ionic en `src/global.scss`
- Copia de assets SVG de `ionicons` en `angular.json`
- `IonicModule.forRoot()`
- `IonicRouteStrategy`
- `ion-*` en templates

### Dependencias no Ionic pero candidatas a limpieza

- `@angular/material` y `@angular/cdk`: actualmente no aportan valor real; `MatPaginatorModule` esta importado pero no usado.
- `@capacitor/*`: no hay uso en codigo Angular actual.
- `axios`, `cheerio`: solo se usan en `scraper.js`, no en la app.
- `node-vibrant`: no se usa; la paleta se calcula manualmente con canvas.

## 9. APIs usadas y contratos de datos

### Datos locales

- `assets/pokemon.json`
  - contrato principal de la app
  - contiene `1025` Pokemon
  - campos detectados: `Number`, `Name`, `Generation`, `Legendary`, `Image`, `Type1`, `Type2`, `Description`

### Endpoints/recursos externos

- `https://www.serebii.net/pokemon/art/{number}.png`
  - usado como `Image` de cada Pokemon
  - dependencia remota para mostrar sprites/artworks

- `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{number}.png`
  - usado solo en el modo colores para extraer paleta con canvas
  - no se invoca via `HttpClient`; se carga via `Image()`

### Script auxiliar no usado por runtime

- `scraper.js`
  - usa `axios` + `cheerio`
  - lee y escribe `src/assets/newPokedex.json`
  - no participa en la ejecucion de la app

## 10. Estado local usado por la app

### Estado en memoria, no persistente

- `PokemonService`
  - cache RxJS con `shareReplay(1)` del dataset local

- `tab1`
  - Pokemon actual
  - nombre partido en letras
  - respuesta actual por casilla
  - feedback por casilla
  - teclado generado en grupos 5/4/5/4...
  - estado de carga de imagen

- `tab4`
  - Pokemon actual
  - respuesta por casilla
  - feedback por casilla
  - posicion seleccionada
  - teclado QWERTY fijo
  - carga de imagen

- `shadow-quiz`
  - Pokemon actual
  - opciones aleatorias
  - bloqueo tras responder
  - tipos visibles
  - silueta visible/revelada

- `blur-quiz`
  - Pokemon actual
  - opciones aleatorias
  - `blurState` de 0 a 4
  - revelado final
  - tipos visibles

- `colors`
  - Pokemon actual
  - paleta calculada
  - opciones aleatorias
  - estado de carga de paleta
  - tipos visibles

- `clues`
  - Pokemon actual
  - lista de pistas generadas
  - pistas visibles
  - termino de busqueda
  - resultados filtrados

- `pokedex`
  - lista total
  - lista filtrada
  - pagina actual
  - tamano de pagina
  - termino de busqueda
  - Pokemon seleccionado para modal

### Confirmacion de no uso persistente

- No se detecta `localStorage`
- No se detecta `sessionStorage`
- No se detecta `indexedDB`
- No se detecta `Capacitor Preferences`

## 11. Estilos, layout y diseno que deben conservarse

- Gradiente rojo principal definido por `--poke-gradient`.
- Layout tipo app mobile-first con header superior y contenedor blanco redondeado.
- Hero cards con tonos rojos y blancos.
- Uso visual de iconos y badges de tipos desde `src/assets/pokemontypes/*.webp`.
- Iconografia custom de `src/assets/icons/*.svg`.
- Tarjetas, botones redondeados y sombras suaves.
- Experiencia responsive para movil y escritorio.
- Skeletons/estados de carga en `tab1`, `tab4`, `colors`.
- Drawer/panel de ayudas del modo sombra, aunque debe reemplazarse por UI Angular propia.

## 12. Riesgos o dudas detectadas

- Las imagenes dependen de recursos remotos; si `serebii.net` falla, varios modos quedan sin imagen.
- El modo colores depende de CORS correcto al cargar artwork oficial desde GitHub/PokeAPI sprites.
- El dataset mezcla `Legendary` como `string` (`'TRUE'/'FALSE'`) y `boolean`; ya se normaliza en servicio.
- Hay archivos legacy no usados (`src/app/colors`, `src/app/clues`) que pueden confundir si no se eliminan.
- `tab1` y `tab4` contienen caracteres mal codificados en comentarios/textos del fuente; conviene limpiar encoding al migrar.
- El detalle de Pokedex usa modal Ionic; al sustituirlo hay que cuidar cierre por overlay, foco y responsive.
- `git status` no se puede usar sin marcar el repo como seguro por la politica del entorno actual.

## 13. Plan de migracion por pasos

1. Crear `app.routes.ts` y `app.config.ts` con bootstrap standalone.
2. Sustituir `AppModule`/`AppRoutingModule` por `bootstrapApplication`.
3. Mover modelos a `src/app/core/models`.
4. Mover servicios reutilizables a `src/app/core/services`.
5. Mantener `pokemon-utils` y la logica base de quizzes en `shared`.
6. Rehacer cada pantalla activa como standalone component sin `ion-*`.
7. Crear componentes shared minimos para header, skeleton, toast y dialog.
8. Reemplazar `ModalController` por dialog propio controlado por estado Angular.
9. Reemplazar `ToastController` por feedback Angular propio.
10. Eliminar modulos/routing de pagina y resto de infraestructura Ionic.
11. Limpiar `angular.json`, `global.scss`, `package.json`, `main.ts` e `index.html`.
12. Verificar build, rutas, imports, assets e interacciones.

## Arquitectura Angular propuesta

```text
src/app/
  app.component.ts
  app.component.html
  app.component.scss
  app.routes.ts
  app.config.ts
  core/
    models/
      pokemon.model.ts
    services/
      pokemon.service.ts
      pokemon-type.service.ts
      toast.service.ts
  shared/
    components/
      page-header/
      pokemon-detail-dialog/
      skeleton-block/
      toast-outlet/
    quiz/
      quiz-base.ts
    utils/
      pokemon.utils.ts
  features/
    lobby/
    tab1/
    shadow-quiz/
    blur-quiz/
    tab4/
    clues/
    colors/
    pokedex/
```

### Notas de arquitectura

- No hacen falta guards, interceptores, pipes ni directivas adicionales con el estado actual del proyecto.
- Se mantienen los nombres de rutas actuales para no romper flujos existentes.
- Se evita crear una carpeta nueva tipo `angular-pokemon-app/` porque el proyecto ya es Angular y la migracion puede hacerse limpiando la estructura actual.
