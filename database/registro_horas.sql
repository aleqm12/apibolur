CREATE TABLE registro_horas (
    id_registro INT NOT NULL AUTO_INCREMENT,
    id_usuario VARCHAR(20) NOT NULL,
    id_subtarea VARCHAR(20) NOT NULL,
    fecha DATE NOT NULL,
    horas DECIMAL(4,2) NOT NULL,
    comentarios TEXT DEFAULT NULL,
    estado_aprobacion ENUM('Pendiente', 'Aprobado', 'Rechazado') DEFAULT 'Pendiente',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_registro),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (id_subtarea) REFERENCES sub_tareas(id_subtarea)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
