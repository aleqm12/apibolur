<?php
// localhost:81/apimovie/user
class user
{
    public function index()
    {
        try {
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

    public function delete($id)
    {
        try {
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
            $request = new Request();
            $response = new Response();
            $inputJSON = $request->getJSON();

            $userM = new UserModel();
            $result = $userM->login($inputJSON);

            if ($result === null) {
                $response->status(401)->toJSON([
                    'status' => 'error',
                    'message' => 'Credenciales invalidas',
                ]);
                return;
            }

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
