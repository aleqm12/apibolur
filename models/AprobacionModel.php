<?php

class AprobacionModel
{
    public $enlace;

    public function __construct()
    {
        $this->enlace = new MySqlConnect();
    }

    public function all($filters = [])
    {
        try {
            $estado = isset($filters['estado']) ? trim($filters['estado']) : 'Pendiente';
            $idUsuario = isset($filters['id_usuario']) ? trim($filters['id_usuario']) : '';
            $idProyecto = isset($filters['id_proyecto']) ? trim($filters['id_proyecto']) : '';

            $where = [];

            if ($estado !== '' && strtolower($estado) !== 'todos') {
                $estado = addslashes($estado);
                $where[] = "rh.estado_aprobacion = '$estado'";
            }

            if ($idUsuario !== '') {
                $idUsuario = addslashes($idUsuario);
                $where[] = "rh.id_usuario = '$idUsuario'";
            }

            if ($idProyecto !== '') {
                $idProyecto = addslashes($idProyecto);
                $where[] = "st.id_proyecto = '$idProyecto'";
            }

            $whereSql = '';
            if (!empty($where)) {
                $whereSql = ' WHERE ' . implode(' AND ', $where);
            }

            $vSql = "SELECT rh.id_registro, rh.id_usuario, rh.id_subtarea, rh.fecha, rh.horas, rh.comentarios, rh.estado_aprobacion, " .
                "u.nombre, u.apellidos, st.nombre_tarea, st.id_proyecto, p.nombre_proyecto, " .
                "(SELECT COUNT(*) FROM aprobaciones WHERE id_registro = rh.id_registro) AS numero_revisiones " .
                "FROM registro_horas rh " .
                "INNER JOIN sub_tareas st ON st.id_subtarea = rh.id_subtarea " .
                "LEFT JOIN proyectos p ON p.id_proyecto = st.id_proyecto " .
                "LEFT JOIN usuarios u ON u.id_usuario = rh.id_usuario " .
                $whereSql .
                " ORDER BY rh.fecha DESC, rh.id_registro DESC;";

            return $this->enlace->executeSQL($vSql);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function create($objeto)
    {
        try {
            $idUsuarioDecision = isset($objeto->id_usuario) && trim($objeto->id_usuario) !== ''
                ? addslashes(trim($objeto->id_usuario))
                : 'ADMIN';

            $decisiones = [];
            if (isset($objeto->decisiones) && is_array($objeto->decisiones)) {
                $decisiones = $objeto->decisiones;
            } elseif (isset($objeto->id_registro) && isset($objeto->estado_resultante)) {
                $decisiones[] = (object) [
                    'id_registro' => $objeto->id_registro,
                    'estado_resultante' => $objeto->estado_resultante,
                    'motivo_rechazo' => isset($objeto->motivo_rechazo) ? $objeto->motivo_rechazo : null,
                ];
            }

            if (empty($decisiones)) {
                throw new Exception('No se recibieron decisiones para procesar.');
            }

            $aprobacionesRegistradas = [];
            $errores = [];

            foreach ($decisiones as $decision) {
                $idRegistro = isset($decision->id_registro) ? (int) $decision->id_registro : 0;
                $estadoResultante = isset($decision->estado_resultante)
                    ? trim($decision->estado_resultante)
                    : '';

                if ($idRegistro <= 0) {
                    $errores[] = [
                        'id_registro' => $idRegistro,
                        'message' => 'El id_registro es obligatorio.',
                    ];
                    continue;
                }

                if ($estadoResultante !== 'Aprobado' && $estadoResultante !== 'Rechazado') {
                    $errores[] = [
                        'id_registro' => $idRegistro,
                        'message' => 'El estado_resultante debe ser Aprobado o Rechazado.',
                    ];
                    continue;
                }

                $motivoRechazo = isset($decision->motivo_rechazo) ? trim((string) $decision->motivo_rechazo) : '';
                if ($estadoResultante === 'Rechazado' && $motivoRechazo === '') {
                    $errores[] = [
                        'id_registro' => $idRegistro,
                        'message' => 'El motivo de rechazo es obligatorio cuando el estado es Rechazado.',
                    ];
                    continue;
                }

                $motivoRechazoSql = $motivoRechazo !== ''
                    ? "'" . addslashes($motivoRechazo) . "'"
                    : 'NULL';

                $estadoResultanteSql = addslashes($estadoResultante);

                $insertSql = "INSERT INTO aprobaciones (id_registro, id_usuario, estado_resultante, motivo_rechazo) VALUES " .
                    "($idRegistro, '$idUsuarioDecision', '$estadoResultanteSql', $motivoRechazoSql);";
                $idAprobacion = $this->enlace->executeSQL_DML_last($insertSql);

                $updateRegistroSql = "UPDATE registro_horas SET estado_aprobacion = '$estadoResultanteSql' WHERE id_registro = $idRegistro;";
                $this->enlace->executeSQL_DML($updateRegistroSql);

                $aprobacionesRegistradas[] = [
                    'id_aprobacion' => $idAprobacion,
                    'id_registro' => $idRegistro,
                    'estado_resultante' => $estadoResultante,
                    'motivo_rechazo' => $motivoRechazo,
                ];
            }

            return [
                'aprobaciones' => $aprobacionesRegistradas,
                'total_aprobaciones' => count($aprobacionesRegistradas),
                'errores' => $errores,
                'total_errores' => count($errores),
            ];
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function historial($filters = [])
    {
        try {
            $idUsuarioDecision = isset($filters['id_usuario']) ? trim($filters['id_usuario']) : '';
            $estadoResultante = isset($filters['estado_resultante']) ? trim($filters['estado_resultante']) : '';
            $idProyecto = isset($filters['id_proyecto']) ? trim($filters['id_proyecto']) : '';
            $fechaDesde = isset($filters['fecha_desde']) ? trim($filters['fecha_desde']) : '';
            $fechaHasta = isset($filters['fecha_hasta']) ? trim($filters['fecha_hasta']) : '';

            $where = [];

            if ($idUsuarioDecision !== '') {
                $idUsuarioDecision = addslashes($idUsuarioDecision);
                $where[] = "a.id_usuario = '$idUsuarioDecision'";
            }

            if ($estadoResultante !== '' && strtolower($estadoResultante) !== 'todos') {
                $estadoResultante = addslashes($estadoResultante);
                $where[] = "a.estado_resultante = '$estadoResultante'";
            }

            if ($idProyecto !== '') {
                $idProyecto = addslashes($idProyecto);
                $where[] = "st.id_proyecto = '$idProyecto'";
            }

            if ($fechaDesde !== '') {
                $fechaDesde = addslashes($fechaDesde);
                $where[] = "DATE(a.fecha_decision) >= '$fechaDesde'";
            }

            if ($fechaHasta !== '') {
                $fechaHasta = addslashes($fechaHasta);
                $where[] = "DATE(a.fecha_decision) <= '$fechaHasta'";
            }

            $whereSql = '';
            if (!empty($where)) {
                $whereSql = ' WHERE ' . implode(' AND ', $where);
            }

            $vSql = "SELECT a.id_aprobacion, a.id_registro, a.id_usuario AS id_usuario_decisor, a.estado_resultante, a.motivo_rechazo, a.fecha_decision, " .
                "rh.id_usuario AS id_usuario_colaborador, rh.fecha, rh.horas, rh.comentarios, " .
                "u.nombre, u.apellidos, st.id_proyecto, st.nombre_tarea, p.nombre_proyecto, " .
                "ud.nombre AS nombre_decisor, ud.apellidos AS apellidos_decisor " .
                "FROM aprobaciones a " .
                "INNER JOIN registro_horas rh ON rh.id_registro = a.id_registro " .
                "INNER JOIN sub_tareas st ON st.id_subtarea = rh.id_subtarea " .
                "LEFT JOIN proyectos p ON p.id_proyecto = st.id_proyecto " .
                "LEFT JOIN usuarios u ON u.id_usuario = rh.id_usuario " .
                "LEFT JOIN usuarios ud ON ud.id_usuario = a.id_usuario " .
                $whereSql .
                " ORDER BY a.fecha_decision DESC, a.id_aprobacion DESC;";

            return $this->enlace->executeSQL($vSql);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function update($objeto)
    {
        try {
            $idAprobacion = isset($objeto->id_aprobacion) ? (int) $objeto->id_aprobacion : 0;
            if ($idAprobacion <= 0) {
                throw new Exception('El id_aprobacion es obligatorio.');
            }

            $aprobacionActual = $this->enlace->executeSQL(
                "SELECT id_aprobacion, estado_resultante, motivo_rechazo FROM aprobaciones WHERE id_aprobacion = $idAprobacion LIMIT 1;"
            );

            if (empty($aprobacionActual)) {
                throw new Exception('No se encontró la aprobación indicada.');
            }

            $registroActual = $aprobacionActual[0];
            $estadoResultante = isset($registroActual->estado_resultante) ? trim((string) $registroActual->estado_resultante) : '';
            $motivoRechazo = isset($objeto->motivo_rechazo) ? trim((string) $objeto->motivo_rechazo) : '';

            if ($estadoResultante === 'Rechazado' && $motivoRechazo === '') {
                throw new Exception('El motivo de rechazo no puede quedar vacío.');
            }

            $motivoRechazoSql = $motivoRechazo !== ''
                ? "'" . addslashes($motivoRechazo) . "'"
                : 'NULL';

            $updateSql = "UPDATE aprobaciones SET motivo_rechazo = $motivoRechazoSql WHERE id_aprobacion = $idAprobacion;";
            $this->enlace->executeSQL_DML($updateSql);

            $updatedRows = $this->enlace->executeSQL(
                "SELECT id_aprobacion, id_registro, id_usuario, estado_resultante, motivo_rechazo, fecha_decision FROM aprobaciones WHERE id_aprobacion = $idAprobacion LIMIT 1;"
            );

            return !empty($updatedRows) ? $updatedRows[0] : null;
        } catch (Exception $e) {
            handleException($e);
        }
    }
}
