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
