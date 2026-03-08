<?php

class registrohoras
{
    public function index()
    {
        try {
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
            $response = new Response();
            $registroHorasM = new RegistroHorasModel();
            $result = $registroHorasM->delete($id);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }
}
