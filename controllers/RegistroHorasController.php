<?php

class registrohoras
{
    public function index()
    {
        try {
            // Lista todos los registros de horas para consulta general.
            $response = new Response();
            $registroHorasM = new RegistroHorasModel();
            $result = $registroHorasM->all();
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function get($id)
    {
        try {
            $response = new Response();
            $registroHorasM = new RegistroHorasModel();
            $result = $registroHorasM->get($id);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function byuser($idUsuario)
    {
        try {
            // Obtiene registros de horas filtrados por colaborador.
            $response = new Response();
            $registroHorasM = new RegistroHorasModel();
            $result = $registroHorasM->getByUser($idUsuario);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function create()
    {
        try {
            // Crea un registro puntual de horas.
            $request = new Request();
            $response = new Response();
            $inputJSON = $request->getJSON();

            $registroHorasM = new RegistroHorasModel();
            $result = $registroHorasM->create($inputJSON);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function createbatch()
    {
        try {
            // Procesa una hoja semanal completa en lote.
            $request = new Request();
            $response = new Response();
            $inputJSON = $request->getJSON();

            $registroHorasM = new RegistroHorasModel();
            $result = $registroHorasM->createBatch($inputJSON);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function delete($id)
    {
        try {
            // Elimina un registro de horas por ID.
            $response = new Response();
            $registroHorasM = new RegistroHorasModel();
            $result = $registroHorasM->delete($id);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }
}
