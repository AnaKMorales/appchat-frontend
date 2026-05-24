import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import GroupsIcon from '@mui/icons-material/Groups';

import {
  getComunidades,
  crearComunidad,
} from '../services/api';

const COLORES = [
  '#2563EB',
  '#7C3AED',
  '#059669',
  '#DC2626',
  '#D97706',
  '#DB2777',
];

function colorPorNombre(nombre) {
  let hash = 0;

  for (let i = 0; i < nombre.length; i++) {
    hash += nombre.charCodeAt(i);
  }

  return COLORES[hash % COLORES.length];
}

export default function PantallaComunidades({
  token,
  usuarioActual,
  onEntrarComunidad,
  refresh,
}) {
  const [comunidades, setComunidades] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [dialogCrear, setDialogCrear] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    fotoUrl: '',
  });

  useEffect(() => {
    cargarComunidades();
  }, [token, refresh]);

  const cargarComunidades = () => {
    setCargando(true);

    getComunidades(token)
      .then(setComunidades)
      .catch(() => {})
      .finally(() => setCargando(false));
  };

  const handleCrear = () => {
    crearComunidad(
      {
        nombre: form.nombre,
        descripcion: form.descripcion,
        fotoUrl: form.fotoUrl || null,
      },
      token
    )
      .then(() => {
        setDialogCrear(false);

        setForm({
          nombre: '',
          descripcion: '',
          fotoUrl: '',
        });

        cargarComunidades();
      })
      .catch(() => {});
  };

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: '100vh',

        bgcolor: '#F4F7FB',

        display: 'flex',
        flexDirection: 'column',
      }}
    >

      {/* HEADER */}
      <Box
        sx={{
          px: 6,
          pt: 5,
          pb: 3,
        }}
      >
        <Typography
          variant="h4"
          fontWeight={800}
          color="#0F172A"
          letterSpacing={-1}
        >
          Tus comunidades
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: '#64748B',
            mt: 0.7,
            fontSize: 15,
          }}
        >
          Unite a una comunidad o creá la tuya para comenzar.
        </Typography>
      </Box>

      {/* GRID */}
      <Box
        sx={{
          px: 6,
          pb: 6,
          flex: 1,
        }}
      >
        {cargando ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: 10,
            }}
          >
            <CircularProgress sx={{ color: '#2563EB' }} />
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',

              gridTemplateColumns:
                'repeat(auto-fill, minmax(250px, 1fr))',

              gap: 3,
            }}
          >

            {/* CARDS */}
            {comunidades.map(c => {
              const color = colorPorNombre(c.nombre);

              return (
                <Box
                  key={c.id}
                  onClick={() => onEntrarComunidad(c)}
                  sx={{
                    position: 'relative',

                    p: 3,

                    borderRadius: 1,

                    cursor: 'pointer',

                    background: 'rgba(255,255,255,0.72)',

                    backdropFilter: 'blur(18px)',

                    border: '1px solid rgba(255,255,255,0.9)',

                    boxShadow:
                      '0 10px 35px rgba(15,23,42,0.06)',

                    transition: 'all .22s ease',

                    '&:hover': {
                      transform: 'translateY(-4px)',

                      boxShadow:
                        '0 18px 45px rgba(37,99,235,0.14)',

                      borderColor:
                        'rgba(37,99,235,0.22)',
                    },
                  }}
                >
                  <Avatar
                    sx={{
                    width: 58,
                    height: 58,

                    mb: 2.2,

                    borderRadius: '50%',

                    bgcolor: '#2563EB',

                    fontSize: 24,
                    fontWeight: 800,

                    boxShadow:
                    '0 8px 20px rgba(37,99,235,0.25)',
                }}
                >
                {c.fotoUrl ? (
                    <img
                    src={c.fotoUrl}
                    alt={c.nombre}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    }}
                    />
                ) : (
                    c.nombre[0].toUpperCase()
                )}
                </Avatar>

                  <Typography
                    fontWeight={800}
                    fontSize={17}
                    color="#0F172A"
                    noWrap
                  >
                    {c.nombre}
                  </Typography>

                  <Typography
                    sx={{
                      color: '#64748B',
                      fontSize: 13,
                      mt: 0.7,
                      mb: 2.5,
                    }}
                  >
                    {c.descripcion || 'Sin descripción'}
                  </Typography>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.8,
                    }}
                  >
                    <GroupsIcon
                      sx={{
                        fontSize: 16,
                        color: '#94A3B8',
                      }}
                    />

                    <Typography
                      fontSize={12}
                      fontWeight={600}
                      color="#64748B"
                    >
                      {c.cantidadMiembros ?? '?'} miembros
                    </Typography>
                  </Box>
                </Box>
              );
            })}

            {/* CREAR NUEVA */}
            <Box
            onClick={() => setDialogCrear(true)}
            sx={{
                minHeight: 220,

                borderRadius: 1,

                cursor: 'pointer',

                background: 'rgba(255,255,255,0.65)',

                backdropFilter: 'blur(18px)',

                border: '2px dashed #2563EB',

                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',

                gap: 1.5,

                transition: 'all .22s ease',

                '&:hover': {
                background: 'rgba(255,255,255,0.9)',

                transform: 'translateY(-4px)',

                boxShadow:
                    '0 16px 40px rgba(37,99,235,0.12)',
                },
            }}
            >
              <Box
                sx={{
                    width: 62,
                    height: 62,

                    borderRadius: '50%',

                    bgcolor: '#2563EB',

                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',

                    boxShadow:
                    '0 10px 25px rgba(37,99,235,0.22)',
                }}
                >
                <AddIcon
                  sx={{
                    color: 'white',
                    fontSize: 30,
                  }}
                />
              </Box>

              <Typography
                fontSize={15}
                fontWeight={700}
                color="#2563EB"
              >
                Crear nueva comunidad
              </Typography>

              <Typography
                fontSize={12}
                color="#94A3B8"
              >
                Empezá tu propio espacio
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* DIALOG */}
      <Dialog
        open={dialogCrear}
        onClose={() => setDialogCrear(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 1,

            background: 'rgba(255,255,255,0.92)',

            backdropFilter: 'blur(20px)',

            boxShadow:
              '0 20px 60px rgba(15,23,42,0.18)',

            border:
              '1px solid rgba(255,255,255,0.9)',
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            color: '#0F172A',
            fontSize: 24,
            pb: 1,
          }}
        >
          Nueva comunidad
        </DialogTitle>

        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2.2,
            pt: '12px !important',
          }}
        >

          <TextField
            label="Nombre"
            value={form.nombre}
            onChange={e =>
              setForm(f => ({
                ...f,
                nombre: e.target.value,
              }))
            }
            fullWidth
          />

          <TextField
            label="Descripción"
            value={form.descripcion}
            onChange={e =>
              setForm(f => ({
                ...f,
                descripcion: e.target.value,
              }))
            }
            multiline
            rows={3}
            fullWidth
          />

          <TextField
            label="URL de foto"
            value={form.fotoUrl}
            onChange={e =>
              setForm(f => ({
                ...f,
                fotoUrl: e.target.value,
              }))
            }
            fullWidth
          />
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 3,
            pt: 1,
          }}
        >
          <Button
            onClick={() => setDialogCrear(false)}
            sx={{
              color: '#64748B',
              fontWeight: 600,
            }}
          >
            Cancelar
          </Button>

         <Button
            onClick={handleCrear}
            variant="contained"
            disabled={!form.nombre.trim()}
            sx={{
                borderRadius: 1,

                px: 2.5,
                py: 1,

                fontWeight: 700,

                bgcolor: '#2563EB',

                boxShadow:
                '0 10px 25px rgba(37,99,235,0.22)',

                '&:hover': {
                bgcolor: '#1D4ED8',
                },
            }}
            >
            Crear
         </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}