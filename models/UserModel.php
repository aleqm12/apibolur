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
			$vSql = "SELECT u.id_usuario, u.nombre, u.apellidos, u.id_rol, r.nombre_rol, u.nivel " .
				"FROM usuarios u LEFT JOIN roles r ON r.id_rol=u.id_rol;";

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
			$vSql = "SELECT u.id_usuario, u.nombre, u.apellidos, u.id_rol, r.nombre_rol, u.nivel " .
				"FROM usuarios u LEFT JOIN roles r ON r.id_rol=u.id_rol " .
				"WHERE u.id_usuario='$id'";
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
			$apellidos = addslashes($objeto->apellidos);
			$idRol = (int) $objeto->id_rol;
			$nivel = addslashes($objeto->nivel);
			$hashPassword = password_hash($objeto->password, PASSWORD_BCRYPT);

			$vSql = "INSERT INTO usuarios (id_usuario, nombre, apellidos, id_rol, nivel, password) " .
				"VALUES ('$idUsuario', '$nombre', '$apellidos', $idRol, '$nivel', '$hashPassword')";

			$this->enlace->executeSQL_DML($vSql);

			return $this->get($idUsuario);
		} catch (Exception $e) {
			handleException($e);
		}
	}

	public function update($objeto)
	{
		try {
			$idUsuario = addslashes($objeto->id_usuario);
			$nombre = addslashes($objeto->nombre);
			$apellidos = addslashes($objeto->apellidos);
			$idRol = (int) $objeto->id_rol;
			$nivel = addslashes($objeto->nivel);

			$vSql = "UPDATE usuarios SET " .
				"nombre='$nombre', " .
				"apellidos='$apellidos', " .
				"id_rol=$idRol, " .
				"nivel='$nivel'";

			if (isset($objeto->password) && !empty($objeto->password)) {
				$hashPassword = password_hash($objeto->password, PASSWORD_BCRYPT);
				$vSql .= ", password='$hashPassword'";
			}

			$vSql .= " WHERE id_usuario='$idUsuario'";

			$this->enlace->executeSQL_DML($vSql);

			return $this->get($idUsuario);
		} catch (Exception $e) {
			handleException($e);
		}
	}

	public function delete($id)
	{
		try {
			$idUsuario = addslashes($id);
			$vSql = "DELETE FROM usuarios WHERE id_usuario='$idUsuario'";
			return $this->enlace->executeSQL_DML($vSql);
		} catch (Exception $e) {
			handleException($e);
		}
	}
}
