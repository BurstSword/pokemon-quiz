# Pokemon Quiz

## Deploy en GitHub Pages

1. Ve al repositorio en GitHub.
2. Abre `Settings > Pages`.
3. En `Source`, selecciona `GitHub Actions`.
4. Haz push a la rama `master`.
5. La app se desplegara en `https://burstsword.github.io/pokemon-quiz/`.

- Este proyecto usa `base-href` `/pokemon-quiz/` para GitHub Pages.
- Si usas un dominio propio en raiz, cambia el `base-href` a `/`.
- Si al recargar una ruta como `/pokedex` aparece un `404`, comprueba que el artifact incluye `404.html` como copia de `index.html`.

## PWA

- La app es instalable como PWA.
- En Chrome y Edge puede aparecer el boton de instalar.
- En Android se puede anadir a la pantalla de inicio.
- En iOS se instala desde Safari > Compartir > Anadir a pantalla de inicio.
- La PWA requiere HTTPS para funcionar correctamente.
- En local, el service worker se valida mejor sirviendo un build de produccion, no solo con `npm start`.

Comandos de prueba:

```bash
npm run build:github
npx serve dist -l 8080
```
