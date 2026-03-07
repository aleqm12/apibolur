<?php

class SubTaskModel
{
    public $enlace;

    public function __construct()
    {
        $this->enlace = new MySqlConnect();
    }

    public function all()
    {
        try {
            $vSql = "SELECT id_subtarea, id_proyecto, nombre_tarea FROM sub_tareas ORDER BY id_subtarea DESC;";
            return $this->enlace->executeSQL($vSql);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function get($idSubTarea)
    {
        try {
            $idSubTarea = addslashes($idSubTarea);
            $vSql = "SELECT id_subtarea, id_proyecto, nombre_tarea FROM sub_tareas WHERE id_subtarea='$idSubTarea';";
            $vResultado = $this->enlace->executeSQL($vSql);

            if (!empty($vResultado)) {
                return $vResultado[0];
            }

            return null;
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function getByProject($idProyecto)
    {
        try {
            $idProyecto = addslashes($idProyecto);
            $vSql = "SELECT id_subtarea, id_proyecto, nombre_tarea FROM sub_tareas WHERE id_proyecto='$idProyecto' ORDER BY id_subtarea DESC;";
            return $this->enlace->executeSQL($vSql);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function create($objeto)
    {
        try {
            $idSubTarea = addslashes($objeto->id_subtarea);
            $idProyecto = addslashes($objeto->id_proyecto);
            $nombreTarea = addslashes($objeto->nombre_tarea);

            $vSql = "INSERT INTO sub_tareas (id_subtarea, id_proyecto, nombre_tarea) VALUES ('$idSubTarea', '$idProyecto', '$nombreTarea');";
            $this->enlace->executeSQL_DML($vSql);

            return $this->get($idSubTarea);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function delete($idSubTarea)
    {
        try {
            $idSubTarea = addslashes($idSubTarea);
            $vSql = "DELETE FROM sub_tareas WHERE id_subtarea='$idSubTarea';";
            return $this->enlace->executeSQL_DML($vSql);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function deleteByProject($idProyecto)
    {
        try {
            $idProyecto = addslashes($idProyecto);
            $vSql = "DELETE FROM sub_tareas WHERE id_proyecto='$idProyecto';";
            return $this->enlace->executeSQL_DML($vSql);
        } catch (Exception $e) {
            handleException($e);
        }
    }
}
