<?php

class ProjectModel
{
    public $enlace;

    public function __construct()
    {
        $this->enlace = new MySqlConnect();
    }

    public function all()
    {
        try {
            // Consulta proyectos con su cliente para seguimiento general.
            $vSql = "SELECT p.id_proyecto, p.nombre_proyecto, p.id_cliente, c.nombre_cliente " .
                "FROM proyectos p " .
                "INNER JOIN clientes c ON c.id_cliente = p.id_cliente " .
                "ORDER BY p.id_proyecto DESC;";
            $vResultado = $this->enlace->executeSQL($vSql);

            $subTaskModel = new SubTaskModel();
            if (!empty($vResultado) && is_array($vResultado)) {
                // Adjunta sub tareas para entregar estructura completa por proyecto.
                foreach ($vResultado as $projectItem) {
                    $projectItem->sub_tareas = $subTaskModel->getByProject($projectItem->id_proyecto);
                }
            }

            return $vResultado;
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function get($idProyecto)
    {
        try {
            // Consulta un proyecto por ID con sus sub tareas.
            $idProyecto = addslashes($idProyecto);
            $vSql = "SELECT p.id_proyecto, p.nombre_proyecto, p.id_cliente, c.nombre_cliente " .
                "FROM proyectos p " .
                "INNER JOIN clientes c ON c.id_cliente = p.id_cliente " .
                "WHERE p.id_proyecto='$idProyecto';";
            $vResultado = $this->enlace->executeSQL($vSql);

            if (!empty($vResultado)) {
                $project = $vResultado[0];
                $subTaskModel = new SubTaskModel();
                $project->sub_tareas = $subTaskModel->getByProject($project->id_proyecto);
                return $project;
            }

            return null;
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function create($objeto)
    {
        try {
            // Crea proyecto y garantiza que el cliente exista en catalogo.
            $idProyecto = addslashes($objeto->id_proyecto);
            $nombreProyecto = addslashes($objeto->nombre_proyecto);
            $idCliente = addslashes($objeto->id_cliente);
            $nombreCliente = addslashes($objeto->nombre_cliente);

            $clientModel = new ClientModel();
            $clientModel->ensureExists($idCliente, $nombreCliente);

            $vSql = "INSERT INTO proyectos (id_proyecto, nombre_proyecto, id_cliente) VALUES ('$idProyecto', '$nombreProyecto', '$idCliente');";
            $this->enlace->executeSQL_DML($vSql);

            return $this->get($idProyecto);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function update($objeto)
    {
        try {
            // Actualiza proyecto y permite cambio de ID conservando referencia original.
            $idProyecto = addslashes($objeto->id_proyecto);
            $idProyectoOriginal = isset($objeto->id_proyecto_original) && !empty($objeto->id_proyecto_original)
                ? addslashes($objeto->id_proyecto_original)
                : $idProyecto;
            $nombreProyecto = addslashes($objeto->nombre_proyecto);
            $idCliente = addslashes($objeto->id_cliente);
            $nombreCliente = addslashes($objeto->nombre_cliente);

            $clientModel = new ClientModel();
            $clientModel->ensureExists($idCliente, $nombreCliente);

            $vSql = "UPDATE proyectos SET " .
                "id_proyecto='$idProyecto', " .
                "nombre_proyecto='$nombreProyecto', " .
                "id_cliente='$idCliente' " .
                "WHERE id_proyecto='$idProyectoOriginal';";
            $this->enlace->executeSQL_DML($vSql);

            return $this->get($idProyecto);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function delete($idProyecto)
    {
        try {
            // Elimina proyecto por ID.
            $idProyecto = addslashes($idProyecto);
            $vSql = "DELETE FROM proyectos WHERE id_proyecto='$idProyecto';";
            return $this->enlace->executeSQL_DML($vSql);
        } catch (Exception $e) {
            handleException($e);
        }
    }
}
