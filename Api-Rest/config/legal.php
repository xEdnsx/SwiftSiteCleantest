<?php

return [
    /*
    | Versión vigente de los Términos y la Política de Privacidad (fecha en que se publicó).
    | Se guarda junto a cada aceptación, para poder demostrar qué texto aceptó cada persona.
    | Cuando cambien los textos de la app (src/app/legal.ts), actualiza también este valor.
    */
    'version' => env('LEGAL_VERSION', '2026-11-08'),
];
