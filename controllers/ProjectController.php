<?php

class project
{
    public function index()
    {
        try {
            // Lista todos los proyectos para consulta en el panel.
            $response = new Response();
            $projectM = new ProjectModel();
            $result = $projectM->all();
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function get($id)
    {
        try {
            // Obtiene un proyecto puntual por su ID.
            $response = new Response();
            $projectM = new ProjectModel();
            $result = $projectM->get($id);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function create()
    {
        try {
            // Crea un nuevo proyecto con datos enviados desde frontend.
            $request = new Request();
            $response = new Response();
            $inputJSON = $request->getJSON();

            $projectM = new ProjectModel();
            $result = $projectM->create($inputJSON);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function update()
    {
        try {
            // Actualiza los datos de un proyecto existente.
            $request = new Request();
            $response = new Response();
            $inputJSON = $request->getJSON();

            $projectM = new ProjectModel();
            $result = $projectM->update($inputJSON);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function delete($id)
    {
        try {
            // Elimina un proyecto por identificador.
            $response = new Response();
            $projectM = new ProjectModel();
            $result = $projectM->delete($id);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }
}
