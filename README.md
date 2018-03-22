# Batalla Naval o Battleship v 1.0

Esta es una aplicación web hecha con Node + Express + jQuery que implementa el clásico juego de Batalla Naval o Battleship. Permite nomúltiples partidas simultáneas.

El software se distribuye bajo la licencia MIT. Ver el archivo `licence.txt` para más detalles.

Las instrucciones de este documento son para la plataforma Cloud9.

## 0. Requisitos

Para poder ejecutarse se requiere tener instalado el siguiente software:

- Node 4.6.*
- MongoDB 2.6.*
- Dependencias Adicionales
  - ejs
  - express-ejs-layouts
  - mongoose
  - cookie-session
  - promisify
  - readline-sync
  - request
  - stringify
  - cli-clear
  - cli-table

## 1. Instalación

Para asegurar el correcto funcionamiento de la plataforma y sus clientes, correr el siguiente comando en el directorio `batalla-naval`

    npm install

## 2. Inicialización

Primero se debe iniciar MongoDB con el siguiente comando:

    mongod --nojournal

Posteriormente, se ejecuta el siguiente comando en otra terminal para iniciar el servidor de Node:

    npm start

## 3.1 Cliente de texto

Para correr el cliente de manera local, correr el siguiente comando en una terminal desde el directorio `batalla-naval`

      npm run-script cliente
      
Para cambiar las opciones favor de consultar `package.json`.

## 3.2 Cliente Web

En un navegador, ir al URL: `http://nombre-del-servidor/gato/`. Cada sesión nueva requiere un navegador distinto.

## 5. Colecciones

Se tienen las siguientes dos colecciones que son manejadas por la lógica de la aplicación:

    players
    games

Son accessibles con métodos de *MongoDB*.