<?php

class Response
{
    private $status = 200;

    public function status(int $code)
    {
        $this->status = $code;
        return $this;
    }
    
    public function toJSON($response = [],$message="")
    {
        //Verificar respuesta
        if ($response !== null) {
            $json = $response;
        } else {
            $this->status =400;
            $json = $message !== "" ? $message : "No se efectuo la solicitud";
        }
        //Escribir respuesta JSON con código de estado HTTP
        echo json_encode(
            $json,
            http_response_code($this->status)
        );
    }
}
