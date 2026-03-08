<?php

class RegistroHorasModel
{
    public $enlace;

    public function __construct()
    {
        $this->enlace = new MySqlConnect();
    }

    public function all()
    {
        try {
            $vSql = "SELECT rh.id_registro, rh.id_usuario, rh.id_subtarea, rh.fecha, rh.horas, rh.comentarios, rh.estado_aprobacion, rh.fecha_creacion, " .
                "u.nombre, u.apellidos, st.nombre_tarea, st.id_proyecto, p.nombre_proyecto, p.id_cliente, c.nombre_cliente " .
                "FROM registro_horas rh " .
                "INNER JOIN sub_tareas st ON st.id_subtarea = rh.id_subtarea " .
                "LEFT JOIN proyectos p ON p.id_proyecto = st.id_proyecto " .
                "LEFT JOIN clientes c ON c.id_cliente = p.id_cliente " .
                "LEFT JOIN usuarios u ON u.id_usuario = rh.id_usuario " .
                "ORDER BY rh.fecha DESC, rh.id_registro DESC;";

            return $this->enlace->executeSQL($vSql);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function get($idRegistro)
    {
        try {
            $idRegistro = (int) $idRegistro;
            $vSql = "SELECT rh.id_registro, rh.id_usuario, rh.id_subtarea, rh.fecha, rh.horas, rh.comentarios, rh.estado_aprobacion, rh.fecha_creacion, " .
                "u.nombre, u.apellidos, st.nombre_tarea, st.id_proyecto, p.nombre_proyecto, p.id_cliente, c.nombre_cliente " .
                "FROM registro_horas rh " .
                "INNER JOIN sub_tareas st ON st.id_subtarea = rh.id_subtarea " .
                "LEFT JOIN proyectos p ON p.id_proyecto = st.id_proyecto " .
                "LEFT JOIN clientes c ON c.id_cliente = p.id_cliente " .
                "LEFT JOIN usuarios u ON u.id_usuario = rh.id_usuario " .
                "WHERE rh.id_registro = $idRegistro;";

            $vResultado = $this->enlace->executeSQL($vSql);

            if (!empty($vResultado)) {
                return $vResultado[0];
            }

            return null;
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function getByUser($idUsuario)
    {
        try {
            $idUsuario = addslashes($idUsuario);
            $vSql = "SELECT rh.id_registro, rh.id_usuario, rh.id_subtarea, rh.fecha, rh.horas, rh.comentarios, rh.estado_aprobacion, rh.fecha_creacion, " .
                "st.nombre_tarea, st.id_proyecto, p.nombre_proyecto, p.id_cliente, c.nombre_cliente " .
                "FROM registro_horas rh " .
                "INNER JOIN sub_tareas st ON st.id_subtarea = rh.id_subtarea " .
                "LEFT JOIN proyectos p ON p.id_proyecto = st.id_proyecto " .
                "LEFT JOIN clientes c ON c.id_cliente = p.id_cliente " .
                "WHERE rh.id_usuario = '$idUsuario' " .
                "ORDER BY rh.fecha DESC, rh.id_registro DESC;";

            return $this->enlace->executeSQL($vSql);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function create($objeto)
    {
        try {
            $idUsuario = addslashes($objeto->id_usuario);
            $idSubTarea = addslashes($objeto->id_subtarea);
            $fecha = addslashes($objeto->fecha);
            $horas = number_format((float) $objeto->horas, 2, '.', '');
            $comentarios = isset($objeto->comentarios) && $objeto->comentarios !== null
                ? "'" . addslashes($objeto->comentarios) . "'"
                : "NULL";
            $estadoAprobacion = isset($objeto->estado_aprobacion) && !empty($objeto->estado_aprobacion)
                ? addslashes($objeto->estado_aprobacion)
                : 'Pendiente';

            $vSql = "INSERT INTO registro_horas (id_usuario, id_subtarea, fecha, horas, comentarios, estado_aprobacion) VALUES " .
                "('$idUsuario', '$idSubTarea', '$fecha', $horas, $comentarios, '$estadoAprobacion');";
            $idRegistro = $this->enlace->executeSQL_DML_last($vSql);

            return $this->get($idRegistro);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function createBatch($objeto)
    {
        try {
            $registros = isset($objeto->registros) && is_array($objeto->registros)
                ? $objeto->registros
                : [];

            $insertados = [];
            $errores = [];

            foreach ($registros as $indice => $registro) {
                $idUsuario = isset($registro->id_usuario) ? trim($registro->id_usuario) : '';
                $idSubTarea = isset($registro->id_subtarea) ? trim($registro->id_subtarea) : '';
                $fecha = isset($registro->fecha) ? trim($registro->fecha) : '';
                $horas = isset($registro->horas) ? (float) $registro->horas : 0;

                if ($idUsuario === '' || $idSubTarea === '' || $fecha === '' || $horas <= 0) {
                    $errores[] = [
                        'index' => $indice,
                        'message' => 'Registro incompleto: id_usuario, id_subtarea, fecha y horas son obligatorios.',
                    ];
                    continue;
                }

                try {
                    $insertados[] = $this->create($registro);
                } catch (Exception $innerException) {
                    $errores[] = [
                        'index' => $indice,
                        'message' => $innerException->getMessage(),
                    ];
                }
            }

            return [
                'insertados' => $insertados,
                'total_insertados' => count($insertados),
                'errores' => $errores,
                'total_errores' => count($errores),
            ];
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function delete($idRegistro)
    {
        try {
            $idRegistro = (int) $idRegistro;
            $vSql = "DELETE FROM registro_horas WHERE id_registro = $idRegistro;";
            return $this->enlace->executeSQL_DML($vSql);
        } catch (Exception $e) {
            handleException($e);
        }
    }
}
