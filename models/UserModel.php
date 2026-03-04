<?php

use Firebase\JWT\JWT;

class UserModel
{
	public $enlace;
	public function __construct()
	{

		$this->enlace = new MySqlConnect();
	}
	public function all()
	{
		try {
			//Consulta sql
			$vSql = "SELECT id_usuario, nombre, id_rol, nivel FROM usuarios;";

			//Ejecutar la consulta
			$vResultado = $this->enlace->ExecuteSQL($vSql);

			// Retornar el objeto
			return $vResultado;
		} catch (Exception $e) {
			die($e->getMessage());
		}
	}

	public function get($id)
	{
		try {
			//Consulta sql
			$vSql = "SELECT id_usuario, nombre, id_rol, nivel FROM usuarios where id_usuario='$id'";
			//Ejecutar la consulta
			$vResultado = $this->enlace->ExecuteSQL($vSql);
			if ($vResultado) {
				$vResultado = $vResultado[0];
				// Retornar el objeto
				return $vResultado;
			} else {
				return null;
			}
		} catch (Exception $e) {
			die($e->getMessage());
		}
	}
	public function allCustomer()
	{
		try {
			//Consulta sql
			$vSql = "SELECT * FROM movie_rental.user
					where rol_id=2;";

			//Ejecutar la consulta
			$vResultado = $this->enlace->ExecuteSQL($vSql);

			// Retornar el objeto
			return $vResultado;
		} catch (Exception $e) {
			die($e->getMessage());
		}
	}
	public function customerbyShopRental($idShopRental)
	{
		try {
			//Consulta sql
			$vSql = "SELECT * FROM movie_rental.user
					where rol_id=2 and shop_id=$idShopRental;";

			//Ejecutar la consulta
			$vResultado = $this->enlace->ExecuteSQL($vSql);

			// Retornar el objeto
			return $vResultado;
		} catch (Exception $e) {
			die($e->getMessage());
		}
	}
	public function login($objeto)
	{
		try {

		} catch (Exception $e) {
			handleException($e);
		}
	}
	public function create($objeto)
	{
		try {
			$idUsuario = addslashes($objeto->id_usuario);
			$nombre = addslashes($objeto->nombre);
			$idRol = addslashes($objeto->id_rol);
			$nivel = addslashes($objeto->nivel);
			$hashPassword = password_hash($objeto->password, PASSWORD_BCRYPT);

			$vSql = "INSERT INTO usuarios (id_usuario, nombre, id_rol, nivel, password) " .
				"VALUES ('$idUsuario', '$nombre', '$idRol', '$nivel', '$hashPassword')";

			$this->enlace->executeSQL_DML($vSql);

			return $this->get($idUsuario);
		} catch (Exception $e) {
			handleException($e);
		}
	}
}
