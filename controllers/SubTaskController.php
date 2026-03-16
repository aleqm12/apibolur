<?php

class subtask
{
    public function index()
    {
        try {
            $response = new Response();
            $subTaskM = new SubTaskModel();
            $result = $subTaskM->all();
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function get($id)
    {
        try {
            $response = new Response();
            $subTaskM = new SubTaskModel();
            $result = $subTaskM->get($id);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function byproject($idProyecto)
    {
        try {
            // Lista sub tareas asociadas a un proyecto especifico.
            $response = new Response();
            $subTaskM = new SubTaskModel();
            $result = $subTaskM->getByProject($idProyecto);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function create()
    {
        try {
            // Crea una sub tarea para asignacion operativa del proyecto.
            $request = new Request();
            $response = new Response();
            $inputJSON = $request->getJSON();

            $subTaskM = new SubTaskModel();
            $result = $subTaskM->create($inputJSON);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function delete($id)
    {
        try {
            $response = new Response();
            $subTaskM = new SubTaskModel();
            $result = $subTaskM->delete($id);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function deletebyproject($idProyecto)
    {
        try {
            // Borra sub tareas por proyecto para resincronizar en edicion.
            $response = new Response();
            $subTaskM = new SubTaskModel();
            $result = $subTaskM->deleteByProject($idProyecto);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }
}
