# Notas de revisión para App Store Connect

Texto a pegar en **App Review Information** de App Store Connect.

> Estas credenciales son permanentes: cada actualización se revisa con ellas.
> Si cambian, hay que actualizar `src/features/demo/demoConfig.js` **y** este
> documento **y** la ficha en App Store Connect.

## Campos de la cuenta de demostración

| Campo | Valor |
|---|---|
| Sign-in required | Sí |
| User name | `99999999` |
| Password | `2468` |

## Notas (campo "Notes")

```
Esta aplicación no utiliza correo/contraseña. La identidad del votante es su
cédula de identidad boliviana, y el acceso local se protege con un PIN de 4
dígitos almacenado únicamente en el dispositivo.

Para acceder:
1. Abrir la app.
2. Tocar "Iniciar sesión" en la pantalla inicial.
3. Ingresar la cédula 99999999.
4. Ingresar el PIN 2468.
5. La app abre la pantalla principal en modo demostración, con una elección
   de ejemplo abierta y disponible para votar.

Al reabrir la app se retoma la sesión de demostración y solo se solicita el
PIN 2468.

Mientras la cuenta de demostración está activa, la app muestra un aviso
permanente de "Modo demostración": los datos son de ejemplo y el voto no se
registra en ninguna elección real ni en la cadena de bloques. Para salir y
borrar los datos de ejemplo: pestaña Perfil > "Salir del modo demostración".

El registro real requiere fotos de la cédula física y una selfie de un
ciudadano habilitado en el padrón electoral boliviano, por lo que proveemos
esta cuenta de demostración.
```

## Recomendación

Adjuntar un video de pantalla de 30 segundos con los pasos 1-5. Reduce mucho
la probabilidad de un segundo rechazo.

## Qué ve el revisor

- Una elección abierta ("Elecciones Universitarias"), cuya ventana de votación
  se calcula respecto al momento actual: siempre está abierta, sin importar la
  fecha de revisión.
- Tres opciones de partido más la tarjeta de voto en blanco.
- Comprobante de voto tras emitirlo, y la participación en el historial junto a
  una participación previa de ejemplo.
- Ninguna llamada a backend, cadena de bloques ni al SDK nativo de identidad.
  El voto de demostración funciona incluso sin conexión.
