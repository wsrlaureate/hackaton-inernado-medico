<div align="center">
  <img width="1200" height="475" alt="Juego de Internado Médico" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

  # 🏥 Simulador de Internado Médico - Perú

  ### *La simulación clínica definitiva impulsada por Inteligencia Artificial Multimodal*

  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Gemini AI](https://img.shields.io/badge/Google%20Gemini-8E75C2?style=for-the-badge&logo=google-gemini&logoColor=white)](https://ai.google.dev/)
  [![Netlify](https://img.shields.io/badge/Netlify-00C8B5?style=for-the-badge&logo=netlify&logoColor=white)](https://www.netlify.com/)
</div>

---

## 🎯 Sobre el Proyecto

**Simulador de Internado Médico** es una aplicación interactiva de simulación clínica diseñada para estudiantes de medicina en el Perú que se preparan o cursan su Internado Médico. 

Desarrollada en el marco de una iniciativa académica de **Laureate**, la plataforma combina la potencia de **Google AI Studio** y **Gemini** para generar casos clínicos realistas y dinámicos basados en la realidad de los centros de salud peruanos (MINSA y EsSalud).

> [!NOTE]
> Este proyecto tiene fines exclusivamente educativos y de entrenamiento clínico, y no debe utilizarse como herramienta de diagnóstico médico real.

---

## ✨ Características Destacadas

*   🤖 **Generador Dinámico de Casos Clínicos:** Elige tu área médica (Interna, Cirugía, Pediatría, Gineco-Obstetricia, Emergencia), nivel de dificultad (1 al 10) y tipo de hospital (MINSA -recursos limitados- o EsSalud). Gemini generará un caso clínico realista e inédito.
*   🎙️ **Llamada de Voz Multimodal Avanzada:** Interactúa con el paciente mediante una simulación de voz en tiempo real impulsada por `gemini-2.5-flash-preview-tts`. Escucha sus síntomas y responde oralmente.
*   🎭 **Personalidades de Pacientes:** Los pacientes reaccionan con diferentes perfiles de personalidad (colaborador, callado/monosílabo, ansioso, o irrespetuoso/difícil de tratar).
*   📋 **Examen Físico y Exámenes Auxiliares:** Solicita y analiza resultados de laboratorio e imágenes clínicas (radiografías, ecografías, hemogramas) con su respectiva interpretación clínica.
*   🎓 **Asesoría de un Médico Mentor:** Recibe retroalimentación clínica en tiempo real de tu Doctor Mentor con tres personalidades disponibles: amable/dócil, duro/estricto y el clásico doctor sarcástico ("espeso").
*   📝 **Evaluación y Preguntas de Opción Múltiple:** Pon a prueba tu diagnóstico con preguntas basadas en guías nacionales peruanas (MINSA/EsSalud) e internacionales (Harrison, UpToDate).

---

## 🛠️ Requisitos Previos

Para ejecutar y desplegar este proyecto, necesitarás:

1.  **Clave de API de Gemini (Gemini API Key):** Es necesaria para que funcionen las características de Inteligencia Artificial (caso clínico, respuestas del paciente, generación de imágenes del paciente, síntesis de voz, etc.). Obtén una gratis en [Google AI Studio](https://aistudio.google.com/).
2.  **Cuenta en Netlify:** Para realizar el despliegue a producción de forma rápida y gratuita.

---

## 🚀 Instalación y Configuración Local

Sigue estos pasos para ejecutar el proyecto en tu entorno local:

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/tu-usuario/tu-repositorio.git
    cd tu-repositorio
    ```

2.  **Instalar las dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**
    Crea un archivo llamado `.env` en la raíz del proyecto y añade tu API Key de Gemini:
    ```env
    GEMINI_API_KEY="TU_API_KEY_DE_GEMINI"
    APP_URL="http://localhost:3000"
    ```

4.  **Iniciar el servidor de desarrollo:**
    ```bash
    npm run dev
    ```
    Abre tu navegador en [http://localhost:3000](http://localhost:3000) para ver la aplicación ejecutándose.

---

## 🌐 Despliegue en Netlify

El proyecto cuenta con un archivo `netlify.toml` ya configurado para compilar y servir la aplicación SPA de forma correcta.

### Pasos para desplegar:

1.  Sube el código a tu propio repositorio de **GitHub**.
2.  Inicia sesión en **[Netlify](https://www.netlify.com/)** y haz clic en **"Add new site"** -> **"Import an existing project"**.
3.  Conecta tu cuenta de GitHub y selecciona el repositorio del simulador.
4.  **Configurar la Variable de Entorno (¡CRÍTICO!):**
    *   Durante la configuración del sitio o en **Site Configuration > Environment Variables**, añade una variable de entorno:
        *   **Key:** `GEMINI_API_KEY`
        *   **Value:** *(Tu clave de API obtenida de Google AI Studio)*
5.  Haz clic en **"Deploy"**. Netlify compilará el proyecto automáticamente y te dará una URL pública.

---

## 👨‍⚕️ Créditos y Agradecimientos

Este proyecto fue desarrollado utilizando herramientas de Inteligencia Artificial de **Google AI Studio** y desplegado en la infraestructura en la nube de **Netlify**.

Agradecimiento especial a **Laureate** por impulsar el desarrollo de tecnologías y simulaciones innovadoras aplicadas a la educación médica en el Perú.
