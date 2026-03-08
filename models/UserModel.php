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
			$vSql = "SELECT u.id_usuario, u.nombre, u.apellidos, u.genero, u.id_rol, r.nombre_rol, u.nivel " .
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
			$vSql = "SELECT u.id_usuario, u.nombre, u.apellidos, u.genero, u.id_rol, r.nombre_rol, u.nivel " .
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
			$idUsuario = isset($objeto->id_usuario) ? addslashes(trim($objeto->id_usuario)) : '';
			$password = isset($objeto->password) ? (string) $objeto->password : '';

			if ($idUsuario === '' || $password === '') {
				return null;
			}

			$vSql = "SELECT u.id_usuario, u.nombre, u.apellidos, u.genero, u.id_rol, r.nombre_rol, u.nivel, u.password " .
				"FROM usuarios u " .
				"LEFT JOIN roles r ON r.id_rol=u.id_rol " .
				"WHERE u.id_usuario='$idUsuario' LIMIT 1;";

			$vResultado = $this->enlace->ExecuteSQL($vSql);
			if (empty($vResultado)) {
				return null;
			}

			$user = $vResultado[0];
			$storedPassword = isset($user->password) ? (string) $user->password : '';

			// Soporta hashes bcrypt y, solo por compatibilidad, contrasena en texto plano.
			$isPasswordValid = password_verify($password, $storedPassword) || $password === $storedPassword;
			if (!$isPasswordValid) {
				return null;
			}

			$tokenPayload = [
				'iat' => time(),
				'exp' => time() + (60 * 60 * 8),
				'data' => [
					'id_usuario' => $user->id_usuario,
					'id_rol' => $user->id_rol,
				],
			];

			$token = JWT::encode($tokenPayload, Config::get('SECRET_KEY'), 'HS256');

			return [
				'token' => $token,
				'user' => [
					'id_usuario' => $user->id_usuario,
					'nombre' => $user->nombre,
					'apellidos' => $user->apellidos,
					'genero' => $user->genero,
					'id_rol' => (int) $user->id_rol,
					'nombre_rol' => $user->nombre_rol,
					'nivel' => $user->nivel,
				],
			];
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
			$genero = addslashes($objeto->genero);
			$idRol = (int) $objeto->id_rol;
			$nivel = addslashes($objeto->nivel);
			$hashPassword = password_hash($objeto->password, PASSWORD_BCRYPT);

			$vSql = "INSERT INTO usuarios (id_usuario, nombre, apellidos, genero, id_rol, nivel, password) " .
				"VALUES ('$idUsuario', '$nombre', '$apellidos', '$genero', $idRol, '$nivel', '$hashPassword')";

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
			$genero = addslashes($objeto->genero);
			$idRol = (int) $objeto->id_rol;
			$nivel = addslashes($objeto->nivel);

			$vSql = "UPDATE usuarios SET " .
				"nombre='$nombre', " .
				"apellidos='$apellidos', " .
				"genero='$genero', " .
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
