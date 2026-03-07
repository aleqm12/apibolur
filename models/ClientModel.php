<?php

class ClientModel
{
    public $enlace;

    public function __construct()
    {
        $this->enlace = new MySqlConnect();
    }

    public function all()
    {
        try {
            $vSql = "SELECT id_cliente, nombre_cliente FROM clientes ORDER BY nombre_cliente ASC;";
            return $this->enlace->executeSQL($vSql);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function get($idCliente)
    {
        try {
            $idCliente = addslashes($idCliente);
            $vSql = "SELECT id_cliente, nombre_cliente FROM clientes WHERE id_cliente='$idCliente';";
            $vResultado = $this->enlace->executeSQL($vSql);

            if (!empty($vResultado)) {
                return $vResultado[0];
            }

            return null;
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function create($idCliente, $nombreCliente)
    {
        try {
            $idCliente = addslashes($idCliente);
            $nombreCliente = addslashes($nombreCliente);

            $vSql = "INSERT INTO clientes (id_cliente, nombre_cliente) VALUES ('$idCliente', '$nombreCliente');";
            $this->enlace->executeSQL_DML($vSql);

            return $this->get($idCliente);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function updateName($idCliente, $nombreCliente)
    {
        try {
            $idCliente = addslashes($idCliente);
            $nombreCliente = addslashes($nombreCliente);

            $vSql = "UPDATE clientes SET nombre_cliente='$nombreCliente' WHERE id_cliente='$idCliente';";
            $this->enlace->executeSQL_DML($vSql);

            return $this->get($idCliente);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function ensureExists($idCliente, $nombreCliente)
    {
        try {
            $client = $this->get($idCliente);
            if ($client) {
                if ($client->nombre_cliente !== $nombreCliente) {
                    return $this->updateName($idCliente, $nombreCliente);
                }
                return $client;
            }

            return $this->create($idCliente, $nombreCliente);
        } catch (Exception $e) {
            handleException($e);
        }
    }
}
