<?php

class aprobaciones
{
    public function index()
    {
        try {
            $response = new Response();
            $aprobacionM = new AprobacionModel();

            $filters = [
                'estado' => isset($_GET['estado']) ? $_GET['estado'] : 'Pendiente',
                'id_usuario' => isset($_GET['id_usuario']) ? $_GET['id_usuario'] : '',
                'id_proyecto' => isset($_GET['id_proyecto']) ? $_GET['id_proyecto'] : '',
            ];

            $result = $aprobacionM->all($filters);
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

            $aprobacionM = new AprobacionModel();
            $result = $aprobacionM->create($inputJSON);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function historial()
    {
        try {
            $response = new Response();
            $aprobacionM = new AprobacionModel();

            $filters = [
                'id_usuario' => isset($_GET['id_usuario']) ? $_GET['id_usuario'] : '',
                'estado_resultante' => isset($_GET['estado_resultante']) ? $_GET['estado_resultante'] : '',
                'id_proyecto' => isset($_GET['id_proyecto']) ? $_GET['id_proyecto'] : '',
                'fecha_desde' => isset($_GET['fecha_desde']) ? $_GET['fecha_desde'] : '',
                'fecha_hasta' => isset($_GET['fecha_hasta']) ? $_GET['fecha_hasta'] : '',
            ];

            $result = $aprobacionM->historial($filters);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function update()
    {
        try {
            $request = new Request();
            $response = new Response();
            $inputJSON = $request->getJSON();

            $aprobacionM = new AprobacionModel();
            $result = $aprobacionM->update($inputJSON);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }
}
