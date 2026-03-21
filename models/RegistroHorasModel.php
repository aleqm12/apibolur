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
            // Consulta consolidada con proyecto, sub tarea, cliente y estado de aprobacion.
            $vSql = "SELECT rh.id_registro, rh.id_usuario, rh.id_subtarea, rh.fecha, rh.horas, rh.comentarios, rh.estado_aprobacion, rh.fecha_creacion, " .
                "u.nombre, u.apellidos, st.nombre_tarea, st.id_proyecto, p.nombre_proyecto, p.id_cliente, c.nombre_cliente, " .
                "ap.motivo_rechazo AS motivo_rechazo_admin, ap.fecha_decision AS fecha_decision_admin " .
                "FROM registro_horas rh " .
                "INNER JOIN sub_tareas st ON st.id_subtarea = rh.id_subtarea " .
                "LEFT JOIN proyectos p ON p.id_proyecto = st.id_proyecto " .
                "LEFT JOIN clientes c ON c.id_cliente = p.id_cliente " .
                "LEFT JOIN usuarios u ON u.id_usuario = rh.id_usuario " .
                "LEFT JOIN (" .
                "SELECT a1.id_registro, a1.motivo_rechazo, a1.fecha_decision " .
                "FROM aprobaciones a1 " .
                "INNER JOIN (SELECT id_registro, MAX(id_aprobacion) AS max_id_aprobacion FROM aprobaciones GROUP BY id_registro) latest " .
                "ON latest.max_id_aprobacion = a1.id_aprobacion" .
                ") ap ON ap.id_registro = rh.id_registro " .
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
                "u.nombre, u.apellidos, st.nombre_tarea, st.id_proyecto, p.nombre_proyecto, p.id_cliente, c.nombre_cliente, " .
                "ap.motivo_rechazo AS motivo_rechazo_admin, ap.fecha_decision AS fecha_decision_admin " .
                "FROM registro_horas rh " .
                "INNER JOIN sub_tareas st ON st.id_subtarea = rh.id_subtarea " .
                "LEFT JOIN proyectos p ON p.id_proyecto = st.id_proyecto " .
                "LEFT JOIN clientes c ON c.id_cliente = p.id_cliente " .
                "LEFT JOIN usuarios u ON u.id_usuario = rh.id_usuario " .
                "LEFT JOIN (" .
                "SELECT a1.id_registro, a1.motivo_rechazo, a1.fecha_decision " .
                "FROM aprobaciones a1 " .
                "INNER JOIN (SELECT id_registro, MAX(id_aprobacion) AS max_id_aprobacion FROM aprobaciones GROUP BY id_registro) latest " .
                "ON latest.max_id_aprobacion = a1.id_aprobacion" .
                ") ap ON ap.id_registro = rh.id_registro " .
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
            // Consulta registros por colaborador para hoja activa e historial.
            $idUsuario = addslashes($idUsuario);
            $vSql = "SELECT rh.id_registro, rh.id_usuario, rh.id_subtarea, rh.fecha, rh.horas, rh.comentarios, rh.estado_aprobacion, rh.fecha_creacion, " .
                "st.nombre_tarea, st.id_proyecto, p.nombre_proyecto, p.id_cliente, c.nombre_cliente, " .
                "ap.motivo_rechazo AS motivo_rechazo_admin, ap.fecha_decision AS fecha_decision_admin " .
                "FROM registro_horas rh " .
                "INNER JOIN sub_tareas st ON st.id_subtarea = rh.id_subtarea " .
                "LEFT JOIN proyectos p ON p.id_proyecto = st.id_proyecto " .
                "LEFT JOIN clientes c ON c.id_cliente = p.id_cliente " .
                "LEFT JOIN (" .
                "SELECT a1.id_registro, a1.motivo_rechazo, a1.fecha_decision " .
                "FROM aprobaciones a1 " .
                "INNER JOIN (SELECT id_registro, MAX(id_aprobacion) AS max_id_aprobacion FROM aprobaciones GROUP BY id_registro) latest " .
                "ON latest.max_id_aprobacion = a1.id_aprobacion" .
                ") ap ON ap.id_registro = rh.id_registro " .
                "WHERE rh.id_usuario = '$idUsuario' " .
                "ORDER BY rh.fecha ASC, rh.id_registro ASC;";

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
            // Procesa los registros semanales: valida, inserta/actualiza y sincroniza periodo.
            $registros = isset($objeto->registros) && is_array($objeto->registros)
                ? $objeto->registros
                : [];
            $allowEmptySync = isset($objeto->allow_empty_sync)
                ? (bool) $objeto->allow_empty_sync
                : false;

            $totalEliminados = 0;
            $errores = [];
            $registrosValidos = [];
            $registrosKeys = [];

            foreach ($registros as $indice => $registro) {
                // Validaciones mínimas por fila de la hoja semanal.
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

                if ($horas > 10) {
                    $errores[] = [
                        'index' => $indice,
                        'message' => 'La cantidad maxima por dia es 10 horas.',
                    ];
                    continue;
                }

                $registrosValidos[] = $registro;
                $registrosKeys[$idSubTarea . '|' . $fecha] = true;
            }

            if (isset($objeto->sync_period) && is_object($objeto->sync_period) && (!empty($registrosValidos) || $allowEmptySync)) {
                // Sincroniza el periodo eliminando ausentes sin historial de aprobación.
                $syncUserId = isset($objeto->sync_period->id_usuario) ? trim($objeto->sync_period->id_usuario) : '';
                $syncFechaInicio = isset($objeto->sync_period->fecha_inicio) ? trim($objeto->sync_period->fecha_inicio) : '';
                $syncFechaFin = isset($objeto->sync_period->fecha_fin) ? trim($objeto->sync_period->fecha_fin) : '';

                if ($syncUserId !== '' && $syncFechaInicio !== '' && $syncFechaFin !== '') {
                    $syncUserId = addslashes($syncUserId);
                    $syncFechaInicio = addslashes($syncFechaInicio);
                    $syncFechaFin = addslashes($syncFechaFin);

                    // Sincroniza el periodo de forma segura: solo elimina registros ausentes sin historial de aprobaciones.
                    $existingSql = "SELECT id_registro, id_subtarea, fecha FROM registro_horas WHERE id_usuario='$syncUserId' AND fecha BETWEEN '$syncFechaInicio' AND '$syncFechaFin';";
                    $existingRows = $this->enlace->executeSQL($existingSql);
                    if (!is_array($existingRows)) {
                        $existingRows = [];
                    }

                    foreach ($existingRows as $existingRow) {
                        $idRegistroExistente = isset($existingRow->id_registro) ? (int) $existingRow->id_registro : 0;
                        $idSubTareaExistente = isset($existingRow->id_subtarea) ? trim($existingRow->id_subtarea) : '';
                        $fechaExistente = isset($existingRow->fecha) ? trim($existingRow->fecha) : '';
                        $registroKey = $idSubTareaExistente . '|' . $fechaExistente;

                        if (isset($registrosKeys[$registroKey])) {
                            continue;
                        }

                        if ($idRegistroExistente > 0 && $this->hasApprovalHistory($idRegistroExistente)) {
                            continue;
                        }

                        $deleteSql = "DELETE FROM registro_horas WHERE id_registro = $idRegistroExistente;";
                        $totalEliminados += (int) $this->enlace->executeSQL_DML($deleteSql);
                    }
                }
            }

            $insertados = [];

            foreach ($registrosValidos as $indice => $registro) {
                try {
                    $insertados[] = $this->createOrReplaceDaily($registro);
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
                'total_eliminados' => $totalEliminados,
                'errores' => $errores,
                'total_errores' => count($errores),
            ];
        } catch (Exception $e) {
            handleException($e);
        }
    }

    private function createOrReplaceDaily($objeto)
    {
        try {
            // Inserta o actualiza un registro diario por usuario/sub tarea/fecha.
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

            $existingSql = "SELECT id_registro, horas, comentarios, estado_aprobacion FROM registro_horas " .
                "WHERE id_usuario='$idUsuario' AND id_subtarea='$idSubTarea' AND fecha='$fecha' LIMIT 1;";
            $existingRows = $this->enlace->executeSQL($existingSql);

            if (!empty($existingRows)) {
                // Si existe, actualiza horas/comentario y ajusta estado según cambios.
                $existing = $existingRows[0];
                $idRegistro = isset($existing->id_registro) ? (int) $existing->id_registro : 0;

                $existingHoras = isset($existing->horas) ? (float) $existing->horas : 0;
                $newHoras = (float) $horas;

                $existingComentarios = isset($existing->comentarios) ? trim((string) $existing->comentarios) : '';
                $newComentariosRaw = isset($objeto->comentarios) && $objeto->comentarios !== null
                    ? trim((string) $objeto->comentarios)
                    : '';

                $hasChanges = abs($existingHoras - $newHoras) > 0.0001 || $existingComentarios !== $newComentariosRaw;
                $estadoActual = isset($existing->estado_aprobacion) && trim((string) $existing->estado_aprobacion) !== ''
                    ? addslashes(trim((string) $existing->estado_aprobacion))
                    : 'Pendiente';
                $estadoAActualizar = $hasChanges ? 'Pendiente' : $estadoActual;

                $updateSql = "UPDATE registro_horas SET horas = $horas, comentarios = $comentarios, estado_aprobacion = '$estadoAActualizar' " .
                    "WHERE id_registro = $idRegistro;";
                $this->enlace->executeSQL_DML($updateSql);

                return $this->get($idRegistro);
            }

            $insertSql = "INSERT INTO registro_horas (id_usuario, id_subtarea, fecha, horas, comentarios, estado_aprobacion) VALUES " .
                "('$idUsuario', '$idSubTarea', '$fecha', $horas, $comentarios, '$estadoAprobacion');";
            $idRegistro = $this->enlace->executeSQL_DML_last($insertSql);

            return $this->get($idRegistro);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    private function hasApprovalHistory($idRegistro)
    {
        // Verifica si un registro ya tiene trazabilidad en aprobaciones.
        $idRegistro = (int) $idRegistro;
        if ($idRegistro <= 0) {
            return false;
        }

        $sql = "SELECT COUNT(*) AS total FROM aprobaciones WHERE id_registro = $idRegistro;";
        $result = $this->enlace->executeSQL($sql);

        if (empty($result)) {
            return false;
        }

        $first = $result[0];
        $total = isset($first->total) ? (int) $first->total : 0;
        return $total > 0;
    }

    public function delete($idRegistro)
    {
        try {
            $idRegistro = (int) $idRegistro;

            if ($idRegistro <= 0) {
                throw new Exception('El id_registro es obligatorio.');
            }

            $existingRows = $this->enlace->executeSQL(
                "SELECT id_registro, estado_aprobacion FROM registro_horas WHERE id_registro = $idRegistro LIMIT 1;"
            );

            if (empty($existingRows)) {
                throw new Exception('El registro indicado no existe.');
            }

            $estadoAprobacion = isset($existingRows[0]->estado_aprobacion)
                ? trim((string) $existingRows[0]->estado_aprobacion)
                : 'Pendiente';

            if ($estadoAprobacion !== 'Pendiente' || $this->hasApprovalHistory($idRegistro)) {
                throw new Exception('No se puede eliminar un registro que ya tiene aprobacion o rechazo.');
            }

            $vSql = "DELETE FROM registro_horas WHERE id_registro = $idRegistro;";
            return $this->enlace->executeSQL_DML($vSql);
        } catch (Exception $e) {
            handleException($e);
        }
    }
}
