# PP Solution Analyzer

Een browser-gebaseerde tool om geëxporteerde **Power Platform solutions** te analyseren op import-problemen.

## ✨ Functionaliteiten

- 📁 Upload een **ZIP** bestand (directe solution export) of **XML** bestand
- 📋 Plak **XML inhoud** direct in het tekstvak
- 🔍 Automatische detectie van:
  - Ontbrekende afhankelijkheden (`MissingDependencies`)
  - Connectie referenties die herconfiguratie nodig hebben
  - Omgevingsvariabelen zonder standaardwaarden
  - Standaard publisher prefix (`new`)
  - Managed vs. unmanaged solution
  - Canvas apps & Power Automate flows
  - Beveiligingsrollen
  - Dubbele component namen
- 💡 Per probleem een **concrete oplossing**

## 🐳 Starten met Docker

```bash
docker compose up -d
```

De app draait daarna op **http://localhost:8090**

## 🛠️ Lokaal zonder Docker

Open `index.html` direct in je browser. Geen installatie vereist.

## 📁 Projectstructuur

```
├── index.html          # Hoofd HTML pagina
├── style.css           # Styling (dark mode glassmorphism)
├── analyzer.js         # Analyse engine
├── Dockerfile          # Docker image definitie
├── docker-compose.yml  # Docker Compose configuratie
└── nginx.conf          # Nginx server configuratie
```
