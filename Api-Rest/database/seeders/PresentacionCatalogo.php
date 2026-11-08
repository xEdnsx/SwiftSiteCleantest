<?php

namespace Database\Seeders;

use Illuminate\Support\Facades\DB;

/**
 * Textos e íconos con que la app muestra los servicios que ya existían.
 *
 * Los usa la migración que agrega las columnas de presentación (para no perder lo que la app
 * mostraba antes) y el seeder del catálogo (para instalaciones nuevas).
 * Solo rellena lo que está vacío: nunca pisa lo que el administrador ya escribió.
 */
final class PresentacionCatalogo
{
    private const CATEGORIAS = [
        'Sillas' => [
            'descripcion' => 'Sillas empresariales, de comedor y más.',
            'icono' => 'sillas',
            'pregunta_tipo' => '¿Qué limpiamos?',
            'pregunta_variante' => 'Material',
            'pregunta_cantidad' => '¿Cuántas sillas son?',
            'unidad' => 'Sillas',
        ],
        'Muebles' => [
            'descripcion' => 'Juegos de sala, ottomans, butacas y tapicería de vehículos: cuero, tela y microfibra.',
            'icono' => 'muebles',
            'pregunta_tipo' => '¿Qué mueble es?',
            'pregunta_variante' => 'Material',
            'pregunta_cantidad' => '¿Cuántos son?',
            'unidad' => 'Muebles',
            'nota' => 'Los muebles de madera sin tapizar no se limpian con vapor.',
        ],
        'Colchones' => [
            'descripcion' => 'De individual a king, por ambos lados. Ayuda a reducir ácaros y manchas.',
            'icono' => 'colchones',
            'pregunta_tipo' => 'Medida',
            'pregunta_variante' => 'Opciones',
            'pregunta_cantidad' => '¿Cuántos colchones?',
            'unidad' => 'Colchones',
            'nota' => 'Limpiamos ambos lados. Ya está incluido en el precio.',
        ],
        'Baños' => [
            'descripcion' => 'Desinfección y desincrustado de pisos, paredes, duchas y sanitarios.',
            'icono' => 'banos',
            'pregunta_tipo' => 'Tipo de baño',
            'pregunta_variante' => 'Tamaño',
            'pregunta_cantidad' => '¿Cuántos baños?',
            'unidad' => 'Baños',
        ],
    ];

    /** Texto corto bajo la opción: [categoría, columna que se compara, valor] => detalle. */
    private const DETALLES = [
        ['Colchones', 'tipo_item', 'Colchón individual', '90 × 190 cm'],
        ['Colchones', 'tipo_item', 'Colchón matrimonial', '135 × 190 cm'],
        ['Colchones', 'tipo_item', 'Colchón queen', '150 × 200 cm'],
        ['Colchones', 'tipo_item', 'Colchón king', '180 × 200 cm'],
        ['Baños', 'material', 'Pequeño', 'hasta 4 m²'],
        ['Baños', 'material', 'Mediano', '4 a 6 m²'],
        ['Baños', 'material', 'Grande', 'más de 6 m²'],
    ];

    /** Explicación de qué incluye cada tipo: [categoría, tipo_item, texto]. */
    private const DESCRIPCIONES = [
        ['Baños', 'Baño completo', 'Incluye inodoro, lavamanos, ducha o tina, piso y paredes.'],
        ['Baños', 'Baño social', 'Incluye inodoro, lavamanos y piso. Es el baño de visitas, sin ducha ni tina.'],
        ['Muebles', 'Sofá de 2 plazas', 'Sofá para 2 personas (love seat).'],
        ['Muebles', 'Sofá de 3 plazas', 'Sofá para 3 personas.'],
        ['Muebles', 'Butaca', 'Sillón de una sola persona.'],
        ['Muebles', 'Ottoman', 'Banco o reposapiés tapizado.'],
        ['Muebles', 'Tapicería de vehículo', 'Se cobra por asiento. Un auto normal tiene 5.'],
    ];

    public static function aplicar(): void
    {
        foreach (self::CATEGORIAS as $nombre => $campos) {
            foreach ($campos as $columna => $valor) {
                $consulta = DB::table('categorias_servicio')->where('nombre', $nombre);
                // "Servicio de limpieza de X" es el texto genérico que ponía el seeder antiguo.
                $vacia = $columna === 'descripcion'
                    ? fn ($q) => $q->whereNull('descripcion')->orWhere('descripcion', 'like', 'Servicio de limpieza de %')
                    : fn ($q) => $q->whereNull($columna);
                $consulta->where($vacia)->update([$columna => $valor]);
            }
        }

        foreach (self::DETALLES as [$categoria, $columna, $valorColumna, $detalle]) {
            self::tarifasDe($categoria)->where($columna, $valorColumna)->whereNull('detalle')->update(['detalle' => $detalle]);
        }
        foreach (self::DESCRIPCIONES as [$categoria, $tipo, $texto]) {
            self::tarifasDe($categoria)->where('tipo_item', $tipo)->whereNull('descripcion')->update(['descripcion' => $texto]);
        }
    }

    private static function tarifasDe(string $categoria)
    {
        $id = DB::table('categorias_servicio')->where('nombre', $categoria)->value('id_categoria');

        return DB::table('tarifas_items')->where('id_categoria', $id ?? 0);
    }
}
