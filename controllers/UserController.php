<?php
// localhost:81/apimovie/user
class user
{
    public function index()
    {
        try {
            // Devuelve la lista general de colaboradores.
            $response = new Response();
            $userM = new UserModel();
            $result = $userM->all();
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function get($id)
    {
        try {
            // Devuelve el detalle de un colaborador por su ID.
            $response = new Response();
            $userM = new UserModel();
            $result = $userM->get($id);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function create()
    {
        try {
            // Recibe datos del colaborador y ejecuta el registro.
            $request = new Request();
            $response = new Response();
            $inputJSON = $request->getJSON();

            $userM = new UserModel();
            $result = $userM->create($inputJSON);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function update()
    {
        try {
            // Recibe datos editados del colaborador y ejecuta la actualización.
            $request = new Request();
            $response = new Response();
            $inputJSON = $request->getJSON();

            $userM = new UserModel();
            $result = $userM->update($inputJSON);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function delete($id = null)
    {
        try {
            // Elimina un colaborador por su identificador.
            $response = new Response();
            $userM = new UserModel();
            $result = $userM->delete($id);
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function login()
    {
        try {
            // Obtiene el cuerpo JSON con las credenciales enviadas por el cliente.
            $request = new Request();
            $response = new Response();
            $inputJSON = $request->getJSON();

            // Delega la validación y generación del token al modelo.
            $userM = new UserModel();
            $result = $userM->login($inputJSON);

            if (is_array($result) && isset($result['error_code'])) {
                if ($result['error_code'] === 'USER_NOT_FOUND') {
                    $response->status(404)->toJSON([
                        'status' => 'error',
                        'message' => 'El usuario no está registrado.',
                    ]);
                    return;
                }

                if ($result['error_code'] === 'MISSING_CREDENTIALS') {
                    $response->status(400)->toJSON([
                        'status' => 'error',
                        'message' => 'Debe ingresar usuario y contraseña.',
                    ]);
                    return;
                }

                $response->status(401)->toJSON([
                    'status' => 'error',
                    'message' => 'Credenciales inválidas',
                ]);
                return;
            }

            // Login exitoso: retorna el token y la información básica del usuario.
            $response->toJSON($result);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function resetpassword()
    {
        try {
            $request = new Request();
            $response = new Response();
            $inputJSON = $request->getJSON();

            $userM = new UserModel();
            $result = $userM->resetPassword($inputJSON);

            if (!$result) {
                $response->status(400)->toJSON([
                    'status' => 'error',
                    'message' => 'No fue posible restablecer la contrasena.',
                ]);
                return;
            }

            $response->toJSON([
                'status' => 'ok',
                'message' => 'Contrasena restablecida correctamente.',
            ]);
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function changepassword()
    {
        try {
            $request = new Request();
            $response = new Response();
            $inputJSON = $request->getJSON();

            $userM = new UserModel();
            $result = $userM->changeOwnPassword($inputJSON);

            if ($result === null) {
                $response->status(400)->toJSON([
                    'status' => 'error',
                    'message' => 'No fue posible cambiar la contrasena.',
                ]);
                return;
            }

            if ($result === false) {
                $response->status(401)->toJSON([
                    'status' => 'error',
                    'message' => 'Contrasena actual invalida.',
                ]);
                return;
            }

            $response->toJSON([
                'status' => 'ok',
                'message' => 'Contrasena actualizada correctamente.',
            ]);
        } catch (Exception $e) {
            handleException($e);
        }
    }
}
