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

	public function resetPassword($objeto)
	{
		try {
			$targetUserId = isset($objeto->target_user_id) ? addslashes(trim($objeto->target_user_id)) : '';
			$newPassword = isset($objeto->new_password) ? trim((string) $objeto->new_password) : '';
			$adminUserId = isset($objeto->admin_user_id) ? addslashes(trim($objeto->admin_user_id)) : '';

			if ($targetUserId === '' || $newPassword === '' || $adminUserId === '') {
				return false;
			}

			$adminSql = "SELECT id_usuario, id_rol FROM usuarios WHERE id_usuario='$adminUserId' LIMIT 1";
			$adminResult = $this->enlace->ExecuteSQL($adminSql);
			if (empty($adminResult) || (int) $adminResult[0]->id_rol !== 1) {
				return false;
			}

			$targetSql = "SELECT id_usuario FROM usuarios WHERE id_usuario='$targetUserId' LIMIT 1";
			$targetResult = $this->enlace->ExecuteSQL($targetSql);
			if (empty($targetResult)) {
				return false;
			}

			$hashPassword = password_hash($newPassword, PASSWORD_BCRYPT);
			$hashPassword = addslashes($hashPassword);

			$updateSql = "UPDATE usuarios SET password='$hashPassword' WHERE id_usuario='$targetUserId'";
			$this->enlace->executeSQL_DML($updateSql);

			return true;
		} catch (Exception $e) {
			handleException($e);
		}
	}

	public function changeOwnPassword($objeto)
	{
		try {
			$userId = isset($objeto->id_usuario) ? addslashes(trim($objeto->id_usuario)) : '';
			$currentPassword = isset($objeto->current_password) ? (string) $objeto->current_password : '';
			$newPassword = isset($objeto->new_password) ? trim((string) $objeto->new_password) : '';

			if ($userId === '' || $currentPassword === '' || $newPassword === '') {
				return null;
			}

			$userSql = "SELECT id_usuario, password FROM usuarios WHERE id_usuario='$userId' LIMIT 1";
			$userResult = $this->enlace->ExecuteSQL($userSql);
			if (empty($userResult)) {
				return null;
			}

			$storedPassword = isset($userResult[0]->password) ? (string) $userResult[0]->password : '';
			$isPasswordValid = password_verify($currentPassword, $storedPassword) || $currentPassword === $storedPassword;
			if (!$isPasswordValid) {
				return false;
			}

			$hashPassword = password_hash($newPassword, PASSWORD_BCRYPT);
			$hashPassword = addslashes($hashPassword);
			$updateSql = "UPDATE usuarios SET password='$hashPassword' WHERE id_usuario='$userId'";
			$this->enlace->executeSQL_DML($updateSql);

			return true;
		} catch (Exception $e) {
			handleException($e);
		}
	}
}
