import React, { useState } from 'react';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import { useForm, Controller } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ProjectService from '../../services/ProjectService';

export function CreateProject() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const projectSchema = yup.object({
    id_proyecto: yup
      .string()
      .required('El ID del proyecto es requerido')
      .max(20, 'El ID del proyecto debe tener máximo 20 caracteres'),
    nombre_proyecto: yup
      .string()
      .required('El nombre del proyecto es requerido')
      .max(150, 'El nombre del proyecto debe tener máximo 150 caracteres'),
    id_cliente: yup
      .string()
      .required('El ID del cliente es requerido')
      .max(20, 'El ID del cliente debe tener máximo 20 caracteres'),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      id_proyecto: '',
      nombre_proyecto: '',
      id_cliente: '',
    },
    resolver: yupResolver(projectSchema),
  });

  const onError = (formErrors, event) => console.log(formErrors, event);

  const onSubmit = (dataForm) => {
    try {
      ProjectService.createProject(dataForm)
        .then((response) => {
          setError(response.error);
          if (response.data != null) {
            toast.success(
              `Proyecto creado #${response.data.id_proyecto} - ${response.data.nombre_proyecto}`,
              {
                duration: 4000,
                position: 'top-center',
              }
            );
            return navigate('/');
          }
        })
        .catch((serviceError) => {
          if (serviceError instanceof SyntaxError) {
            console.log(serviceError);
            setError(serviceError);
            throw new Error('Respuesta no válida del servidor');
          }
          setError(serviceError);
          toast.error('No se pudo crear el proyecto');
        });
    } catch (submitError) {
      console.error(submitError);
    }
  };

  if (error && error.message) return <p>Error: {error.message}</p>;

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit, onError)} noValidate>
        <Grid container spacing={1}>
          <Grid size={12}>
            <Typography variant="h5" gutterBottom>
              Crear Proyecto
            </Typography>
          </Grid>

          <Grid size={12} sm={4}>
            <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
              <Controller
                name="id_proyecto"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    id="id_proyecto"
                    label="ID Proyecto"
                    error={Boolean(errors.id_proyecto)}
                    helperText={errors.id_proyecto ? errors.id_proyecto.message : ' '}
                  />
                )}
              />
            </FormControl>
          </Grid>

          <Grid size={12} sm={4}>
            <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
              <Controller
                name="nombre_proyecto"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    id="nombre_proyecto"
                    label="Nombre del Proyecto"
                    error={Boolean(errors.nombre_proyecto)}
                    helperText={errors.nombre_proyecto ? errors.nombre_proyecto.message : ' '}
                  />
                )}
              />
            </FormControl>
          </Grid>

          <Grid size={12} sm={4}>
            <FormControl variant="standard" fullWidth sx={{ m: 1 }}>
              <Controller
                name="id_cliente"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    id="id_cliente"
                    label="ID Cliente"
                    error={Boolean(errors.id_cliente)}
                    helperText={errors.id_cliente ? errors.id_cliente.message : ' '}
                  />
                )}
              />
            </FormControl>
          </Grid>

          <Grid size={12} sx={{ m: 1 }}>
            <Button type="submit" variant="contained" color="primary" sx={{ mr: 2 }}>
              Guardar
            </Button>
            <Button variant="outlined" color="secondary" onClick={() => navigate('/')}>
              Cancelar
            </Button>
          </Grid>
        </Grid>
      </form>
    </>
  );
}
