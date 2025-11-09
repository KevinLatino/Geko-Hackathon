# Envelopes Module

Módulo de sobres (envelopes) para gestionar ahorros de tokens de manera organizada.

## Estructura

```
envelopes/
├── hooks/
│   └── useEnvelopes.ts      # Hook principal para interactuar con el contrato
├── pages/
│   └── EnvelopesPage.tsx    # Página principal del módulo
├── ui/
│   ├── EnvelopeCard.tsx     # Componente de carta para mostrar sobres
│   ├── EnvelopeCard.css
│   ├── CreateEnvelopeForm.tsx # Formulario para crear nuevos sobres
│   ├── CreateEnvelopeForm.css
│   ├── EnvelopeActions.tsx  # Componente para acciones (depositar/retirar)
│   └── EnvelopeActions.css
├── constants.ts             # Constantes del módulo (CONTRACT_ID, TOKEN_ADDRESSES)
├── index.ts                 # Exportaciones del módulo
└── README.md                # Este archivo
```

## Uso

El módulo está configurado como ruta en `App.tsx`:

```tsx
import EnvelopesPage from "./components/modules/envelopes/pages/EnvelopesPage.tsx";

<Route path="/envelopes" element={<EnvelopesPage />} />
```

## Características

- 🎴 Diseño de cartas elegante para visualizar sobres
- ➕ Crear nuevos sobres con nombre, descripción y token
- 💰 Depositar tokens en sobres
- 💸 Retirar tokens de sobres
- 📊 Consultar balance de sobres
- 📜 Listar todos los sobres del usuario
- 🎨 Interfaz responsive y moderna

## Componentes

### EnvelopeCard
Muestra un sobre individual como una carta con:
- Icono de sobre
- ID del sobre
- Nombre y descripción
- Balance actual
- Token asociado

### CreateEnvelopeForm
Formulario para crear nuevos sobres con validación.

### EnvelopeActions
Panel de acciones para interactuar con un sobre seleccionado:
- Depositar tokens
- Retirar tokens
- Consultar balance

## Hook useEnvelopes

Proporciona las siguientes funciones:
- `createEnvelope(name, description, tokenContract)` - Crear un nuevo sobre
- `deposit(id, amount)` - Depositar tokens
- `withdraw(id, amount)` - Retirar tokens
- `getBalance(id)` - Obtener balance de un sobre
- `listEnvelopes()` - Listar todos los sobres del usuario
- `loading` - Estado de carga

